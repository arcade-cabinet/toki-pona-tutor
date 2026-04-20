/**
 * ma tomo lili — the small village where the journey begins.
 *
 * First runtime map. A 30×20 grass field with a sand path snaking
 * through it, water along the south edge, and tall-grass borders for
 * future encounter zones. The player spawns near the middle of the
 * path; nothing else is wired yet (NPCs, signs, warps come in later
 * slices).
 *
 * Authored from scratch via the Stage 0 toolchain — NOT a reskin of
 * any Fan-tasy sample. See docs/LORE.md for the lore brief.
 */
import { defineMap } from '../lib/spec-helpers';
import { corePalette } from '../palettes/core';

export default defineMap({
  id: 'ma_tomo_lili',
  width: 30,
  height: 20,
  tileSize: 16,
  tilesets: [
    'core/Tileset_Ground',
    'core/Tileset_TallGrass',
    'core/Tileset_Water',
    'core/Tileset_Sand',
    'core/Tileset_Shadow',
  ],
  palette: corePalette,
  layers: {
    // Below Player — terrain. Tall grass forms a U around the village
    // (north + east + west borders) so the player can feel the world
    // wrapping around them; a south-edge water line marks the southern
    // boundary; a sand path runs south-to-north through the middle.
    'Below Player': [
      // y=0: north border of tall grass with one path opening
      ['t','t','t','t','t','t','t','t','t','t','t','t','t','t','s','s','t','t','t','t','t','t','t','t','t','t','t','t','t','t'],
      ['t','t','t','t','t','t','t','t','t','t','t','t','t','t','s','s','t','t','t','t','t','t','t','t','t','t','t','t','t','t'],
      ['t','t','t','t','t','t','t','t','t','t','t','t','t','t','s','s','t','t','t','t','t','t','t','t','t','t','t','t','t','t'],
      // y=3: tall-grass thins out, grass begins
      ['t','t','t','g','g','g','g','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','g','g','t','t','t','t'],
      ['t','t','g','g','G','g','g','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','G','g','g','g','g','t','t','t'],
      ['t','g','g','g','g','g','g','g','H','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','g','g','g','g','t','t'],
      ['t','g','g','g','g','g','g','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','g','g','g','g','g','t'],
      ['g','g','g','g','g','g','G','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','g','g','g','g','g','t'],
      ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','g','g','g','g','g','g'],
      // y=9: village square — sand opens out to a small plaza
      ['g','g','g','g','g','g','g','g','g','g','g','g','s','s','s','s','s','s','g','g','g','g','g','g','g','g','g','g','g','g'],
      ['g','g','g','g','g','g','g','g','g','g','g','g','s','s','s','s','s','s','g','g','g','g','g','g','g','g','g','g','g','g'],
      ['g','g','g','g','g','g','g','g','g','g','g','g','s','s','s','s','s','s','g','g','g','g','g','g','g','g','g','g','g','g'],
      ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','g','g','g','g','g','g'],
      ['g','g','g','G','g','g','g','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','H','g','g','g','g','g'],
      ['t','g','g','g','g','g','g','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','g','g','g','g','g','t'],
      ['t','g','g','g','g','g','g','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','g','g','g','g','g','t'],
      ['t','t','g','g','g','g','g','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','g','g','g','g','t','t'],
      // y=17: south shore — water beach approaching
      ['t','t','t','g','g','g','g','g','g','g','g','g','g','g','s','s','g','g','g','g','g','g','g','g','g','g','t','t','t','t'],
      ['w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w'],
      ['w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w','w'],
    ],
    // No World / Above Player layers in the foundation slice — those
    // come with multi-tile buildings + tree props in the next iteration.
    Objects: [
      // Player spawns in the village square, on the path.
      { type: 'SpawnPoint', name: 'default', at: [15, 10] },
    ],
  },
});
