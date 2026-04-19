/**
 * Validator tests — spec-level sanity checks before emit.
 *
 * Covers: palette references resolve, grid dims match, objects uniquely
 * named, at least one SpawnPoint, encounter species exist, cell overdraw.
 *
 * See docs/build-time/MAP_AUTHORING.md § "The validator" and § "Tests".
 */
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { validateSpec } from '../../scripts/map-authoring/lib/validator';
import { parseTsx } from '../../scripts/map-authoring/lib/parser';
import type {
  MapSpec,
  ValidationIssue,
} from '../../scripts/map-authoring/lib/types';

const CORE_TSX = resolve(__dirname, '../../public/assets/tilesets/core/Tiled/Tilesets');

describe('validateSpec — well-formed spec', () => {
  it('returns ok when nothing is wrong', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'good',
      width: 2,
      height: 2,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': [
          ['g', 'g'],
          ['g', 'g'],
        ],
        Objects: [{ type: 'SpawnPoint', name: 'default', at: [0, 0] }],
      },
    };
    const report = await validateSpec(spec, [ground], () => null);
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
  });
});

describe('validateSpec — palette errors', () => {
  it('errors when a paint grid references an unknown palette name', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'unknown_palette',
      width: 2,
      height: 2,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': [
          ['g', 'huh'],
          ['g', 'g'],
        ],
        Objects: [{ type: 'SpawnPoint', name: 'default', at: [0, 0] }],
      },
    };
    const report = await validateSpec(spec, [ground], () => null);
    expect(report.ok).toBe(false);
    expect(report.issues.find((i: ValidationIssue) => /palette.*huh/i.test(i.message))).toBeDefined();
  });

  it('errors when a palette entry has out-of-range local_id', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'oor',
      width: 1,
      height: 1,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { bad: { tsx: 'Tileset_Ground', local_id: 999_999 } },
      layers: {
        'Below Player': [['bad']],
        Objects: [{ type: 'SpawnPoint', name: 'default', at: [0, 0] }],
      },
    };
    const report = await validateSpec(spec, [ground], () => null);
    expect(report.ok).toBe(false);
    expect(
      report.issues.find((i: ValidationIssue) => /local_id.*out of range/i.test(i.message)),
    ).toBeDefined();
  });
});

describe('validateSpec — grid dimensions', () => {
  it('errors when a paint grid row length mismatches width', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'bad_dims',
      width: 3,
      height: 2,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': [
          ['g', 'g'], // too short
          ['g', 'g', 'g'],
        ],
        Objects: [{ type: 'SpawnPoint', name: 'default', at: [0, 0] }],
      },
    };
    const report = await validateSpec(spec, [ground], () => null);
    expect(report.ok).toBe(false);
    expect(report.issues.find((i: ValidationIssue) => /width|row/i.test(i.message))).toBeDefined();
  });
});

describe('validateSpec — SpawnPoint requirement', () => {
  it('errors when Objects layer has no SpawnPoint', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'no_spawn',
      width: 2,
      height: 2,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': [
          ['g', 'g'],
          ['g', 'g'],
        ],
        Objects: [
          { type: 'Sign', name: 'welcome', at: [0, 0], props: { text: 'hi' } },
        ],
      },
    };
    const report = await validateSpec(spec, [ground], () => null);
    expect(report.ok).toBe(false);
    expect(
      report.issues.find((i: ValidationIssue) => /spawnpoint/i.test(i.message)),
    ).toBeDefined();
  });

  it('errors when Objects layer is missing entirely', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'no_objects',
      width: 2,
      height: 2,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': [
          ['g', 'g'],
          ['g', 'g'],
        ],
      },
    };
    const report = await validateSpec(spec, [ground], () => null);
    expect(report.ok).toBe(false);
    expect(
      report.issues.find((i: ValidationIssue) => /spawnpoint/i.test(i.message)),
    ).toBeDefined();
  });
});

describe('validateSpec — unique object names', () => {
  it('errors when two objects share a name in the same map', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'dup_names',
      width: 2,
      height: 2,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': [
          ['g', 'g'],
          ['g', 'g'],
        ],
        Objects: [
          { type: 'SpawnPoint', name: 'here', at: [0, 0] },
          { type: 'SpawnPoint', name: 'here', at: [1, 1] },
        ],
      },
    };
    const report = await validateSpec(spec, [ground], () => null);
    expect(report.ok).toBe(false);
    expect(
      report.issues.find((i: ValidationIssue) => /duplicate.*name.*here/i.test(i.message)),
    ).toBeDefined();
  });
});

describe('validateSpec — encounter species exist', () => {
  it('errors when an encounter zone references an unknown species', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'bad_encounter',
      width: 2,
      height: 2,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': [
          ['g', 'g'],
          ['g', 'g'],
        ],
        Objects: [{ type: 'SpawnPoint', name: 'default', at: [0, 0] }],
        Encounters: [
          {
            rect: [0, 0, 2, 2],
            species: { nonexistent_species_zzz: 1 },
            levelRange: [2, 4],
          },
        ],
      },
    };
    const speciesLookup = (id: string) =>
      id === 'soweli_seli' ? ({ id } as { id: string }) : null;
    const report = await validateSpec(spec, [ground], speciesLookup);
    expect(report.ok).toBe(false);
    expect(
      report.issues.find((i: ValidationIssue) => /species.*nonexistent/i.test(i.message)),
    ).toBeDefined();
  });

  it('accepts encounters with known species', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'good_encounter',
      width: 2,
      height: 2,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': [
          ['g', 'g'],
          ['g', 'g'],
        ],
        Objects: [{ type: 'SpawnPoint', name: 'default', at: [0, 0] }],
        Encounters: [
          {
            rect: [0, 0, 2, 2],
            species: { soweli_seli: 3 },
            levelRange: [2, 4],
          },
        ],
      },
    };
    const speciesLookup = (id: string) =>
      id === 'soweli_seli' ? ({ id } as { id: string }) : null;
    const report = await validateSpec(spec, [ground], speciesLookup);
    expect(report.ok).toBe(true);
  });
});
