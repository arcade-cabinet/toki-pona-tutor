import { VOCABULARY_SCREEN_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

/** Append-only field note log for player-facing investigation text. */

export interface SentenceRecord {
    text: string;
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
 * Merge an incoming field-note observation against the existing
 * row for that note text. Returns the updated row + a flag indicating
 * whether this was the player's first encounter.
 *
 * @example
 * observe(
 *   { text: 'The orchard path is safe.', source: 'jan_sewi_intro', now: '2026-04-20T00:00:00Z' },
 *   undefined,
 * )
 * // → { record: { text: 'The orchard path is safe.', first_seen: '...', sightings: 1,
 * //               source: 'jan_sewi_intro' }, isNewSighting: true }
 *
 * observe(
 *   { text: 'The orchard path is safe.', source: 'jan_moku_stall', now: '2026-04-20T01:00:00Z' },
 *   existingRecord,
 * )
 * // → { record: { ..., sightings: 2 }, isNewSighting: false }
 */
export function observe(
    input: { text: string; en?: string; source: string; now: string },
    existing: SentenceRecord | undefined,
): LogObserveResult {
    if (!existing) {
        return {
            record: {
                text: input.text,
                en: input.en ?? input.text,
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
 * Index entries by note text. Returns a new map; does not mutate input.
 */
export function buildIndex(entries: SentenceRecord[]): Map<string, SentenceRecord> {
    const map = new Map<string, SentenceRecord>();
    for (const entry of entries) map.set(entry.text, entry);
    return map;
}

/**
 * Most-sighted N sentences, sorted by sightings desc then first_seen asc.
 * Useful for a "most-seen notes" view in the clues screen.
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
 * sharing. One line per note: `text    // sightings=N    first=ISO`.
 */
export function exportDump(entries: SentenceRecord[]): string {
    return [...entries]
        .sort((a, b) => a.text.localeCompare(b.text))
        .map((e) =>
            formatGameplayTemplate(VOCABULARY_SCREEN_CONFIG.sentenceDumpLineTemplate, {
                text: e.text,
                sightings: e.sightings,
                first_seen: e.first_seen,
            }),
        )
        .join("\n");
}
