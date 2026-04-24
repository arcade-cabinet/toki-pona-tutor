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
            properties: Record<string, unknown>;
        }>;
    }>;
};

/**
 * T65: Dossier NPC runtime spawning contracts.
 *
 * These tests protect the author-time → runtime pipeline: every dossier
 * NPC appearance must land in world.json's map.objects with the props
 * server.ts's dossierNpcEventsForMap() relies on to build runtime events.
 * They don't spin up the engine — that work lives in integration tests —
 * but they catch schema / compile drift early.
 */

function dossierNpcsForMap(mapId: string) {
    const map = WORLD.maps.find((m) => m.id === mapId);
    if (!map) throw new Error(`unknown map ${mapId}`);
    return map.objects.filter((o) => o.type === 'NPC' && o.name.startsWith('npc-'));
}

describe('T65: dossier NPC markers compile into world.json', () => {
    it('every region with an NPC dossier emits at least one npc- marker', () => {
        const EXPECTED_REGIONS = [
            'greenwood_road',
            'highridge_pass',
            'lakehaven',
            'frostvale',
            'dreadpeak_cavern',
            'rivergate_approach',
        ];
        for (const mapId of EXPECTED_REGIONS) {
            const npcs = dossierNpcsForMap(mapId);
            expect(npcs.length, `${mapId} should have ≥1 dossier NPC`).toBeGreaterThan(0);
        }
    });

    it('every dossier NPC marker has id + dialog_id properties', () => {
        for (const map of WORLD.maps) {
            for (const npc of map.objects.filter((o) => o.type === 'NPC' && o.name.startsWith('npc-'))) {
                expect(npc.properties.id, `${map.id}/${npc.name} missing id`).toBeTruthy();
                expect(npc.properties.dialog_id, `${map.id}/${npc.name} missing dialog_id`).toBeTruthy();
            }
        }
    });

    it('dossier NPC name follows npc-<id> convention', () => {
        for (const map of WORLD.maps) {
            for (const npc of map.objects.filter((o) => o.type === 'NPC' && o.name.startsWith('npc-'))) {
                const expectedName = `npc-${npc.properties.id}`;
                expect(npc.name).toBe(expectedName);
            }
        }
    });

    it('cross-region appearances with requires_flag propagate required_flag property', () => {
        // rook's Rivergate appearance is gated by badge_suli; kala_lili / kala_suli too.
        const rivergate = dossierNpcsForMap('rivergate_approach');
        const rook = rivergate.find((n) => n.properties.id === 'rook');
        expect(rook?.properties.required_flag, 'rook at rivergate needs badge_suli gate').toBe('badge_suli');
        const kalaLili = rivergate.find((n) => n.properties.id === 'kala_lili');
        expect(kalaLili?.properties.required_flag).toBe('badge_suli');
    });

    it('home-region appearances (default: true) do not carry required_flag', () => {
        // angler lives at lakehaven — no gate in its home region.
        const lake = dossierNpcsForMap('lakehaven');
        const angler = lake.find((n) => n.properties.id === 'angler');
        expect(angler).toBeDefined();
        expect(angler?.properties.required_flag).toBeUndefined();
    });

    it('every dossier NPC dialog_id resolves to a dialog node in world.json', () => {
        const nodes = new Set<string>(
            (WORLD as unknown as { dialog: Array<{ id: string }> }).dialog.map((d) => d.id),
        );
        for (const map of WORLD.maps) {
            for (const npc of map.objects.filter((o) => o.type === 'NPC' && o.name.startsWith('npc-'))) {
                const dialogId = String(npc.properties.dialog_id);
                expect(nodes.has(dialogId), `${map.id}/${npc.name} dialog_id=${dialogId} missing`).toBe(true);
            }
        }
    });

    it('green_dragon dossier marker exists but is excluded from ambient spawning', () => {
        // The endgame green_dragon event kind in events.json handles this.
        // The dossier marker is still emitted for visibility in Tiled.
        const rivergate = dossierNpcsForMap('rivergate_approach');
        const dragon = rivergate.find((n) => n.properties.id === 'green_dragon');
        expect(dragon, 'green_dragon dossier marker should exist').toBeDefined();
        // server.ts DOSSIER_NPC_EXCLUDED_IDS tracks this id to avoid double-spawning.
    });
});
