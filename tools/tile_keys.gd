class_name TileKeys
extends RefCounted

# Maps authored tile keys (short strings in content/spine/regions/*.json)
# to Godot TileMapLayer source_id + atlas_coords.
#
# Two tilesets are supported, selected per-region by biome:
#
#   biome "town" (default) → overworld/maps/tilesets/kenney_terrain.tres
#     source 0 = town_tilemap.png    (12x11 Kenney Tiny Town)
#     source 1 = dungeon_tilemap.png (12x11 Kenney Tiny Dungeon)
#
#   biome "forest"        → content/tilesets/forest_summer.tres
#     source 0 = Lonesome_Forest_FLOOR.png                (7x5)
#     source 1 = Lonesome_Forest_DETAIL_OBJECTS.png       (7x8, tall grass + foliage)
#     source 2 = Lonesome_Forest_COBBLESTONE_PATH.png     (7x7)
#     source 3 = Lonesome_Forest_WALLS_and_CLIFF_EDGES.png(7x10, solid)
#     source 4 = Lonesome_Forest_RIVER_and_WATER_EDGES.png(7x7, solid)
#     source 5 = Trees-Expanded_TEMPERATE.png             (12x25, solid)
#
# Tile frame index → atlas coords: (frame % cols, frame / cols).
# The mapping stays source-of-truth here; region_builder + encounter_watcher
# query via resolve(key, biome) / is_solid(key, biome) / is_tall_grass(key, biome).

const SOURCE_TOWN := 0
const SOURCE_DUNGEON := 1

# forest_summer source ids
const SOURCE_FOREST_FLOOR := 0
const SOURCE_FOREST_DETAIL := 1
const SOURCE_FOREST_PATH := 2
const SOURCE_FOREST_WALL := 3
const SOURCE_FOREST_WATER := 4
const SOURCE_FOREST_TREE := 5

const BIOME_TOWN := "town"
const BIOME_FOREST := "forest"


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


