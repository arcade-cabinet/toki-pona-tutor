import { getDatabase, saveWebStore } from "./database";
import { PARTY_SIZE_MAX } from "./constants";
import { markCaught, markSeen, type BestiaryState } from "../../modules/main/bestiary";
import type { ClueRecord } from "../../modules/main/dictionary-export";
import { observe, type SentenceRecord } from "../../modules/main/sentence-log";

export async function recordClue(clueId: string): Promise<void> {
    const db = await getDatabase();
    await db.run(
        `INSERT INTO mastered_words (tp_word, sightings, mastered_at)
         VALUES (?, 1, ?)
         ON CONFLICT(tp_word) DO UPDATE SET sightings = sightings + 1`,
        [clueId, new Date().toISOString()],
    );
    await saveWebStore();
}

export async function getClueSightings(clueId: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.query(`SELECT sightings FROM mastered_words WHERE tp_word = ?`, [
        clueId,
    ]);
    const row = result.values?.[0];
    return row ? Number(row.sightings) : 0;
}

export async function listClues(threshold = 3): Promise<string[]> {
    const db = await getDatabase();
    const result = await db.query(
        `SELECT tp_word FROM mastered_words WHERE sightings >= ? ORDER BY tp_word`,
        [threshold],
    );
    return (result.values ?? []).map((row) => String(row.tp_word));
}

export async function listClueRecords(threshold = 3): Promise<ClueRecord[]> {
    const db = await getDatabase();
    const result = await db.query(
        `SELECT tp_word, sightings, mastered_at
         FROM mastered_words
         WHERE sightings >= ?
         ORDER BY tp_word`,
        [threshold],
    );
    return (result.values ?? []).map((row) => ({
        id: String(row.tp_word),
        sightings: Number(row.sightings ?? 0),
        mastered_at: String(row.mastered_at),
    }));
}

export const recordMasteredWord = recordClue;
export const getWordSightings = getClueSightings;
export const listMasteredWords = listClues;
export const listMasteredWordRecords = listClueRecords;

export async function recordSentenceLine(input: {
    text?: string;
    tp?: string;
    en?: string;
    source: string;
    now?: string;
}): Promise<SentenceRecord> {
    const db = await getDatabase();
    const text = input.text ?? input.tp ?? input.en ?? "";
    const existing = await getSentenceRecord(text);
    const observed = observe(
        {
            text,
            en: input.en ?? text,
            source: input.source,
            now: input.now ?? new Date().toISOString(),
        },
        existing,
    );

    await db.run(
        `INSERT INTO sentence_log (tp, en, first_seen, sightings, source)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(tp) DO UPDATE SET sightings = excluded.sightings`,
        [
            observed.record.text,
            observed.record.en,
            observed.record.first_seen,
            observed.record.sightings,
            observed.record.source,
        ],
    );
    await saveWebStore();
    return observed.record;
}

export async function getSentenceRecord(text: string): Promise<SentenceRecord | undefined> {
    const db = await getDatabase();
    const result = await db.query(
        `SELECT tp, en, first_seen, sightings, source FROM sentence_log WHERE tp = ? LIMIT 1`,
        [text],
    );
    const row = result.values?.[0];
    return row ? mapSentenceRecord(row) : undefined;
}

export async function getSentenceLogCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.query(`SELECT COUNT(*) AS count FROM sentence_log`);
    return Number(result.values?.[0]?.count ?? 0);
}

export async function listSentenceLog(limit = 10): Promise<SentenceRecord[]> {
    const db = await getDatabase();
    const result = await db.query(
        `SELECT tp, en, first_seen, sightings, source
         FROM sentence_log
         ORDER BY first_seen DESC, tp
         LIMIT ?`,
        [limit],
    );
    return (result.values ?? []).map(mapSentenceRecord);
}

function mapSentenceRecord(row: Record<string, unknown>): SentenceRecord {
    return {
        text: String(row.tp),
        en: String(row.en),
        first_seen: String(row.first_seen),
        sightings: Number(row.sightings ?? 0),
        source: String(row.source),
    };
}

export async function setFlag(flagId: string, value: string): Promise<void> {
    const db = await getDatabase();
    await db.run(
        `INSERT INTO flags (flag_id, value, set_at)
         VALUES (?, ?, ?)
         ON CONFLICT(flag_id) DO UPDATE SET value = excluded.value, set_at = excluded.set_at`,
        [flagId, value, new Date().toISOString()],
    );
    await saveWebStore();
}

export async function getFlag(flagId: string): Promise<string | null> {
    const db = await getDatabase();
    const result = await db.query(`SELECT value FROM flags WHERE flag_id = ?`, [flagId]);
    const row = result.values?.[0];
    return row ? String(row.value) : null;
}

