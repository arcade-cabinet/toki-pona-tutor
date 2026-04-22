/**
 * Lake-village palette from the Fan-tasy `seasons` pack.
 *
 * Reuses the verified blocked-water tile from the riverside route and adds
 * stone/dirt town surfaces plus large collection-image buildings.
 */
import type { Palette } from '../lib/types';

export const lakeTownPalette: Palette = {
  g: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 50, description: 'summer island grass' },
  v: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 62, description: 'light island grass variation' },
  s: { tsx: 'seasons/Tileset_Sand', local_id: 0, description: 'lake shore sand' },
  d: { tsx: 'seasons/Tileset_Road', local_id: 20, description: 'packed dirt causeway' },
  p: { tsx: 'seasons/Tileset_Road', local_id: 272, description: 'stone village plaza' },
  w: { tsx: 'seasons/Tileset_Water', local_id: 26, description: 'blocked animated lake water' },

  house_blue: { tsx: 'seasons/Objects_Buildings_Seasons', local_id: 271, description: 'small hay-roof house' },
  house_red: { tsx: 'seasons/Objects_Buildings_Seasons', local_id: 58, description: 'narrow hay-roof house' },
  market_stand: { tsx: 'seasons/Objects_Buildings_Seasons', local_id: 282, description: 'red market stand' },

  tree_a: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 0, description: 'emerald tree 2' },
  tree_b: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 1, description: 'emerald tree 3' },
  bush_a: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 14, description: 'emerald bush 1' },
};
