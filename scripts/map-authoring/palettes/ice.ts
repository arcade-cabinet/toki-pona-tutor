/**
 * Cold-land palette from the Fan-tasy `snow` pack.
 *
 * Local IDs come from the pack's Mountain Village / Winter Pass samples plus
 * direct TSX image-collection inspection for snow buildings, trees, and rocks.
 */
import type { Palette } from '../lib/types';
import { curatedTile } from '../config/art-curation';
import { collectionAtlasEntry } from '../config/collection-atlases';

const snowBuildings = 'snow/Objects_Buildings_Snow';
const snowProps = 'snow/Objects_Props_Snow';
const snowRocks = 'snow/Objects_Rocks_Snow';
const snowTrees = 'snow/Objects_Trees_Snow';

export const icePalette: Palette = {
  // Snow, ice, and village paths.
  s: curatedTile('fan_tasy.snow.snow.base', { description: 'deep snow field' }),
  i: curatedTile('fan_tasy.snow.ground.ice_base', { description: 'icy village ground' }),
  j: curatedTile('fan_tasy.snow.ground.ice_variation', { description: 'icy ground variation' }),
  r: curatedTile('fan_tasy.snow.road.stone', { description: 'stone village path' }),
  d: curatedTile('fan_tasy.snow.road.dirt', { description: 'snowy dirt entry path' }),

  // Encounter grass.
  G: curatedTile('fan_tasy.snow.snow.rough_encounter', {
    description: 'rough snow encounter fill',
  }),

  // Snow village landmarks.
  house_blue: { ...collectionAtlasEntry(snowBuildings, 341), description: 'small blue snow house' },
  house_red: { ...collectionAtlasEntry(snowBuildings, 358), description: 'red-roof snow house' },
  well_snow: { ...collectionAtlasEntry(snowBuildings, 293), description: 'snowy village well' },

  // Garden and blockers.
  fence_h: curatedTile('fan_tasy.snow.fence.horizontal', { description: 'horizontal snow fence' }),
  fence_v: curatedTile('fan_tasy.snow.fence.vertical', { description: 'vertical snow fence' }),
  crate_snow: { ...collectionAtlasEntry(snowProps, 414), description: 'snow garden crate' },

  // Trees, bushes, and rocks.
  tree_snow: { ...collectionAtlasEntry(snowTrees, 5), description: 'snow tree 3' },
  tree_winter: { ...collectionAtlasEntry(snowTrees, 30), description: 'winter tree 3' },
  bush_snow: { ...collectionAtlasEntry(snowTrees, 21), description: 'snow bush 1' },
  bush_winter: { ...collectionAtlasEntry(snowTrees, 7), description: 'winter bush 1' },
  rock_ice: { ...collectionAtlasEntry(snowRocks, 95), description: 'small ice rock' },
  rock_snow: { ...collectionAtlasEntry(snowRocks, 88), description: 'snowy brown rock' },
};
