/**
 * Smallest-possible spec — proves the end-to-end pipeline (validate →
 * build → render) works against real Fan-tasy tilesets.
 *
 * Intentionally minimal: a plain grass rectangle with a single SpawnPoint.
 * Not used at runtime — it's the first map we produce via the toolchain
 * so I can eyeball the preview PNG.
 */
import { defineMap } from '../lib/spec-helpers';
import { corePalette } from '../palettes/core';

export default defineMap({
  id: 'hello_map',
  width: 10,
  height: 6,
  tileSize: 16,
  tilesets: ['core/Tileset_Ground'],
  palette: corePalette,
  layers: {
    'Below Player': [
      ['g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
      ['g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
      ['g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
      ['g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
      ['g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
      ['g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
    ],
    Objects: [
      { type: 'SpawnPoint', name: 'default', at: [5, 3] },
    ],
  },
});
