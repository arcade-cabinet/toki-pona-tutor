/**
 * Capacitor SQLite connection with jeep-sqlite / sql.js web fallback.
 *
 * Contract:
 * - On native (iOS/Android): uses @capacitor-community/sqlite directly.
 * - On web: jeep-sqlite custom element + sql.js wasm, autosave enabled.
 * - Feature code calls getDatabase() and never touches the connection directly.
 * - Never use IndexedDB or localStorage from feature code.
 */

/// <reference types="vite/client" />
import { Capacitor } from '@capacitor/core';
import {
    CapacitorSQLite,
    SQLiteConnection,
    type SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { defineCustomElements as defineJeepSqlite } from 'jeep-sqlite/loader';

const DB_NAME = 'poki_soweli';
// Increment DB_VERSION when the SCHEMA changes and add a migration step
// in migrateSchema() below. The current version is tracked in SQLite's
// PRAGMA user_version so future builds can apply incremental upgrades.
const DB_VERSION = 3;

const sqlite = new SQLiteConnection(CapacitorSQLite);
let connectionPromise: Promise<SQLiteDBConnection> | null = null;
let webReadyPromise: Promise<void> | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS saves (
  player_key TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  saved_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mastered_words (
  tp_word     TEXT PRIMARY KEY,
  sightings   INTEGER NOT NULL DEFAULT 0,
  mastered_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS flags (
  flag_id TEXT PRIMARY KEY,
  value   TEXT NOT NULL,
  set_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS encounter_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  species_id  TEXT NOT NULL,
  map_id      TEXT NOT NULL,
  outcome     TEXT NOT NULL,
  logged_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS party_roster (
  slot       INTEGER PRIMARY KEY,
  species_id TEXT NOT NULL,
  level      INTEGER NOT NULL,
  xp         INTEGER NOT NULL DEFAULT 0,
  caught_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_items (
  item_id  TEXT PRIMARY KEY,
  count    INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL
);
`;

export async function getDatabase(): Promise<SQLiteDBConnection> {
    if (!connectionPromise) {
        connectionPromise = initDatabase().catch((err) => {
            connectionPromise = null;
            throw err;
        });
    }
    return connectionPromise;
}

async function initDatabase(): Promise<SQLiteDBConnection> {
    await prepareWebStore();
    await sqlite.checkConnectionsConsistency();
    const existing = await sqlite.isConnection(DB_NAME, false);
    const db = existing.result
        ? await sqlite.retrieveConnection(DB_NAME, false)
        : await sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);
    await db.open();
    await db.execute(SCHEMA);
    await migrateSchema(db);
    return db;
}

/**
 * Applies incremental schema migrations tracked by PRAGMA user_version.
 *
 * Each case corresponds to a DB_VERSION bump. Add new cases here when
 * the SCHEMA constant gains new tables or columns, then increment DB_VERSION.
 *
 * Current migrations:
 *   v1 → v2: adds inventory_items table (idempotent via CREATE TABLE IF NOT EXISTS).
 *   v2 → v3: adds xp column to party_roster. ALTER TABLE guarded by a
 *            PRAGMA table_info check so re-running this migration on an
 *            already-migrated v3 DB is a no-op.
 */
async function migrateSchema(db: SQLiteDBConnection): Promise<void> {
    const versionResult = await db.query('PRAGMA user_version');
    const oldVersion = Number(versionResult.values?.[0]?.user_version ?? 0);
    if (oldVersion >= DB_VERSION) return;

    if (oldVersion < 3) {
        const cols = await db.query('PRAGMA table_info(party_roster)');
        const hasXp = (cols.values ?? []).some((c: { name?: string }) => c.name === 'xp');
        if (!hasXp) {
            await db.execute('ALTER TABLE party_roster ADD COLUMN xp INTEGER NOT NULL DEFAULT 0');
        }
    }

    await db.execute(`PRAGMA user_version = ${DB_VERSION}`);
}

async function prepareWebStore(): Promise<void> {
    if (Capacitor.getPlatform() !== 'web') return;
    if (webReadyPromise) return webReadyPromise;

    webReadyPromise = (async () => {
        // sql.js / jeep-sqlite wasm files are copied into the build output by
        // the `copy-wasm` vite plugin (see vite.config.ts). At runtime they
        // are served from <base>assets/, matching the Vite `base` setting.
        const basePath = `${import.meta.env.BASE_URL}assets`;
        defineJeepSqlite(window);

        await customElements.whenDefined('jeep-sqlite');

        if (!document.querySelector('jeep-sqlite')) {
            const el = document.createElement('jeep-sqlite');
            el.setAttribute('autosave', 'true');
            el.setAttribute('wasmpath', basePath);
            document.body.appendChild(el);
        }

        await sqlite.initWebStore();
    })().catch((error) => {
        // Reset so subsequent calls can retry initialization rather than
        // returning the permanently-rejected promise.
        webReadyPromise = null;
        throw error;
    });

    return webReadyPromise;
}

export async function saveWebStore(database = DB_NAME): Promise<void> {
    if (Capacitor.getPlatform() !== 'web') return;
    await getDatabase();
    await sqlite.saveToStore(database);
}

export async function closeDatabase(): Promise<void> {
    const existing = await sqlite.isConnection(DB_NAME, false);
    if (existing.result) {
        await sqlite.closeConnection(DB_NAME, false);
    }
    connectionPromise = null;
}