# Forest-biome key overrides. Entries in this table take precedence over KEYS
# when resolve(..., BIOME_FOREST) is called. Source ids are forest_summer-local
# (see SOURCE_FOREST_* constants above), matching content/tilesets/forest_summer.tres.
#
# Only the keys that differ from the Kenney town mapping need to appear here;
# anything not listed falls back to the town entry in KEYS and will render with
# the town atlas' source ids — which is not what a forest region wants, so the
# forest table should stay exhaustive for keys likely to appear in forest maps.
const FOREST_KEYS: Dictionary = {
	# Floor grass — plain walkable grass comes from FLOOR (7x5 grid).
	"grass":         {"source": SOURCE_FOREST_FLOOR,  "coords": Vector2i(0, 0)},
	"g":             {"source": SOURCE_FOREST_FLOOR,  "coords": Vector2i(0, 0)},
	"grass_detail":  {"source": SOURCE_FOREST_FLOOR,  "coords": Vector2i(1, 0)},
	"gd":            {"source": SOURCE_FOREST_FLOOR,  "coords": Vector2i(1, 0)},
	"grass_flowers": {"source": SOURCE_FOREST_FLOOR,  "coords": Vector2i(2, 0)},
	"gf":            {"source": SOURCE_FOREST_FLOOR,  "coords": Vector2i(2, 0)},
	"dirt":          {"source": SOURCE_FOREST_FLOOR,  "coords": Vector2i(0, 4)},

	# Tall grass / foliage — comes from DETAIL_OBJECTS (7x8 grid). Walkable, fires encounters.
	"tall_grass":    {"source": SOURCE_FOREST_DETAIL, "coords": Vector2i(0, 0), "tall_grass": true},
	"grass_tall":    {"source": SOURCE_FOREST_DETAIL, "coords": Vector2i(0, 0), "tall_grass": true},
	"sprout":        {"source": SOURCE_FOREST_DETAIL, "coords": Vector2i(1, 0)},
	"bush":          {"source": SOURCE_FOREST_DETAIL, "coords": Vector2i(2, 0), "solid": true},
	"bush_o":        {"source": SOURCE_FOREST_DETAIL, "coords": Vector2i(3, 0), "solid": true},
	"mushroom":      {"source": SOURCE_FOREST_DETAIL, "coords": Vector2i(4, 0)},

	# Paths — COBBLESTONE_PATH (7x7 grid).
	"path":    {"source": SOURCE_FOREST_PATH, "coords": Vector2i(1, 1)},
	"path_tl": {"source": SOURCE_FOREST_PATH, "coords": Vector2i(0, 0)},
	"path_tm": {"source": SOURCE_FOREST_PATH, "coords": Vector2i(1, 0)},
	"path_tr": {"source": SOURCE_FOREST_PATH, "coords": Vector2i(2, 0)},
	"path_ml": {"source": SOURCE_FOREST_PATH, "coords": Vector2i(0, 1)},
	"path_mr": {"source": SOURCE_FOREST_PATH, "coords": Vector2i(2, 1)},
	"path_bl": {"source": SOURCE_FOREST_PATH, "coords": Vector2i(0, 2)},
	"path_bm": {"source": SOURCE_FOREST_PATH, "coords": Vector2i(1, 2)},
	"path_br": {"source": SOURCE_FOREST_PATH, "coords": Vector2i(2, 2)},

	# Trees — Trees-Expanded_TEMPERATE (12x25 grid). All solid.
	"tree":   {"source": SOURCE_FOREST_TREE, "coords": Vector2i(0, 0), "solid": true},
	"tree_g": {"source": SOURCE_FOREST_TREE, "coords": Vector2i(0, 0), "solid": true},
	"tree_y": {"source": SOURCE_FOREST_TREE, "coords": Vector2i(1, 0), "solid": true},
	"tree_o": {"source": SOURCE_FOREST_TREE, "coords": Vector2i(2, 0), "solid": true},

	# Walls / cliffs — all solid.
	"stone": {"source": SOURCE_FOREST_WALL, "coords": Vector2i(0, 0), "solid": true},
	"cliff": {"source": SOURCE_FOREST_WALL, "coords": Vector2i(1, 0), "solid": true},
	"wall":  {"source": SOURCE_FOREST_WALL, "coords": Vector2i(0, 0), "solid": true},

	# Water — impassable, uses river atlas (no color_overlay needed; the sprite IS water).
	"water":         {"source": SOURCE_FOREST_WATER, "coords": Vector2i(1, 1), "solid": true},
	"water_deep":    {"source": SOURCE_FOREST_WATER, "coords": Vector2i(2, 1), "solid": true},
	"water_shallow": {"source": SOURCE_FOREST_WATER, "coords": Vector2i(0, 1)},
}


# Look up the dict for a key in the chosen biome. Forest falls back to the town
# table when a key isn't in FOREST_KEYS so rare town-only props still render.
static func _lookup(key: String, biome: String) -> Variant:
	if biome == BIOME_FOREST and FOREST_KEYS.has(key):
		return FOREST_KEYS[key]
	if KEYS.has(key):
		return KEYS[key]
	return null


static func resolve(key: String, biome: String = BIOME_TOWN) -> Dictionary:
	var entry: Variant = _lookup(key, biome)
	if entry is Dictionary:
		return entry
	# Fallback to grass so a typo doesn't crash the scene.
	if biome == BIOME_FOREST:
		return {"source": SOURCE_FOREST_FLOOR, "coords": Vector2i(0, 0)}
	return {"source": SOURCE_TOWN, "coords": Vector2i(0, 0)}


static func is_solid(key: String, biome: String = BIOME_TOWN) -> bool:
	var entry: Variant = _lookup(key, biome)
	if entry is Dictionary:
		return entry.get("solid", false)
	return false


static func is_tall_grass(key: String, biome: String = BIOME_TOWN) -> bool:
	var entry: Variant = _lookup(key, biome)
	if entry is Dictionary:
		return entry.get("tall_grass", false)
	return false


static func color_overlay(key: String, biome: String = BIOME_TOWN) -> Variant:
	var entry: Variant = _lookup(key, biome)
	if entry is Dictionary:
		return entry.get("color_overlay", null)
	return null