export async function addToParty(speciesId: string, level: number): Promise<number | null> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    // Atomic check-and-insert: the WHERE clause prevents the insert when the
    // roster is already full, eliminating the TOCTOU race between a separate
    // COUNT query and the INSERT. Party size cap comes from PARTY_SIZE_MAX.
    const result = await db.run(
        `INSERT INTO party_roster (slot, species_id, level, caught_at)
         SELECT (SELECT COUNT(*) FROM party_roster), ?, ?, ?
         WHERE (SELECT COUNT(*) FROM party_roster) < ${PARTY_SIZE_MAX}`,
        [speciesId, level, now],
    );
    if (!result.changes || (result.changes.changes ?? 0) === 0) return null;
    await saveWebStore();
    const slotResult = await db.query(
        `SELECT slot FROM party_roster WHERE species_id = ? AND caught_at = ? ORDER BY slot DESC LIMIT 1`,
        [speciesId, now],
    );
    return Number(slotResult.values?.[0]?.slot ?? 0);
}

export async function addToInventory(itemId: string, count: number): Promise<void> {
    const db = await getDatabase();
    await db.run(
        `INSERT INTO inventory_items (item_id, count, added_at)
         VALUES (?, ?, ?)
         ON CONFLICT(item_id) DO UPDATE SET count = count + excluded.count`,
        [itemId, count, new Date().toISOString()],
    );
    await saveWebStore();
}

export async function setInventoryCount(itemId: string, count: number): Promise<void> {
    if (!Number.isInteger(count) || count < 0) {
        throw new Error("[inventory] count must be a non-negative integer");
    }

    const db = await getDatabase();
    if (count === 0) {
        await db.run(`DELETE FROM inventory_items WHERE item_id = ?`, [itemId]);
    } else {
        await db.run(
            `INSERT INTO inventory_items (item_id, count, added_at)
             VALUES (?, ?, ?)
             ON CONFLICT(item_id) DO UPDATE SET count = excluded.count`,
            [itemId, count, new Date().toISOString()],
        );
    }
    await saveWebStore();
}

export async function getInventoryCount(itemId: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.query(`SELECT count FROM inventory_items WHERE item_id = ? LIMIT 1`, [
        itemId,
    ]);
    return Number(result.values?.[0]?.count ?? 0);
}

export type InventoryItemStack = {
    item_id: string;
    count: number;
};

export async function listInventoryItems(): Promise<InventoryItemStack[]> {
    const db = await getDatabase();
    const result = await db.query("SELECT item_id, count FROM inventory_items ORDER BY item_id");
    return (result.values ?? []).map((row) => ({
        item_id: String(row.item_id),
        count: Number(row.count ?? 0),
    }));
}

export async function consumeInventoryItem(itemId: string, count = 1): Promise<boolean> {
    if (!Number.isInteger(count) || count <= 0) {
        throw new Error("[inventory] consume count must be a positive integer");
    }

    const db = await getDatabase();
    const result = await db.run(
        `UPDATE inventory_items
         SET count = count - ?
         WHERE item_id = ? AND count >= ?`,
        [count, itemId, count],
    );
    if (!result.changes || (result.changes.changes ?? 0) === 0) return false;
    await db.run(`DELETE FROM inventory_items WHERE item_id = ? AND count <= 0`, [itemId]);
    await saveWebStore();
    return true;
}

export async function getParty(): Promise<
    Array<{ slot: number; species_id: string; level: number; xp: number }>
> {
    const db = await getDatabase();
    const result = await db.query(
        `SELECT slot, species_id, level, xp FROM party_roster ORDER BY slot`,
    );
    return (result.values ?? []).map((row) => ({
        slot: Number(row.slot),
        species_id: String(row.species_id),
        level: Number(row.level),
        xp: Number(row.xp ?? 0),
    }));
}

export async function getPartyWithHealth(): Promise<
    Array<{
        slot: number;
        species_id: string;
        level: number;
        xp: number;
        current_hp: number | null;
    }>
> {
    const db = await getDatabase();
    const result = await db.query(
        `SELECT slot, species_id, level, xp, current_hp FROM party_roster ORDER BY slot`,
    );
    return (result.values ?? []).map((row) => ({
        slot: Number(row.slot),
        species_id: String(row.species_id),
        level: Number(row.level),
        xp: Number(row.xp ?? 0),
        current_hp: row.current_hp == null ? null : Number(row.current_hp),
    }));
}

