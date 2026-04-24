import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORLD = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/generated/world.json'), 'utf-8'),
) as {
    species: unknown[];
    moves: unknown[];
    items: unknown[];
    dialog: unknown[];
    journey: { beats: unknown[] };
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
    start_region_id: string;
    regions: Array<{ id: string; biome: string }>;
    signs: Array<{ region: string; title: string; body: { en: string } }>;
};

describe('T6-03: build-spine writes every expected key into world.json', () => {
    it('world.json exists and is an object', () => {
        expect(WORLD).toBeTypeOf('object');
        expect(WORLD).not.toBeNull();
    });

    it('has the six top-level content arrays/objects', () => {
        expect(Array.isArray(WORLD.species)).toBe(true);
        expect(Array.isArray(WORLD.moves)).toBe(true);
        expect(Array.isArray(WORLD.items)).toBe(true);
        expect(Array.isArray(WORLD.dialog)).toBe(true);
        expect(WORLD.journey).toBeTypeOf('object');
        expect(Array.isArray(WORLD.journey.beats)).toBe(true);
        expect(Array.isArray(WORLD.maps)).toBe(true);
        expect(typeof WORLD.start_region_id).toBe('string');
    });

    it('start_region_id points at the first journey beat map_id', () => {
        const firstBeat = WORLD.journey.beats[0] as { map_id: string };
        expect(WORLD.start_region_id).toBe(firstBeat.map_id);
    });

    it('each species has required fields', () => {
        const FIELDS = ['id', 'name', 'description', 'type', 'base_stats', 'learnset', 'catch_rate', 'xp_yield'];
        for (const s of WORLD.species as Record<string, unknown>[]) {
            for (const f of FIELDS) {
                expect(s).toHaveProperty(f);
            }
        }
    });

    it('every species.learnset.move_id references an existing move', () => {
        const moveIds = new Set((WORLD.moves as { id: string }[]).map((m) => m.id));
        for (const s of WORLD.species as { id: string; learnset: { move_id: string }[] }[]) {
            for (const l of s.learnset) {
                expect(moveIds.has(l.move_id), `${s.id} references missing move ${l.move_id}`).toBe(true);
            }
        }
    });

    it('every species.item_drop references an existing inventory item', () => {
        const itemIds = new Set((WORLD.items as { id: string }[]).map((item) => item.id));
        for (const s of WORLD.species as { id: string; item_drop?: { item_id: string } }[]) {
            if (!s.item_drop) continue;
            expect(itemIds.has(s.item_drop.item_id), `${s.id} references missing item ${s.item_drop.item_id}`).toBe(true);
        }
    });

    it('every journey beat.map_id has a corresponding .tmx file reference', () => {
        const beats = WORLD.journey.beats as { map_id: string }[];
        expect(beats.length).toBe(7);
        for (const b of beats) {
            expect(b.map_id).toMatch(/^[a-z][a-z0-9_]*$/);
            expect(WORLD.maps.some((map) => map.id === b.map_id), b.map_id).toBe(true);
        }
    });

    it('compiled maps expose the object-layer coordinates runtime events resolve from', () => {
        expect(WORLD.maps).toHaveLength(7);
        const starterMap = WORLD.maps.find((map) => map.id === 'riverside_home');
        const routeMap = WORLD.maps.find((map) => map.id === 'greenwood_road');
        expect(starterMap?.objects.some((object) => object.name === 'warp_east' && object.type === 'Warp'))
            .toBe(true);
        expect(routeMap?.objects.some((object) => object.properties.id === 'rook'))
            .toBe(true);
    });

    it('expected content counts: 43 species, 17 moves, 5 items, 152 dialog, 7 beats, 7 maps', () => {
        expect(WORLD.species).toHaveLength(43);
        expect(WORLD.moves).toHaveLength(17);
        expect(WORLD.items).toHaveLength(5);
        // Flat legacy files + expanded dossier states. Growth comes
        // from adding post-region-gym / post-clear states to migrated
        // NPCs so the world reacts to plot progression. T63 added
        // post-clear to 15 quest-giver/named NPCs; T68 extends the
        // "world heals" pass to the 16 remaining 2-state NPCs so every
        // non-trivial speaker gets a game_cleared line.
        expect(WORLD.dialog).toHaveLength(152);
        expect(WORLD.journey.beats).toHaveLength(7);
        expect(WORLD.maps).toHaveLength(7);
    });

    it('region dossiers emit manifests and signs into world.json for all 7 regions', () => {
        expect(WORLD.regions.map((r) => r.id).sort()).toEqual([
            'dreadpeak_cavern',
            'frostvale',
            'greenwood_road',
            'highridge_pass',
            'lakehaven',
            'rivergate_approach',
            'riverside_home',
        ]);
        expect(WORLD.signs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ region: 'riverside_home', title: 'RIVERSIDE HOME' }),
                expect.objectContaining({ region: 'greenwood_road', title: 'GREENWOOD ROAD' }),
                expect.objectContaining({ region: 'highridge_pass', title: 'HIGHRIDGE PASS' }),
                expect.objectContaining({ region: 'lakehaven', title: 'LAKEHAVEN' }),
                expect.objectContaining({ region: 'frostvale', title: 'FROSTVALE' }),
                expect.objectContaining({ region: 'dreadpeak_cavern', title: 'DREADPEAK CAVERN' }),
                expect.objectContaining({ region: 'rivergate_approach', title: 'RIVERGATE APPROACH' }),
            ]),
        );
    });

    it('species descriptions stay authored in English without generated legacy text', () => {
        for (const s of WORLD.species as { id: string; description: { en: string; tp?: string } }[]) {
            expect(s.description.en, `${s.id} missing English description`).toBeTruthy();
            expect(s.description.tp, `${s.id} should not emit generated legacy text`).toBeUndefined();
        }
    });
});
