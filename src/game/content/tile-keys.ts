/**
 * Content tile-key → Kenney sprite frame resolver.
 *
 * Regions in `generated/world.json` use short string keys for each tile
 * cell. At scene-paint time we map those keys to a `{ sheet, frame }`
 * pair the Phaser scene draws. New keys can be added as content needs
 * them — the engine recognizes only what's declared here.
 */
import { TOWN, DUNGEON } from '../tiles';

export type Sheet = 'town' | 'dungeon';

export interface TileResolution {
  sheet: Sheet;
  frame: number;
  /** True if this key blocks movement. Regions may override via their
   *  `solid_keys` list, but the default is captured here. */
  solid?: boolean;
  /** True if this key counts as tall grass (encounter roll fires on step). */
  tall_grass?: boolean;
  /** Optional solid-color overlay (hex) painted on top of the frame —
   *  used for tiles the Kenney sheet doesn't have a sprite for (e.g.
   *  water). When set, the frame acts as a base (usually grass) and the
   *  color is drawn as a rectangle filling the tile. */
  color_overlay?: string;
}

/**
 * The shared key map. Agents authoring regions use these keys in tile
 * layer arrays. Unknown keys render as the fallback (grass) and log a
 * warning in dev mode.
 */
export const TILE_KEYS: Record<string, TileResolution> = {
  // Grass variants
  grass: { sheet: 'town', frame: TOWN.GRASS },
  grass_detail: { sheet: 'town', frame: TOWN.GRASS_DETAIL },
  grass_flowers: { sheet: 'town', frame: TOWN.GRASS_FLOWERS },
  gf: { sheet: 'town', frame: TOWN.GRASS_FLOWERS },
  gd: { sheet: 'town', frame: TOWN.GRASS_DETAIL },
  g: { sheet: 'town', frame: TOWN.GRASS },

  // Paths
  path: { sheet: 'town', frame: TOWN.PATH_MM },
  path_tm: { sheet: 'town', frame: TOWN.PATH_TM },
  path_ml: { sheet: 'town', frame: TOWN.PATH_ML },
  path_mr: { sheet: 'town', frame: TOWN.PATH_MR },
  path_bm: { sheet: 'town', frame: TOWN.PATH_BM },

  stone: { sheet: 'town', frame: TOWN.STONE_FLOOR },

  // Water — the town sheet has no water tile, so paint a blue overlay
  // on top of a stone base. Solid by default; ma_telo-style regions can
  // override via solid_keys if they want bridges or shallow crossings.
  water: {
    sheet: 'town',
    frame: TOWN.STONE_FLOOR,
    solid: true,
    color_overlay: '#3b82f6',
  },
  water_deep: {
    sheet: 'town',
    frame: TOWN.STONE_FLOOR,
    solid: true,
    color_overlay: '#1d4ed8',
  },
  water_shallow: {
    sheet: 'town',
    frame: TOWN.STONE_FLOOR,
    color_overlay: '#60a5fa',
  },

  // Flora
  tree: { sheet: 'town', frame: TOWN.TREE_GREEN_ROUND, solid: true },
  tree_g: { sheet: 'town', frame: TOWN.TREE_GREEN_ROUND, solid: true },
  tree_y: { sheet: 'town', frame: TOWN.TREE_ORANGE_1, solid: true },
  tree_o: { sheet: 'town', frame: TOWN.TREE_ORANGE_2, solid: true },
  bush: { sheet: 'town', frame: TOWN.BUSH_GREEN, solid: true },
  bush_o: { sheet: 'town', frame: TOWN.BUSH_ORANGE, solid: true },
  sprout: { sheet: 'town', frame: TOWN.SPROUT_1 },
  mushroom: { sheet: 'town', frame: TOWN.MUSHROOMS },

  // Tall grass — the encounter-triggering tile
  grass_tall: { sheet: 'town', frame: TOWN.SPROUT_2, tall_grass: true },
  tall_grass: { sheet: 'town', frame: TOWN.SPROUT_2, tall_grass: true },

  // Buildings (single-tile icon houses for readability)
  house: { sheet: 'town', frame: TOWN.HOUSE_ICON_BLUE, solid: true },
  house_b: { sheet: 'town', frame: TOWN.HOUSE_ICON_BLUE, solid: true },
  house_r: { sheet: 'town', frame: TOWN.HOUSE_ICON_RED, solid: true },
  house_1: { sheet: 'town', frame: TOWN.HOUSE_ICON_BLUE, solid: true },
  house_2: { sheet: 'town', frame: TOWN.HOUSE_ICON_RED, solid: true },

  // Props
  sign: { sheet: 'town', frame: TOWN.SIGN_POST, solid: true },
  fence: { sheet: 'town', frame: TOWN.FENCE_M, solid: true },
  fence_l: { sheet: 'town', frame: TOWN.FENCE_L, solid: true },
  fence_r: { sheet: 'town', frame: TOWN.FENCE_R, solid: true },

  dirt: { sheet: 'town', frame: TOWN.DIRT_PATCH },

  // Items — when an item sits as a tile (kili on the ground, etc.)
  kili: { sheet: 'dungeon', frame: DUNGEON.POTION_RED },
  gem: { sheet: 'dungeon', frame: DUNGEON.GEM },
  chest: { sheet: 'dungeon', frame: DUNGEON.CHEST_CLOSED, solid: true },
};

export function resolveTileKey(key: string): TileResolution | null {
  return TILE_KEYS[key] ?? null;
}
