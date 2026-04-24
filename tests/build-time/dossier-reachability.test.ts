import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectDialogState } from '../../src/modules/main/dialog';
import type { DialogNode } from '../../src/content/schema/dialog';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGIONS_DIR = resolve(__dirname, '../../src/content/regions');
const WORLD = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/generated/world.json'), 'utf-8'),
) as { dialog: DialogNode[] };

interface Dossier {
    id: string;
    dialog_states: Array<{
        id: string;
        priority?: number;
        when?: { flag_present?: string; flag_absent?: string };
    }>;
}

function loadAllDossiers(): Array<{ region: string; dossier: Dossier }> {
    const out: Array<{ region: string; dossier: Dossier }> = [];
    for (const region of readdirSync(REGIONS_DIR)) {
        const npcsDir = join(REGIONS_DIR, region, 'npcs');
        try {
            for (const file of readdirSync(npcsDir).filter((f) => f.endsWith('.json'))) {
                const dossier = JSON.parse(readFileSync(join(npcsDir, file), 'utf-8')) as Dossier;
                out.push({ region, dossier });
            }
        } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
        }
    }
    return out;
}

function dialogNodesByNpc(npcId: string): DialogNode[] {
    return WORLD.dialog.filter((d) => d.npc_id === npcId);
}

/**
 * Mock flag lookup. Every flag reads null (unset) — simulates a
 * brand-new player who hasn't touched the starter ceremony.
 */
const freshPlayerFlags = async (_id: string): Promise<string | null> => null;

describe('T77: dossier intro reachability', () => {
    it('every dossier NPC has at least one state selectable for a fresh player', async () => {
        const unreachable: string[] = [];

        // NPCs intentionally unreachable until progression-derived flags
        // are set. warden_ghost speaks only after every warden's proof
        // is earned (proofs_all_four — derived by gym-leader.ts after
        // all four badges land). Not a bug.
        const INTENTIONALLY_GATED = new Set(['warden_ghost']);

        for (const { region, dossier } of loadAllDossiers()) {
            // Skip the final-boss fight event; its only state gates on
            // endgame flags and the player interacts through a different
            // code path (green-dragon.ts), not playDialog selector.
            if (dossier.id === 'green_dragon') continue;
            if (INTENTIONALLY_GATED.has(dossier.id)) continue;

            const siblings = dialogNodesByNpc(dossier.id);
            if (siblings.length === 0) {
                unreachable.push(`${region}/${dossier.id}: no dialog nodes compiled`);
                continue;
            }

            // Try each sibling as the requested node — the selector picks
            // the best match. For a fresh player any matching node is
            // fine; we just need one to resolve.
            let reachable = false;
            for (const requested of siblings) {
                const chosen = await selectDialogState(requested, siblings, freshPlayerFlags);
                // Non-null means the selector found a match given zero flags.
                // Null is allowed only when the requested node's own when_flags
                // are empty (selector falls through to the requested node
                // at the caller's fallback site).
                if (chosen !== null) {
                    reachable = true;
                    break;
                }
                // Fallback equivalence: if selector returned null but the
                // requested node itself has no when_flags (or all-falsy
                // requirements match fresh player), the caller in playDialog
                // still speaks the requested node.
                if (!requested.when_flags || nodeMatchesFresh(requested)) {
                    reachable = true;
                    break;
                }
            }

            if (!reachable) {
                unreachable.push(
                    `${region}/${dossier.id}: every state requires a flag the fresh player hasn't set`,
                );
            }
        }

        expect(unreachable).toEqual([]);
    });

    it('first-authored state plays for fresh player when it gates on absent flags only', async () => {
        // The common authoring pattern: state[0] is the intro with
        // `{ flag_absent: <progression_flag> }`. Verify that pattern
        // actually resolves for every dossier whose state[0] follows it.
        const drift: string[] = [];
        for (const { region, dossier } of loadAllDossiers()) {
            if (dossier.id === 'green_dragon') continue;
            const first = dossier.dialog_states[0];
            if (!first) continue;
            // Only check the "intro follows the flag_absent-only pattern" cases.
            const when = first.when ?? {};
            if (when.flag_present) continue;
            if (!when.flag_absent) continue;

            const siblings = dialogNodesByNpc(dossier.id);
            const node = siblings.find((d) => d.id === first.id);
            if (!node) {
                drift.push(`${region}/${dossier.id}: first state ${first.id} missing from compiled dialog`);
                continue;
            }
            const chosen = await selectDialogState(node, siblings, freshPlayerFlags);
            // Either the selector picks this state (expected) or returns null
            // (caller falls back to requested node — also ok).
            if (chosen !== null && chosen.id !== first.id) {
                drift.push(
                    `${region}/${dossier.id}: fresh-player selector picked ${chosen.id} over intro ${first.id}`,
                );
            }
        }
        expect(drift).toEqual([]);
    });
});

function nodeMatchesFresh(node: DialogNode): boolean {
    if (!node.when_flags) return true;
    for (const expected of Object.values(node.when_flags)) {
        // Fresh player has every flag unset. A when_flags expecting
        // `false` matches; expecting `true` fails.
        if (expected) return false;
    }
    return true;
}

describe('T77: nodeMatchesFresh helper + selector semantics (self-check)', () => {
    it('treats a node with no when_flags as always matching fresh player', () => {
        const node = { beats: [], npc_id: 'x' } as unknown as DialogNode;
        expect(nodeMatchesFresh(node)).toBe(true);
    });

    it('treats flag_absent-only gates as matching fresh player', () => {
        const node = {
            beats: [],
            npc_id: 'x',
            when_flags: { some_flag: false },
        } as unknown as DialogNode;
        expect(nodeMatchesFresh(node)).toBe(true);
    });

    it('treats flag_present gates as failing for fresh player', () => {
        const node = {
            beats: [],
            npc_id: 'x',
            when_flags: { some_flag: true },
        } as unknown as DialogNode;
        expect(nodeMatchesFresh(node)).toBe(false);
    });
});
