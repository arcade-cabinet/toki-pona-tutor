class_name TileKeys
extends RefCounted

# Maps authored tile keys (short strings in content/spine/regions/*.json)
# to Godot TileMapLayer source_id + atlas_coords.
#
# The Kenney tilesets are loaded in overworld/maps/tilesets/kenney_terrain.tres:
#   source 0 = town_tilemap.png (12x11 Tiny Town)
#   source 1 = dungeon_tilemap.png (12x11 Tiny Dungeon — characters, items)
#
# Tile frame index → atlas coords: (frame % 12, frame / 12).
# Our historical Phaser frame constants (src/game/tiles.ts from the web era)
# told us which frame each key points at. We translate those to atlas coords
# here, so the mapping stays source-of-truth in one place.

const SOURCE_TOWN := 0
const SOURCE_DUNGEON := 1


# frame_to_coords(25) -> Vector2i(1, 2)  (25 = 2*12 + 1)
static func frame_to_coords(frame: int) -> Vector2i:
	return Vector2i(frame % 12, frame / 12)


# All known keys. Keys authored in content/spine/regions that aren't here
# fall through to `grass` with a warning in dev.
#
# Structure: Dictionary[String, Dictionary] with fields:
#   source: int (SOURCE_TOWN / SOURCE_DUNGEON)
#   coords: Vector2i (atlas coords in the source)
#   solid: bool (default false) — collides with the player
#   tall_grass: bool (default false) — encounter roll fires on step
#   color_overlay: Color (default null) — blue wash for water tiles etc
const KEYS: Dictionary = {
	# Grass variants
	"grass": {"source": 0, "coords": Vector2i(0, 0)},
	"grass_detail": {"source": 0, "coords": Vector2i(1, 0)},
	"grass_flowers": {"source": 0, "coords": Vector2i(2, 0)},
	"gf": {"source": 0, "coords": Vector2i(2, 0)},
	"gd": {"source": 0, "coords": Vector2i(1, 0)},
	"g": {"source": 0, "coords": Vector2i(0, 0)},

	# Paths (frames 12-14 top, 24-26 mid, 36-38 bottom)
	"path": {"source": 0, "coords": Vector2i(1, 2)},
	"path_tl": {"source": 0, "coords": Vector2i(0, 1)},
	"path_tm": {"source": 0, "coords": Vector2i(1, 1)},
	"path_tr": {"source": 0, "coords": Vector2i(2, 1)},
	"path_ml": {"source": 0, "coords": Vector2i(0, 2)},
	"path_mr": {"source": 0, "coords": Vector2i(2, 2)},
	"path_bl": {"source": 0, "coords": Vector2i(0, 3)},
	"path_bm": {"source": 0, "coords": Vector2i(1, 3)},
	"path_br": {"source": 0, "coords": Vector2i(2, 3)},

	# Stone (frame 43 = row 3, col 7)
	"stone": {"source": 0, "coords": Vector2i(7, 3)},

	# Water — Kenney Tiny Town has no real water sprite, so we render
	# a solid-color tile on top of stone. The scene builder reads
	# color_overlay and paints a ColorRect over the base tile.
	"water": {
		"source": 0, "coords": Vector2i(7, 3),
		"solid": true, "color_overlay": Color("#3b82f6"),
	},
	"water_deep": {
		"source": 0, "coords": Vector2i(7, 3),
		"solid": true, "color_overlay": Color("#1d4ed8"),
	},
	"water_shallow": {
		"source": 0, "coords": Vector2i(7, 3),
		"color_overlay": Color("#60a5fa"),
	},

	# Flora
	"tree": {"source": 0, "coords": Vector2i(5, 0), "solid": true},
	"tree_g": {"source": 0, "coords": Vector2i(5, 0), "solid": true},
	"tree_y": {"source": 0, "coords": Vector2i(3, 0), "solid": true},
	"tree_o": {"source": 0, "coords": Vector2i(4, 0), "solid": true},
	"bush": {"source": 0, "coords": Vector2i(4, 1), "solid": true},
	"bush_o": {"source": 0, "coords": Vector2i(3, 1), "solid": true},
	"sprout": {"source": 0, "coords": Vector2i(6, 0)},
	"mushroom": {"source": 0, "coords": Vector2i(5, 2)},

	# Tall grass — encounter tile
	"grass_tall": {"source": 0, "coords": Vector2i(7, 0), "tall_grass": true},
	"tall_grass": {"source": 0, "coords": Vector2i(7, 0), "tall_grass": true},

	# Houses (single-tile icons)
	"house": {"source": 0, "coords": Vector2i(3, 5), "solid": true},
	"house_b": {"source": 0, "coords": Vector2i(3, 5), "solid": true},
	"house_r": {"source": 0, "coords": Vector2i(7, 5), "solid": true},
	"house_1": {"source": 0, "coords": Vector2i(3, 5), "solid": true},
	"house_2": {"source": 0, "coords": Vector2i(7, 5), "solid": true},

	# Props
	"sign": {"source": 0, "coords": Vector2i(8, 7), "solid": true},
	"fence": {"source": 0, "coords": Vector2i(9, 6), "solid": true},
	"fence_l": {"source": 0, "coords": Vector2i(8, 6), "solid": true},
	"fence_r": {"source": 0, "coords": Vector2i(10, 6), "solid": true},
	"dirt": {"source": 0, "coords": Vector2i(3, 4)},

	# Items — when a pickup sits as a world tile (legacy; prefer Pickups)
	"kili": {"source": 1, "coords": Vector2i(6, 10)},
	"gem": {"source": 1, "coords": Vector2i(6, 8)},
	"chest": {"source": 1, "coords": Vector2i(5, 7), "solid": true},
}


static func resolve(key: String) -> Dictionary:
	if KEYS.has(key):
		return KEYS[key]
	# Fallback to grass so a typo doesn't crash the scene.
	return {"source": 0, "coords": Vector2i(0, 0)}


static func is_solid(key: String) -> bool:
	return KEYS.get(key, {}).get("solid", false)


static func is_tall_grass(key: String) -> bool:
	return KEYS.get(key, {}).get("tall_grass", false)


static func color_overlay(key: String):
	return KEYS.get(key, {}).get("color_overlay", null)
