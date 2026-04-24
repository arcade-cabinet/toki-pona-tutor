import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EVENTS = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/gameplay/events.json'), 'utf-8'),
) as {
    maps: Record<
        string,
        Array<{
            id: string;
            kind: string;
            dialog_id?: string;
            gated_dialog_id?: string;
            quest_id?: string;
        }>
    >;
};

const WORLD = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/generated/world.json'), 'utf-8'),
) as { dialog: Array<{ id: string }> };

const WORLD_DIALOG_IDS = new Set(WORLD.dialog.map((d) => d.id));

interface ResolvedRef {
    map: string;
    eventId: string;
    field: 'dialog_id' | 'gated_dialog_id';
    value: string;
}

function collectDialogReferences(): ResolvedRef[] {
    const refs: ResolvedRef[] = [];
    for (const [map, events] of Object.entries(EVENTS.maps)) {
        for (const event of events) {
            if (event.dialog_id) {
                refs.push({ map, eventId: event.id, field: 'dialog_id', value: event.dialog_id });
            }
            if (event.gated_dialog_id) {
                refs.push({
                    map,
                    eventId: event.id,
                    field: 'gated_dialog_id',
                    value: event.gated_dialog_id,
                });
            }
        }
    }
    return refs;
}

/**
 * T80: every dialog_id reference in events.json must resolve to a
 * compiled dialog node. The runtime's playDialog() falls back to a
 * "missing dialog" placeholder when it can't find the id — that's
 * the right behavior at runtime but catastrophic for player
 * experience, so we catch it at build.
 *
 * Covers both `dialog_id` (ambient_npc / quest_npc primary) and
 * `gated_dialog_id` (warp pre-gate message). Dossier-driven NPCs
 * are not covered here — their dialog_ids come from dossier
 * dialog_states at compile time, and T77 catches unreachable states.
 */
describe('T80: events.json dialog_id resolution', () => {
    it('every event.dialog_id resolves to a compiled dialog node', () => {
        const refs = collectDialogReferences();
        expect(refs.length, 'events.json should declare at least some dialog_ids').toBeGreaterThan(0);

        const drift = refs.filter((ref) => !WORLD_DIALOG_IDS.has(ref.value));
        expect(
            drift,
            drift.length > 0
                ? `events.json references ${drift.length} dialog id(s) missing from world.dialog[]:\n` +
                      drift
                          .map(
                              (d) =>
                                  `  - ${d.map}/${d.eventId}.${d.field} = "${d.value}"`,
                          )
                          .join('\n')
                : '',
        ).toEqual([]);
    });

    it('every event id is unique per map', () => {
        for (const [map, events] of Object.entries(EVENTS.maps)) {
            const ids = events.map((e) => e.id);
            const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
            expect(duplicates, `${map} has duplicate event ids: ${duplicates.join(', ')}`).toEqual([]);
        }
    });
});
