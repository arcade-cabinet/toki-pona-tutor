/**
 * Cold-land palette from the Fan-tasy `snow` pack.
 *
 * Local IDs come from the pack's Mountain Village / Winter Pass samples plus
 * direct TSX image-collection inspection for snow buildings, trees, and rocks.
 */
import type { Palette } from '../lib/types';

export const icePalette: Palette = {
  // Snow, ice, and village paths.
  s: { tsx: 'snow/Tileset_Snow', local_id: 8, description: 'deep snow field' },
  i: { tsx: 'snow/Tileset_Ground_Snow', local_id: 2078, description: 'icy village ground' },
  j: { tsx: 'snow/Tileset_Ground_Snow', local_id: 2084, description: 'icy ground variation' },
  r: { tsx: 'snow/Tileset_Road', local_id: 272, description: 'stone village path' },
  d: { tsx: 'snow/Tileset_Road', local_id: 20, description: 'snowy dirt entry path' },

  // Encounter grass.
  G: { tsx: 'snow/Tileset_TallGrass', local_id: 0, description: 'snow tall grass encounter tile' },

  // Snow village landmarks.
  house_blue: { tsx: 'snow/Objects_Buildings_Snow', local_id: 341, description: 'small blue snow house' },
  house_red: { tsx: 'snow/Objects_Buildings_Snow', local_id: 358, description: 'red-roof snow house' },
  well_snow: { tsx: 'snow/Objects_Buildings_Snow', local_id: 293, description: 'snowy village well' },

  // Garden and blockers.
  fence_h: { tsx: 'snow/Tileset_Fence_1_Snow', local_id: 13, description: 'horizontal snow fence' },
  fence_v: { tsx: 'snow/Tileset_Fence_1_Snow', local_id: 0, description: 'vertical snow fence' },
  crate_snow: { tsx: 'snow/Objects_Props_Snow', local_id: 414, description: 'snow garden crate' },

  // Trees, bushes, and rocks.
  tree_snow: { tsx: 'snow/Objects_Trees_Snow', local_id: 5, description: 'snow tree 3' },
  tree_winter: { tsx: 'snow/Objects_Trees_Snow', local_id: 30, description: 'winter tree 3' },
  bush_snow: { tsx: 'snow/Objects_Trees_Snow', local_id: 21, description: 'snow bush 1' },
  bush_winter: { tsx: 'snow/Objects_Trees_Snow', local_id: 7, description: 'winter bush 1' },
  rock_ice: { tsx: 'snow/Objects_Rocks_Snow', local_id: 95, description: 'small ice rock' },
  rock_snow: { tsx: 'snow/Objects_Rocks_Snow', local_id: 88, description: 'snowy brown rock' },
};
