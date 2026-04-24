import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORLD = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/generated/world.json'), 'utf-8'),
) as {
    maps: Array<{
        id: string;
        objects: Array<{
            layer: string;
            name: string;
            type: string;
            x: number;
            y: number;
        }>;
    }>;
};

/**
 * T90: NPC position collision guard.
 *
 * Two NPC markers at the same pixel coordinate on the same map end up
 * visually stacked — the top sprite hides the bottom one and the
 * interaction hint fires on whichever the engine resolves first. This
 * happened once: `jan-pimeja-suli` (hand-authored in the dreadpeak
 * spec) and `npc-torch_bearer` (dossier-spawned) both landed at
 * tile (7,8). The id-only duplication check in the dossier merger
 * missed it because the IDs were different.
 *
 * This guard fails at build-time if any two NPC objects on the same
 * region share an (x, y) — covering both hand-authored spec NPCs
 * and dossier-spawned ones.
 */

describe('T90: NPC positions are unique per map', () => {
    for (const map of WORLD.maps) {
        it(`${map.id} has no overlapping NPC markers`, () => {
            const npcs = map.objects.filter((o) => o.type === 'NPC');
            const byPos = new Map<string, string[]>();
            for (const npc of npcs) {
                const key = `${npc.x},${npc.y}`;
                if (!byPos.has(key)) byPos.set(key, []);
                byPos.get(key)!.push(npc.name);
            }
            const collisions = [...byPos.entries()].filter(([, names]) => names.length > 1);
            expect(
                collisions,
                `collisions in ${map.id}:\n${collisions
                    .map(([pos, names]) => `  (${pos}) → ${names.join(', ')}`)
                    .join('\n')}`,
            ).toEqual([]);
        });
    }
});
