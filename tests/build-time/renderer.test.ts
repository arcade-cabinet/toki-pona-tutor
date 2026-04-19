/**
 * Renderer tests — the node-canvas compositor.
 *
 * Covers: output dimensions, correct tile placement at correct pixel
 * coordinates, object-layer overlay positioning.
 *
 * See docs/build-time/MAP_AUTHORING.md § "The renderer" and § "Tests".
 */
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { renderTmj } from '../../scripts/map-authoring/lib/renderer';
import { parseTsx } from '../../scripts/map-authoring/lib/parser';
import { emitTmj } from '../../scripts/map-authoring/lib/emitter';
import type { MapSpec } from '../../scripts/map-authoring/lib/types';

const CORE_TSX = resolve(__dirname, '../../public/assets/tilesets/core/Tiled/Tilesets');

function mkTmpDir() {
  return mkdtempSync(join(tmpdir(), 'poki-render-'));
}

function samplePixel(png: PNG, x: number, y: number): [number, number, number, number] {
  const idx = (png.width * y + x) << 2;
  return [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
}

describe('renderTmj — output dimensions', () => {
  it('produces a PNG with the expected pixel dimensions', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'size_test',
      width: 10,
      height: 6,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': Array.from({ length: 6 }, () => Array(10).fill('g')),
      },
    };
    const tmjPath = join(mkTmpDir(), 'size_test.tmj');
    const tmj = emitTmj(spec, [ground], tmjPath);
    await writeFile(tmjPath, JSON.stringify(tmj));

    const png = await renderTmj(tmjPath, [ground]);
    expect(png.width).toBe(10 * 16); // 160
    expect(png.height).toBe(6 * 16); // 96
  });
});

describe('renderTmj — tile placement', () => {
  it('draws the same tile everywhere when the entire grid uses one palette entry', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'fill_test',
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
    const tmjPath = join(mkTmpDir(), 'fill_test.tmj');
    const tmj = emitTmj(spec, [ground], tmjPath);
    await writeFile(tmjPath, JSON.stringify(tmj));

    const png = await renderTmj(tmjPath, [ground]);
    // Sample center pixel of first tile vs center pixel of third tile —
    // both come from the same source tile, so they should be identical.
    const p1 = samplePixel(png, 8, 8);       // center of tile (0,0)
    const p2 = samplePixel(png, 8 + 16, 8);  // center of tile (1,0)
    expect(p1).toEqual(p2);
  });

  it('leaves non-rendered cells transparent (alpha = 0)', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'sparse_test',
      width: 2,
      height: 1,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': [['g', '.']],
      },
    };
    const tmjPath = join(mkTmpDir(), 'sparse_test.tmj');
    const tmj = emitTmj(spec, [ground], tmjPath);
    await writeFile(tmjPath, JSON.stringify(tmj));

    const png = await renderTmj(tmjPath, [ground]);
    // Tile (0,0) should be opaque. Tile (1,0) should be fully transparent.
    const filled = samplePixel(png, 8, 8);
    const empty = samplePixel(png, 8 + 16, 8);
    expect(filled[3]).toBeGreaterThan(0); // any non-zero alpha
    expect(empty[3]).toBe(0);
  });
});

describe('renderTmj — object-layer overlay', () => {
  it('renders SpawnPoint + Sign + Warp markers when overlay option is true', async () => {
    const ground = await parseTsx(resolve(CORE_TSX, 'Tileset_Ground.tsx'));
    const spec: MapSpec = {
      id: 'overlay_test',
      width: 3,
      height: 3,
      tileSize: 16,
      tilesets: ['Tileset_Ground'],
      palette: { g: { tsx: 'Tileset_Ground', local_id: 0 } },
      layers: {
        'Below Player': Array.from({ length: 3 }, () => Array(3).fill('g')),
        Objects: [
          { type: 'SpawnPoint', name: 'default', at: [1, 1] },
          { type: 'Sign', name: 'welcome', at: [0, 0], props: { text: 'hi' } },
          {
            type: 'Warp',
            name: 'east',
            rect: [2, 0, 1, 3],
            props: { target_map: 'nasin_wan', target_spawn: 'from_west' },
          },
        ],
      },
    };
    const tmjPath = join(mkTmpDir(), 'overlay_test.tmj');
    const tmj = emitTmj(spec, [ground], tmjPath);
    await writeFile(tmjPath, JSON.stringify(tmj));

    const base = await renderTmj(tmjPath, [ground], { overlay: false });
    const overlaid = await renderTmj(tmjPath, [ground], { overlay: true });
    // Center pixel of the SpawnPoint tile should differ between the two
    // — overlay adds a semi-transparent colored square.
    const basePx = samplePixel(base, 8 + 16, 8 + 16); // tile (1,1) center
    const overlayPx = samplePixel(overlaid, 8 + 16, 8 + 16);
    expect(overlayPx).not.toEqual(basePx);
  });
});
