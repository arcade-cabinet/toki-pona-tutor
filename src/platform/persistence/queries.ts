import { getDatabase, saveWebStore } from './database';

export async function recordMasteredWord(tpWord: string): Promise<void> {
    const db = await getDatabase();
    await db.run(
        `INSERT INTO mastered_words (tp_word, sightings, mastered_at)
         VALUES (?, 1, ?)
         ON CONFLICT(tp_word) DO UPDATE SET sightings = sightings + 1`,
        [tpWord, new Date().toISOString()],
    );
    await saveWebStore();
}

export async function getWordSightings(tpWord: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.query(
        `SELECT sightings FROM mastered_words WHERE tp_word = ?`,
        [tpWord],
    );
    const row = result.values?.[0];
    return row ? Number(row.sightings) : 0;
}

export async function listMasteredWords(threshold = 3): Promise<string[]> {
    const db = await getDatabase();
    const result = await db.query(
        `SELECT tp_word FROM mastered_words WHERE sightings >= ? ORDER BY tp_word`,
        [threshold],
    );
    return (result.values ?? []).map((row) => String(row.tp_word));
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
    const result = await db.query(
        `SELECT value FROM flags WHERE flag_id = ?`,
        [flagId],
    );
    const row = result.values?.[0];
    return row ? String(row.value) : null;
}

export async function addToParty(speciesId: string, level: number): Promise<number | null> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    // Atomic check-and-insert: the WHERE clause prevents the insert when the
    // roster already has 6 members, eliminating the TOCTOU race between a
    // separate COUNT query and the INSERT.
    const result = await db.run(
        `INSERT INTO party_roster (slot, species_id, level, caught_at)
         SELECT (SELECT COUNT(*) FROM party_roster), ?, ?, ?
         WHERE (SELECT COUNT(*) FROM party_roster) < 6`,
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

export async function getParty(): Promise<Array<{ slot: number; species_id: string; level: number; xp: number }>> {
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

/**
 * Atomically add XP to the lead party creature (slot 0) and persist the
 * new level that the updated total corresponds to. Callers compute the
 * level via xp-curve.gainXp before calling; this is the DB write step.
 *
 * Returns the fresh row or null if the party is empty.
 */
export async function awardXpToLead(newXp: number, newLevel: number): Promise<{ species_id: string; level: number; xp: number } | null> {
    const db = await getDatabase();
    await db.run(
        `UPDATE party_roster SET xp = ?, level = ? WHERE slot = 0`,
        [newXp, newLevel],
    );
    const result = await db.query(
        `SELECT species_id, level, xp FROM party_roster WHERE slot = 0`,
    );
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
    outcome: 'caught' | 'fled' | 'defeated' | 'escaped',
): Promise<void> {
    const db = await getDatabase();
    await db.run(
        `INSERT INTO encounter_log (species_id, map_id, outcome, logged_at)
         VALUES (?, ?, ?, ?)`,
        [speciesId, mapId, outcome, new Date().toISOString()],
    );
    await saveWebStore();
}