export async function setPartyCurrentHp(slot: number, currentHp: number): Promise<boolean> {
    if (!Number.isInteger(slot) || slot < 0) {
        throw new Error("[party] slot must be a non-negative integer");
    }
    if (!Number.isFinite(currentHp)) {
        throw new Error("[party] current HP must be finite");
    }

    const db = await getDatabase();
    const result = await db.run(`UPDATE party_roster SET current_hp = ? WHERE slot = ?`, [
        Math.max(0, Math.round(currentHp)),
        slot,
    ]);
    if (!result.changes || (result.changes.changes ?? 0) === 0) return false;
    await saveWebStore();
    return true;
}

export async function setPartyOrder(orderedParty: ReadonlyArray<{ slot: number }>): Promise<void> {
    const current = await getParty();
    if (current.length !== orderedParty.length) {
        throw new Error("[party] reordered party must include every current slot");
    }

    const currentSlots = new Set(current.map((member) => member.slot));
    const requestedSlots = orderedParty.map((member) => member.slot);
    if (
        requestedSlots.some((slot) => !currentSlots.has(slot)) ||
        new Set(requestedSlots).size !== requestedSlots.length
    ) {
        throw new Error("[party] reordered party contains an unknown or duplicate slot");
    }

    if (current.map((member) => member.slot).join(",") === requestedSlots.join(",")) return;

    const statements = [
        "UPDATE party_roster SET slot = slot + 1000",
        ...orderedParty.map((member, newSlot) => {
            const originalSlot = Number(member.slot);
            if (!Number.isInteger(originalSlot) || !Number.isInteger(newSlot)) {
                throw new Error("[party] reordered party slots must be integers");
            }
            return `UPDATE party_roster SET slot = ${newSlot} WHERE slot = ${originalSlot + 1000}`;
        }),
    ].join(";\n");

    const db = await getDatabase();
    await db.execute(statements);
    await saveWebStore();
}

/**
 * Atomically add XP to the lead party creature (slot 0) and persist the
 * new level that the updated total corresponds to. Callers compute the
 * level via xp-curve.gainXp before calling; this is the DB write step.
 *
 * Returns the fresh row or null if the party is empty.
 */
export async function awardXpToLead(
    newXp: number,
    newLevel: number,
): Promise<{ species_id: string; level: number; xp: number } | null> {
    const db = await getDatabase();
    await db.run(`UPDATE party_roster SET xp = ?, level = ? WHERE slot = 0`, [newXp, newLevel]);
    const result = await db.query(`SELECT species_id, level, xp FROM party_roster WHERE slot = 0`);
    const row = result.values?.[0];
    if (!row) return null;
    await saveWebStore();
    return {
        species_id: String(row.species_id),
        level: Number(row.level),
        xp: Number(row.xp ?? 0),
    };
}

export async function logEncounter(
    speciesId: string,
    mapId: string,
    outcome: "caught" | "fled" | "defeated" | "escaped",
): Promise<void> {
    const db = await getDatabase();
    await db.run(
        `INSERT INTO encounter_log (species_id, map_id, outcome, logged_at)
         VALUES (?, ?, ?, ?)`,
        [speciesId, mapId, outcome, new Date().toISOString()],
    );
    await saveWebStore();
}

export async function getBestiaryState(): Promise<BestiaryState> {
    const db = await getDatabase();
    const result = await db.query(
        "SELECT species_id, seen_at, caught_at FROM bestiary_entries ORDER BY species_id",
    );
    return Object.fromEntries(
        (result.values ?? []).map((row) => [
            String(row.species_id),
            {
                ...(row.seen_at == null ? {} : { seenAt: String(row.seen_at) }),
                ...(row.caught_at == null ? {} : { caughtAt: String(row.caught_at) }),
            },
        ]),
    );
}

export async function setBestiaryState(state: BestiaryState): Promise<void> {
    const db = await getDatabase();
    await db.run("DELETE FROM bestiary_entries");
    for (const [speciesId, record] of Object.entries(state)) {
        if (!record.seenAt && !record.caughtAt) continue;
        await db.run(
            "INSERT INTO bestiary_entries (species_id, seen_at, caught_at) VALUES (?, ?, ?)",
            [speciesId, record.seenAt ?? null, record.caughtAt ?? null],
        );
    }
    await saveWebStore();
}

export async function recordBestiarySeen(speciesId: string, at = new Date()): Promise<void> {
    await setBestiaryState(markSeen(await getBestiaryState(), speciesId, at));
}

export async function recordBestiaryCaught(speciesId: string, at = new Date()): Promise<void> {
    await setBestiaryState(markCaught(await getBestiaryState(), speciesId, at));
}
