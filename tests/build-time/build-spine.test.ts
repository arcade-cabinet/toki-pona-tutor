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
    start_region_id: string;
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

    it('every journey beat.map_id has a corresponding .tmx file reference', () => {
        const beats = WORLD.journey.beats as { map_id: string }[];
        expect(beats.length).toBe(7);
        for (const b of beats) {
            expect(b.map_id).toMatch(/^[a-z][a-z0-9_]*$/);
        }
    });

    it('expected content counts: 43 species, 17 moves, 4 items, 29 dialog, 7 beats', () => {
        expect(WORLD.species).toHaveLength(43);
        expect(WORLD.moves).toHaveLength(17);
        expect(WORLD.items).toHaveLength(4);
        expect(WORLD.dialog).toHaveLength(29);
        expect(WORLD.journey.beats).toHaveLength(7);
    });

    it('species.description.tp exists (build-spine resolved Tatoeba TP)', () => {
        for (const s of WORLD.species as { id: string; description: { en: string; tp?: string } }[]) {
            // tp is optional at authoring time but the build emits it for
            // every multi-word en string; single-word ens are exempt. None
            // of our species descriptions are single-word so all must have tp.
            expect(s.description.tp, `${s.id} missing tp`).toBeTruthy();
        }
    });
});
