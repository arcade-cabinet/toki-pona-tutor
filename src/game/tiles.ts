// Tile index maps, verified against labeled contact sheets.
// Both Tiny Town and Tiny Dungeon are 12 cols × 11 rows = 132 tiles at 16×16
// with 1px spacing. Same art family — they compose cleanly.

export const TOWN = {
  GRASS: 0,
  GRASS_DETAIL: 1,
  GRASS_FLOWERS: 2,

  TREE_ORANGE_1: 3,
  TREE_ORANGE_2: 4,
  TREE_GREEN_ROUND: 5, // full green bush (complete single tile)
  SPROUT_1: 6, // small green sprout
  SPROUT_2: 7,
  SPROUT_3: 8,

  PATH_TL: 12,
  PATH_TM: 13,
  PATH_TR: 14,
  PATH_ML: 24,
  PATH_MM: 25,
  PATH_MR: 26,
  PATH_BL: 36,
  PATH_BM: 37,
  PATH_BR: 38,

  BUSH_ORANGE: 15,
  BUSH_GREEN: 16,
  BUSH_GREEN_ALT: 17,
  MUSHROOMS: 29,
  DIRT_PATCH: 51,

  STONE_FLOOR: 43,

  // Houses (2-wide × 3-tall)
  H_BLUE_ROOF_L: 48,
  H_BLUE_ROOF_R: 49,
  H_BLUE_WALL_L: 60,
  H_BLUE_WALL_R: 61,
  H_BLUE_BASE_L: 72,
  H_BLUE_BASE_DOOR: 73,

  H_RED_ROOF_L: 52,
  H_RED_ROOF_R: 53,
  H_RED_WALL_L: 64,
  H_RED_WALL_R: 65,
  H_RED_BASE_L: 76,
  H_RED_BASE_DOOR: 77,

  FENCE_L: 80,
  FENCE_M: 81,
  FENCE_R: 82,

  SIGN_POST: 92,
  // Single-icon buildings — use roof-peak tiles as stand-alone 1-tile houses.
  HOUSE_ICON_BLUE: 63,
  HOUSE_ICON_RED: 67,
  // Village guard character (knight sprite in the town sheet)
  GUARD_CHAR: 104,
} as const;

// Tiny Dungeon characters and items. These are used as "sprites placed on top
// of the Tiny Town terrain" — player, NPCs, pickups.
export const DUNGEON = {
  WIZARD: 84,
  VILLAGER_YELLOW: 85, // our PLAYER — bright, legible
  BALD_ADVENTURER: 86,
  VIKING: 87,
  GIRL_BRAID: 88,
  KNIGHT_GREY: 96,
  KNIGHT_SILVER: 97,
  KID: 98,
  WOMAN_PURPLE: 99,
  SAGE_WHITE: 100,
  GHOST: 108,
  ORC_RED: 110,

  CHEST_CLOSED: 89,
  CHEST_OPEN_GOLD: 90,
  CHEST_OPEN_GEM: 91,
  CHEST_OPEN_RED: 92,
  KEY_SQUARE: 101,
  GEM: 102,
  SWORD_SMALL: 103,
  SWORD_IRON: 104,
  SWORD_STEEL: 105,
  DAGGER: 106,
  POTION_GREEN: 125,
  POTION_RED: 126,
  POTION_TEAL: 127,
  POTION_BLUE: 128,
  HAMMER: 129,
  AXE: 130,
} as const;

// Character role → sprite mapping for the village slice
export const CAST = {
  PLAYER: DUNGEON.VILLAGER_YELLOW,
  JAN_PONA: DUNGEON.KID, // warm, friendly quest giver
  JAN_TELO: DUNGEON.GIRL_BRAID, // water-keeper
  JAN_LAPE: DUNGEON.SAGE_WHITE, // drowsy elder at exit (future)
  JAN_ELDER: DUNGEON.WIZARD, // grammar teacher at the shrine (future)
} as const;
