import { VOCABULARY_SCREEN_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

/**
 * lipu nasin — personal sentence log — T8-01.
 *
 * Every dialog line the player hears is logged. The log powers:
 *   - "I've seen this before" highlighting in dialog (deferred to UI)
 *   - Per-species description re-read from inventory (T8-02)
 *   - End-of-playthrough personal dictionary card export (T8-06)
 *
 * Log entries are append-only with a `first_seen` timestamp. Re-encounters
 * bump a `sightings` counter but never overwrite the first-seen row. The
 * pure-logic here decides what to insert vs what to bump; the SQLite
 * table (`sentence_log` — a v5→v6 migration in `database.ts`) is the
 * caller's responsibility.
 *
 * The log is NOT an EN-gloss tool. We log the TP line the player heard;
 * the EN source is stored alongside for eventual export but never shown
 * to the player during play (per DESIGN.md — no translation UI).
 */

export interface SentenceRecord {
    tp: string;
    en: string;
    first_seen: string; // ISO timestamp
    sightings: number;
    /** Where the line was first heard — dialog node id or 'encounter'. */
    source: string;
}

export interface LogObserveResult {
    /** The row as it should be persisted after this observation. */
    record: SentenceRecord;
    /** True if this was a first-ever encounter (caller may fire a toast). */
    isNewSighting: boolean;
}

/**
 * Merge an incoming (tp, en, source) observation against the existing
 * row for that tp sentence. Returns the updated row + a flag indicating
 * whether this was the player's first encounter.
 *
 * @example
 * observe(
 *   { tp: 'mi moku', en: 'I eat', source: 'jan_sewi_intro', now: '2026-04-20T00:00:00Z' },
 *   undefined,
 * )
 * // → { record: { tp: 'mi moku', en: 'I eat', first_seen: '...', sightings: 1,
 * //               source: 'jan_sewi_intro' }, isNewSighting: true }
 *
 * observe(
 *   { tp: 'mi moku', en: 'I eat', source: 'jan_moku_stall', now: '2026-04-20T01:00:00Z' },
 *   existingRecord,
 * )
 * // → { record: { ..., sightings: 2 }, isNewSighting: false }
 */
export function observe(
    input: { tp: string; en: string; source: string; now: string },
    existing: SentenceRecord | undefined,
): LogObserveResult {
    if (!existing) {
        return {
            record: {
                tp: input.tp,
                en: input.en,
                first_seen: input.now,
                sightings: 1,
                source: input.source,
            },
            isNewSighting: true,
        };
    }
    return {
        record: {
            ...existing,
            sightings: existing.sightings + 1,
        },
        isNewSighting: false,
    };
}

/**
 * Index entries by TP sentence. Returns a new map; does not mutate input.
 */
export function buildIndex(entries: SentenceRecord[]): Map<string, SentenceRecord> {
    const map = new Map<string, SentenceRecord>();
    for (const entry of entries) map.set(entry.tp, entry);
    return map;
}

/**
 * Most-sighted N sentences, sorted by sightings desc then first_seen asc.
 * Useful for a "your most-heard lines" view in the vocabulary screen.
 */
export function mostSighted(entries: SentenceRecord[], limit = 10): SentenceRecord[] {
    return [...entries]
        .sort((a, b) => {
            if (b.sightings !== a.sightings) return b.sightings - a.sightings;
            return a.first_seen.localeCompare(b.first_seen);
        })
        .slice(0, limit);
}

/**
 * All entries first seen within the last N real-time hours, sorted
 * first-seen desc. Powers a "recent" panel.
 */
export function recentEntries(
    entries: SentenceRecord[],
    now: string,
    withinHours: number,
): SentenceRecord[] {
    const nowMs = Date.parse(now);
    const windowMs = withinHours * 3600 * 1000;
    return [...entries]
        .filter((e) => nowMs - Date.parse(e.first_seen) <= windowMs)
        .sort((a, b) => b.first_seen.localeCompare(a.first_seen));
}

/**
 * Export the full log as a newline-delimited text dump suitable for
 * sharing. One line per sentence: `TP    // sightings=N    first=ISO`.
 * EN is omitted from the export for the same reason the runtime hides
 * it — the whole point is that the player now knows the TP.
 */
export function exportDump(entries: SentenceRecord[]): string {
    return [...entries]
        .sort((a, b) => a.tp.localeCompare(b.tp))
        .map((e) =>
            formatGameplayTemplate(VOCABULARY_SCREEN_CONFIG.sentenceDumpLineTemplate, {
                tp: e.tp,
                sightings: e.sightings,
                first_seen: e.first_seen,
            }),
        )
        .join("\n");
}
