import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getNpcDisplayName } from '../../src/modules/main/content';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORLD = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/generated/world.json'), 'utf-8'),
) as {
    npcs: Array<{ id: string; display_name: string; home_region?: string; role?: string }>;
    dialog: Array<{ npc_id: string | null }>;
};

/**
 * T81: compiled world.npcs[] is the source of truth for
 * display_name lookups used by playDialog.speaker. Verify the
 * registry shape, coverage, and runtime lookup agree.
 */

describe('T81: NPC registry + speaker resolution', () => {
    it('world.json ships a non-empty npcs registry', () => {
        expect(WORLD.npcs.length).toBeGreaterThan(0);
    });

    it('every entry has a non-empty id and display_name', () => {
        for (const npc of WORLD.npcs) {
            expect(npc.id, `npc ${JSON.stringify(npc)}`).toMatch(/^[a-z][a-z0-9_]*$/);
            expect(npc.display_name, `npc ${npc.id}`).toMatch(/\S/);
        }
    });

    it('ids are unique', () => {
        const ids = WORLD.npcs.map((npc) => npc.id);
        const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
        expect(duplicates).toEqual([]);
    });

    it('getNpcDisplayName resolves every registered id', () => {
        for (const npc of WORLD.npcs) {
            expect(getNpcDisplayName(npc.id), `npc ${npc.id}`).toBe(npc.display_name);
        }
    });

    it('getNpcDisplayName returns null for unknown ids and null argument', () => {
        expect(getNpcDisplayName(null)).toBe(null);
        expect(getNpcDisplayName('not_a_real_npc_xyz')).toBe(null);
    });

    it('every dossier-backed dialog node has a speaker available', () => {
        // dialog nodes from dossiers have npc_id set; system dialogs
        // (wild_encounter_*, game_over_revive) have npc_id=null.
        // Every non-null npc_id must resolve to a display_name.
        const missing: string[] = [];
        for (const node of WORLD.dialog) {
            if (!node.npc_id) continue;
            if (getNpcDisplayName(node.npc_id) === null) {
                missing.push(node.npc_id);
            }
        }
        const unique = [...new Set(missing)];
        expect(
            unique,
            `dialog nodes reference ${unique.length} npc_id(s) not in registry: ${unique.join(', ')}`,
        ).toEqual([]);
    });
});
