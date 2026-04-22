import { getDatabase, saveWebStore } from "./database";
import { preferences, KEYS } from "./preferences";

const GAMEPLAY_PREFERENCE_KEYS = [
    KEYS.currentMapId,
    KEYS.journeyBeat,
    KEYS.partySlot,
    KEYS.lastSafeMapId,
    KEYS.lastSafeSpawnX,
    KEYS.lastSafeSpawnY,
    KEYS.starterChosen,
] as const;

export const SAVE_RUNTIME_STATE_KEY = "__pokiSoweliRuntimeState";

type GameplayPreferenceKey = (typeof GAMEPLAY_PREFERENCE_KEYS)[number];

function isGameplayPreferenceKey(key: string): key is GameplayPreferenceKey {
    return (GAMEPLAY_PREFERENCE_KEYS as readonly string[]).includes(key);
}

type PersistedFlag = {
    flag_id: string;
    value: string;
    set_at: string;
};

type PersistedWord = {
    tp_word: string;
    sightings: number;
    mastered_at: string;
};

type PersistedSentence = {
    tp: string;
    en: string;
    first_seen: string;
    sightings: number;
    source: string;
};

type PersistedEncounter = {
    id: number;
    species_id: string;
    map_id: string;
    outcome: string;
    logged_at: string;
};

type PersistedPartyMember = {
    slot: number;
    species_id: string;
    level: number;
    xp: number;
    current_hp?: number | null;
    caught_at: string;
};

type PersistedInventoryItem = {
    item_id: string;
    count: number;
    added_at: string;
};

type PersistedBestiaryEntry = {
    species_id: string;
    seen_at: string | null;
    caught_at: string | null;
};

export interface PersistedRuntimeState {
    preferences: Partial<Record<GameplayPreferenceKey, string>>;
    flags: PersistedFlag[];
    masteredWords: PersistedWord[];
    sentenceLog?: PersistedSentence[];
    encounterLog: PersistedEncounter[];
    partyRoster: PersistedPartyMember[];
    inventoryItems: PersistedInventoryItem[];
    bestiaryEntries?: PersistedBestiaryEntry[];
}

export function isPersistedRuntimeState(value: unknown): value is PersistedRuntimeState {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<PersistedRuntimeState>;
    return (
        Array.isArray(candidate.flags) &&
        Array.isArray(candidate.masteredWords) &&
        (candidate.sentenceLog === undefined || Array.isArray(candidate.sentenceLog)) &&
        Array.isArray(candidate.encounterLog) &&
        Array.isArray(candidate.partyRoster) &&
        Array.isArray(candidate.inventoryItems) &&
        (candidate.bestiaryEntries === undefined || Array.isArray(candidate.bestiaryEntries)) &&
        !!candidate.preferences &&
        typeof candidate.preferences === "object"
    );
}

export async function exportPersistedRuntimeState(): Promise<PersistedRuntimeState> {
    const db = await getDatabase();
    const preferenceEntries = await Promise.all(
        GAMEPLAY_PREFERENCE_KEYS.map(async (key) => {
            const value = await preferences.get(key);
            return value === null ? null : ([key, value] as const);
        }),
    );

    const preferencesRecord = Object.fromEntries(
        preferenceEntries.filter(
            (entry): entry is readonly [GameplayPreferenceKey, string] => entry !== null,
        ),
    ) as Partial<Record<GameplayPreferenceKey, string>>;

    const [
        flags,
        masteredWords,
        sentenceLog,
        encounterLog,
        partyRoster,
        inventoryItems,
        bestiaryEntries,
    ] = await Promise.all([
        db.query("SELECT flag_id, value, set_at FROM flags ORDER BY flag_id"),
        db.query("SELECT tp_word, sightings, mastered_at FROM mastered_words ORDER BY tp_word"),
        db.query(
            "SELECT tp, en, first_seen, sightings, source FROM sentence_log ORDER BY first_seen, tp",
        ),
        db.query(
            "SELECT id, species_id, map_id, outcome, logged_at FROM encounter_log ORDER BY id",
        ),
        db.query(
            "SELECT slot, species_id, level, xp, current_hp, caught_at FROM party_roster ORDER BY slot",
        ),
        db.query("SELECT item_id, count, added_at FROM inventory_items ORDER BY item_id"),
        db.query("SELECT species_id, seen_at, caught_at FROM bestiary_entries ORDER BY species_id"),
    ]);

    return {
        preferences: preferencesRecord,
        flags: (flags.values ?? []).map((row) => ({
            flag_id: String(row.flag_id),
            value: String(row.value),
            set_at: String(row.set_at),
        })),
        masteredWords: (masteredWords.values ?? []).map((row) => ({
            tp_word: String(row.tp_word),
            sightings: Number(row.sightings),
            mastered_at: String(row.mastered_at),
        })),
        sentenceLog: (sentenceLog.values ?? []).map((row) => ({
            tp: String(row.tp),
            en: String(row.en),
            first_seen: String(row.first_seen),
            sightings: Number(row.sightings),
            source: String(row.source),
        })),
        encounterLog: (encounterLog.values ?? []).map((row) => ({
            id: Number(row.id),
            species_id: String(row.species_id),
            map_id: String(row.map_id),
            outcome: String(row.outcome),
            logged_at: String(row.logged_at),
        })),
        partyRoster: (partyRoster.values ?? []).map((row) => ({
            slot: Number(row.slot),
            species_id: String(row.species_id),
            level: Number(row.level),
            xp: Number(row.xp ?? 0),
            current_hp: row.current_hp == null ? null : Number(row.current_hp),
            caught_at: String(row.caught_at),
        })),
        inventoryItems: (inventoryItems.values ?? []).map((row) => ({
            item_id: String(row.item_id),
            count: Number(row.count),
            added_at: String(row.added_at),
        })),
        bestiaryEntries: (bestiaryEntries.values ?? []).map((row) => ({
            species_id: String(row.species_id),
            seen_at: row.seen_at == null ? null : String(row.seen_at),
            caught_at: row.caught_at == null ? null : String(row.caught_at),
        })),
    };
}

