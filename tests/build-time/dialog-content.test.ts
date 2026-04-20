import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORLD = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/generated/world.json'), 'utf-8'),
) as {
    dialog: Array<{ id: string; beats: Array<{ text: { en: string; tp?: string }; glyph?: string }> }>;
};

/**
 * Cross-checks between code's dialog_id consumers and the shipped
 * content. If a module calls playDialog('foo_bar') and there's no
 * dialog node with id='foo_bar', the runtime will render "(foo_bar)"
 * as a placeholder (per dialog.ts fallback) — catchable here at
 * build time.
 */

const DIALOG_IDS_REFERENCED_IN_CODE = [
    // from starter-ceremony.ts
    'jan_sewi_after_pick',
    'jan_sewi_starter_intro',
    // from encounter.ts
    'wild_encounter_appear',
    'wild_encounter_caught',
    'wild_encounter_escaped',
    // from respawn.ts
    'game_over_revive',
    // gym leader victory base ids constructed as `${dialogBase}_victory`:
    'jan_ike_intro',
    'jan_ike_victory',
    'jan_wawa_intro',
    'jan_wawa_victory',
    'jan_telo_intro',
    'jan_telo_victory',
    'jan_lete_intro',
    'jan_lete_victory',
    'jan_suli_intro',
    'jan_suli_victory',
    // ambient npc dialog ids from specs
    // NOTE: jan_pona is referenced in docs/LORE.md but not yet placed
    // in any map spec — uncomment when T7-06 (add flavor villagers)
    // lands. Intentionally commented rather than removed so the next
    // time someone reads this test they remember there's a gap.
    // 'jan_pona_flavor',
    'jan_kala_rest',
    'jan_kala_lake_quest',
] as const;

describe('dialog content — code references match shipped nodes', () => {
    const availableIds = new Set(WORLD.dialog.map((d) => d.id));

    it('every dialog node has at least one beat', () => {
        for (const node of WORLD.dialog) {
            expect(node.beats.length, `${node.id} has no beats`).toBeGreaterThan(0);
        }
    });

    it('dialog ids are unique', () => {
        const ids = WORLD.dialog.map((d) => d.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('reports which code-referenced dialog ids are missing from content', () => {
        const missing = DIALOG_IDS_REFERENCED_IN_CODE.filter((id) => !availableIds.has(id));
        // Not a hard fail — the dialog.ts fallback surfaces missing ids to
        // the player, and some ids listed above may be legitimately
        // unimplemented (e.g. a jan lawa's victory line not yet authored).
        // Just print the report; the build-time test is informational.
        if (missing.length > 0) {
            console.warn(`[dialog-content] ${missing.length} code-referenced dialog ids not found in world.json:`);
            for (const id of missing) console.warn(`  - ${id}`);
        }
        // Still assert that at least the CORE path ids exist — the
        // ones without which gameplay breaks.
        expect(availableIds.has('jan_sewi_starter_intro'), 'starter ceremony intro missing').toBe(true);
        expect(availableIds.has('wild_encounter_appear'), 'wild encounter intro missing').toBe(true);
        expect(availableIds.has('game_over_revive'), 'respawn dialog missing').toBe(true);
    });

    it('every beat.text.en is non-empty', () => {
        for (const node of WORLD.dialog) {
            for (const [i, beat] of node.beats.entries()) {
                expect(beat.text.en.length, `${node.id} beat ${i} has empty en`).toBeGreaterThan(0);
            }
        }
    });
});
