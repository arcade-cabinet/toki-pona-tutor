/**
 * Palette resolver tests.
 *
 * The palette maps human-readable names (`grass`, `water`, `house_red`) to
 * specific tiles in specific tilesets. The resolver turns a (palette, tilesets,
 * name) tuple into an absolute GID — the tile id the Tiled format uses.
 *
 * See docs/build-time/MAP_AUTHORING.md § "Tests — Unit-level" item 2
 * and § "Palette format".
 */
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import {
  assignFirstGids,
  resolvePaletteName,
  type FirstGidMap,
} from '../../scripts/map-authoring/lib/palette';
import { parseTsx } from '../../scripts/map-authoring/lib/parser';
import type { Palette, ParsedTileset } from '../../scripts/map-authoring/lib/types';

const CORE_TSX = resolve(__dirname, '../../public/assets/tilesets/core/Tiled/Tilesets');

describe('assignFirstGids', () => {
  it('assigns firstgid=1 to the first tileset', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const m = assignFirstGids([ground]);
    expect(m.get('Tileset_Ground')).toBe(1);
  });

  it('assigns firstgids deterministically in declared order', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const water = await parseTsx(resolve(CORE_TSX, 'Tileset_Water.tsx'));
    const m = assignFirstGids([ground, water]);
    expect(m.get('Tileset_Ground')).toBe(1);
    // Water's firstgid must be ground.tileCount + 1
    expect(m.get('Tileset_Water')).toBe(ground.tileCount + 1);
  });

  it('handles three tilesets with cumulative offsets', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const water = await parseTsx(resolve(CORE_TSX, 'Tileset_Water.tsx'));
    const road = await parseTsx(resolve(CORE_TSX, 'Tileset_Road.tsx'));
    const m = assignFirstGids([ground, water, road]);
    expect(m.get('Tileset_Ground')).toBe(1);
    expect(m.get('Tileset_Water')).toBe(ground.tileCount + 1);
    expect(m.get('Tileset_Road')).toBe(ground.tileCount + water.tileCount + 1);
  });

  it('is deterministic — same input, same output', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const water = await parseTsx(resolve(CORE_TSX, 'Tileset_Water.tsx'));
    const m1 = assignFirstGids([ground, water]);
    const m2 = assignFirstGids([ground, water]);
    expect(Array.from(m1.entries())).toEqual(Array.from(m2.entries()));
  });
});

describe('resolvePaletteName', () => {
  function mkTileset(name: string, tileCount: number): ParsedTileset {
    return {
      source: `${name}.tsx`,
      absolutePath: `${name}.tsx`,
      name,
      tileWidth: 16,
      tileHeight: 16,
      tileCount,
      columns: 8,
      spacing: 0,
      margin: 0,
      image: {
        source: `${name}.png`,
        absolutePath: `${name}.png`,
        width: 128,
        height: 128,
      },
      properties: {},
      animations: {},
    };
  }

  it('resolves a palette name to firstgid + local_id', () => {
    const ground = mkTileset('Tileset_Ground', 100);
    const firstGids: FirstGidMap = new Map([['Tileset_Ground', 1]]);
    const palette: Palette = {
      grass: { tsx: 'Tileset_Ground', local_id: 42 },
    };
    const gid = resolvePaletteName(palette, firstGids, [ground], 'grass');
    expect(gid).toBe(1 + 42); // 43
  });

  it('resolves correctly when the tileset is not first', () => {
    const ground = mkTileset('Tileset_Ground', 100);
    const water = mkTileset('Tileset_Water', 50);
    const firstGids: FirstGidMap = new Map([
      ['Tileset_Ground', 1],
      ['Tileset_Water', 101],
    ]);
    const palette: Palette = {
      wave: { tsx: 'Tileset_Water', local_id: 7 },
    };
    const gid = resolvePaletteName(palette, firstGids, [ground, water], 'wave');
    expect(gid).toBe(101 + 7); // 108
  });

  it('throws on unknown palette name', () => {
    const palette: Palette = {};
    expect(() =>
      resolvePaletteName(palette, new Map(), [], 'nonexistent'),
    ).toThrow(/palette.*nonexistent/i);
  });

  it('throws when tileset is referenced but not loaded', () => {
    const palette: Palette = {
      grass: { tsx: 'Tileset_Ground', local_id: 0 },
    };
    // No tilesets, no firstgids — resolver can't find the backing tileset.
    expect(() =>
      resolvePaletteName(palette, new Map(), [], 'grass'),
    ).toThrow(/tileset.*Tileset_Ground/i);
  });

  it('throws when local_id is out of range', () => {
    const ground = mkTileset('Tileset_Ground', 100);
    const firstGids: FirstGidMap = new Map([['Tileset_Ground', 1]]);
    const palette: Palette = {
      bad: { tsx: 'Tileset_Ground', local_id: 500 }, // > 100
    };
    expect(() =>
      resolvePaletteName(palette, firstGids, [ground], 'bad'),
    ).toThrow(/local_id.*500.*out of range/i);
  });

  it('throws when local_id is negative', () => {
    const ground = mkTileset('Tileset_Ground', 100);
    const firstGids: FirstGidMap = new Map([['Tileset_Ground', 1]]);
    const palette: Palette = {
      bad: { tsx: 'Tileset_Ground', local_id: -1 },
    };
    expect(() =>
      resolvePaletteName(palette, firstGids, [ground], 'bad'),
    ).toThrow(/local_id.*out of range/i);
  });
});
