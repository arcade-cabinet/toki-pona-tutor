@tool
class_name RegionBuilder
extends Node2D

# Hydrates a scene from a RegionResource. Procedurally builds:
#   - A GameboardLayer TileMap from the region's tile-key grid
#   - A GameboardProperties resource sized to region.width × height
#   - NPC Gamepieces positioned at region.npcs[].tile
#   - Sign Gamepieces at region.signs[].tile
#   - Warp triggers at region.warps[].tile
#   - A ColorRect sky tinted to region.sky_color
#
# Usage: place a RegionBuilder node as a child of Map; set region_id;
# _ready() fetches the region from World and builds everything.

## Content id of the region to build. If empty, uses World.start_region_id.
@export var region_id: String = ""

## Tileset resource used for painting. Defaults to kenney_terrain.tres.
@export var tileset: TileSet

## Cell size — matches the Kenney tilesheet tile size.
@export var cell_size: Vector2i = Vector2i(16, 16)

var region: RegionResource = null

# Children built procedurally.
var _tilemap: GameboardLayer = null
var _sky: ColorRect = null
var _gamepieces_root: Node2D = null


func _ready() -> void:
	if Engine.is_editor_hint():
		return
	if region_id == "":
		region_id = World.start_region_id
	if region_id == "":
		push_error("[RegionBuilder] no region_id to build (World not loaded?)")
		return
	region = World.find_region(region_id)
	if region == null:
		push_error("[RegionBuilder] unknown region id '%s'" % region_id)
		return
	print("[RegionBuilder] building %s (%dx%d)" % [region.id, region.width, region.height])
	_build()


func _build() -> void:
	_build_sky()
	_build_tilemap()
	_configure_gameboard()
	_spawn_npcs()
	_spawn_signs()


func _build_sky() -> void:
	_sky = ColorRect.new()
	_sky.name = "Sky"
	_sky.color = Color(region.sky_color)
	_sky.size = Vector2(region.width * cell_size.x, region.height * cell_size.y)
	_sky.z_index = -100
	_sky.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_sky)


func _build_tilemap() -> void:
	_tilemap = GameboardLayer.new()
	_tilemap.name = "Ground"
	if tileset != null:
		_tilemap.tile_set = tileset
	add_child(_tilemap)

	# Paint each layer. Higher-depth layers render on top via z_index.
	for i in region.layers.size():
		var layer: Dictionary = region.layers[i]
		_paint_layer(layer, int(layer.get("depth", i)))


func _paint_layer(layer: Dictionary, depth: int) -> void:
	# Each layer is {name, tiles: [[string|null]], solid_keys, depth}.
	# For the ground layer we write to our GameboardLayer. For object
	# layers we use a separate TileMapLayer sibling so objects sit
	# above ground and the collider logic only applies to walls.
	var tmap := _tilemap
	if depth > 0:
		tmap = GameboardLayer.new()
		tmap.name = "Objects_%d" % depth
		tmap.tile_set = _tilemap.tile_set
		tmap.z_index = depth
		add_child(tmap)

	var tiles: Array = layer.get("tiles", [])
	var solid_override: Array = layer.get("solid_keys", [])

	for y in tiles.size():
		var row = tiles[y]
		if not (row is Array):
			continue
		for x in row.size():
			var key_variant = row[x]
			if key_variant == null:
				continue
			var key := String(key_variant)
			var resolved := TileKeys.resolve(key)
			var source: int = resolved.get("source", 0)
			var coords: Vector2i = resolved.get("coords", Vector2i.ZERO)
			tmap.set_cell(Vector2i(x, y), source, coords)

			# Color overlay (water tiles etc).
			var overlay = resolved.get("color_overlay", null)
			if overlay is Color:
				var rect := ColorRect.new()
				rect.color = overlay
				rect.color.a = 0.78
				rect.size = Vector2(cell_size)
				rect.position = Vector2(x * cell_size.x, y * cell_size.y)
				rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
				rect.z_index = depth
				add_child(rect)


func _configure_gameboard() -> void:
	var props := GameboardProperties.new()
	props.extents = Rect2i(0, 0, region.width, region.height)
	props.cell_size = cell_size
	# Find the parent Map and set its properties so Camera/Gameboard pick up.
	var map := get_parent()
	if map != null and "gameboard_properties" in map:
		map.gameboard_properties = props


func _spawn_npcs() -> void:
	_gamepieces_root = Node2D.new()
	_gamepieces_root.name = "Gamepieces"
	add_child(_gamepieces_root)
	# Gamepiece spawning is deferred — requires wiring per-NPC Gamepiece
	# scenes that know about dialog + interaction. Done in the NPC
	# interaction system (follow-up).
	for npc_res: NpcResource in region.npcs:
		print("[RegionBuilder]   NPC %s @ %s (role=%s)" % [
			npc_res.id, npc_res.tile, npc_res.role,
		])


func _spawn_signs() -> void:
	for sign_dict in region.signs:
		if not (sign_dict is Dictionary): continue
		var tile: Dictionary = sign_dict.get("tile", {"x": 0, "y": 0})
		print("[RegionBuilder]   sign %s @ %s" % [
			sign_dict.get("id", "?"), tile,
		])
