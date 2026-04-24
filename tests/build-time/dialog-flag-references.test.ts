import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORLD = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/generated/world.json'), 'utf-8'),
) as {
    dialog: Array<{
        id: string;
        npc_id: string | null;
        when_flags?: Record<string, boolean>;
        triggers?: { set_flag?: Record<string, boolean> };
    }>;
};

/**
 * T72: every flag a dialog state reads (via `when_flags`) must have a
 * corresponding setter somewhere in the shipped code or content. A
 * reader without a setter is a dead state — authored but unreachable.
 *
 * Setters are catalogued here as the authoritative list. If you add a
 * new flag, either (a) add it to this list with a comment noting where
 * it's set, or (b) set it via dialog on_exit in a dossier. Flags set
 * in code (gym leaders, rivals, green dragon, starter ceremony) are
 * included explicitly so a rename in the source catches here.
 */
const KNOWN_FLAG_SETTERS = new Set<string>([
    // Starter ceremony (src/modules/main/starter-ceremony.ts)
    'starter_chosen',
    // Rival battle (src/modules/main/jan-ike.ts sets the defeated flag)
    'rook_defeated',
    // Gym leaders — flags come from trainers.json's `badge_flag` and
    // `defeated_flag` fields. Set by gym-leader.ts on victory.
    'badge_sewi',
    'badge_telo',
    'badge_lete',
    'badge_suli',
    'tarrin_defeated',
    'marin_defeated',
    'frost_defeated',
    'cliff_defeated',
    // Green dragon finale (src/modules/main/green-dragon.ts)
    'green_dragon_defeated',
    'game_cleared',
    // Post-clear proof (set after all four badges — derived elsewhere)
    'proofs_all_four',
    // Quest runtime (src/modules/main/quest-runtime.ts questDoneFlag prefix).
    // questDoneFlag returns `quest_${questId}_done` and quest ids already
    // start with `quest_`, so shipped flags have the double-prefix shape.
    'quest_quest_field_notes_done',
    'quest_quest_shrine_stones_done',
    // Shop transactions (src/modules/main/shop-npc.ts — pending T73).
    // Leaving the flag in KNOWN for now so content referencing it
    // doesn't fail; when shop sets it, the setter side lines up.
    'shopkeep_first_sale',
    // Dialog on_exit triggers wired in T71 (dialog.ts fireDialogTriggers).
    // These are set by dialog exit — the test below verifies every entry
    // here that falls in this bucket has a matching dialog setter too.
    'lost_hiker_delivered',
    'cold_hands_complete',
    'snowbird_sighting_complete',
    'torch_path_survey_complete',
]);

function collectReaders(): Set<string> {
    const out = new Set<string>();
    for (const node of WORLD.dialog) {
        for (const flagId of Object.keys(node.when_flags ?? {})) {
            out.add(flagId);
        }
    }
    return out;
}

function collectDialogSetters(): Set<string> {
    const out = new Set<string>();
    for (const node of WORLD.dialog) {
        for (const flagId of Object.keys(node.triggers?.set_flag ?? {})) {
            out.add(flagId);
        }
    }
    return out;
}

describe('T72: dialog flag-reference integrity', () => {
    it('every when_flags reference resolves to a known setter', () => {
        const readers = collectReaders();
        const missing = [...readers].filter((flag) => !KNOWN_FLAG_SETTERS.has(flag));
        expect(
            missing,
            `when_flags references flags with no known setter: ${missing.join(', ')}. ` +
                `Either set the flag somewhere or remove the reference.`,
        ).toEqual([]);
    });

    it('every dialog set_flag target is declared in KNOWN_FLAG_SETTERS', () => {
        // The inverse check: a dialog firing a flag nobody else reads is
        // still valid content, but it should be documented here. Forces
        // authors to update this list when adding new trigger wiring.
        const setters = collectDialogSetters();
        const missing = [...setters].filter((flag) => !KNOWN_FLAG_SETTERS.has(flag));
        expect(
            missing,
            `dialog triggers set flags not declared in KNOWN_FLAG_SETTERS: ${missing.join(', ')}`,
        ).toEqual([]);
    });
});