export async function importPersistedRuntimeState(state: PersistedRuntimeState): Promise<void> {
    const db = await getDatabase();
    await clearGameplayPreferences();
    await clearGameplayTables(db);

    await Promise.all(
        Object.entries(state.preferences).map(async ([key, value]) => {
            if (isGameplayPreferenceKey(key) && typeof value === "string") {
                await preferences.set(key, value);
            }
        }),
    );

    for (const row of state.flags) {
        await db.run("INSERT INTO flags (flag_id, value, set_at) VALUES (?, ?, ?)", [
            row.flag_id,
            row.value,
            row.set_at,
        ]);
    }

    for (const row of state.masteredWords) {
        await db.run(
            "INSERT INTO mastered_words (tp_word, sightings, mastered_at) VALUES (?, ?, ?)",
            [row.tp_word, row.sightings, row.mastered_at],
        );
    }

    for (const row of state.sentenceLog ?? []) {
        await db.run(
            "INSERT INTO sentence_log (tp, en, first_seen, sightings, source) VALUES (?, ?, ?, ?, ?)",
            [row.tp, row.en, row.first_seen, row.sightings, row.source],
        );
    }

    for (const row of state.encounterLog) {
        await db.run(
            "INSERT INTO encounter_log (id, species_id, map_id, outcome, logged_at) VALUES (?, ?, ?, ?, ?)",
            [row.id, row.species_id, row.map_id, row.outcome, row.logged_at],
        );
    }

    for (const row of state.partyRoster) {
        await db.run(
            "INSERT INTO party_roster (slot, species_id, level, xp, current_hp, caught_at) VALUES (?, ?, ?, ?, ?, ?)",
            [row.slot, row.species_id, row.level, row.xp, row.current_hp ?? null, row.caught_at],
        );
    }

    for (const row of state.inventoryItems) {
        await db.run("INSERT INTO inventory_items (item_id, count, added_at) VALUES (?, ?, ?)", [
            row.item_id,
            row.count,
            row.added_at,
        ]);
    }

    for (const row of state.bestiaryEntries ?? []) {
        await db.run(
            "INSERT INTO bestiary_entries (species_id, seen_at, caught_at) VALUES (?, ?, ?)",
            [row.species_id, row.seen_at, row.caught_at],
        );
    }

    await saveWebStore();
}

export async function resetPersistedRuntimeState(
    options: { includeSaves?: boolean } = {},
): Promise<void> {
    const db = await getDatabase();
    await clearGameplayPreferences();
    await clearGameplayTables(db);
    if (options.includeSaves) {
        await db.run("DELETE FROM saves");
    }
    await saveWebStore();
}

async function clearGameplayPreferences(): Promise<void> {
    await Promise.all(GAMEPLAY_PREFERENCE_KEYS.map((key) => preferences.remove(key)));
}

async function clearGameplayTables(db: Awaited<ReturnType<typeof getDatabase>>): Promise<void> {
    await db.run("DELETE FROM flags");
    await db.run("DELETE FROM mastered_words");
    await db.run("DELETE FROM sentence_log");
    await db.run("DELETE FROM encounter_log");
    await db.run("DELETE FROM party_roster");
    await db.run("DELETE FROM inventory_items");
    await db.run("DELETE FROM bestiary_entries");
}
