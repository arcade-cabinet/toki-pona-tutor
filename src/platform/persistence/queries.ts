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
