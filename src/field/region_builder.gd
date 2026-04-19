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

## Scene used for the player character + controller. Defaults to open-rpg's
## gamepiece.tscn with a generic character visual + player controller added
## at runtime.
@export var player_gamepiece_scene: PackedScene = preload("res://src/field/gamepieces/gamepiece.tscn")
@export var player_controller_scene: PackedScene = preload("res://src/field/gamepieces/controllers/player_controller.tscn")
@export var player_gfx_scene: PackedScene = preload("res://overworld/characters/generic_character_gfx.tscn")

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
	_spawn_player()


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
	_gamepieces_root.y_sort_enabled = true
	add_child(_gamepieces_root)

	# Dungeon tilesheet is source 1 (characters + items).
	var dungeon_tex := _find_dungeon_texture()
	for npc_res: NpcResource in region.npcs:
		_spawn_npc_sprite(npc_res, dungeon_tex)
		print("[RegionBuilder]   NPC %s @ %s (role=%s)" % [
			npc_res.id, npc_res.tile, npc_res.role,
		])


func _spawn_npc_sprite(npc_res: NpcResource, dungeon_tex: Texture2D) -> void:
	var pivot := Node2D.new()
	pivot.name = "npc_%s" % npc_res.id
	pivot.position = Vector2(
		npc_res.tile.x * cell_size.x + cell_size.x * 0.5,
		npc_res.tile.y * cell_size.y + cell_size.y * 0.5,
	)
	_gamepieces_root.add_child(pivot)

	# Sprite — slice from the dungeon atlas. Kenney Tiny Dungeon is 12x11
	# at 16x16 with 1px spacing.
	if dungeon_tex != null:
		var sprite := Sprite2D.new()
		sprite.texture = dungeon_tex
		sprite.region_enabled = true
		var col := npc_res.sprite_frame % 12
		var row := npc_res.sprite_frame / 12
		sprite.region_rect = Rect2(col * 17, row * 17, 16, 16)
		pivot.add_child(sprite)

	# Name label above the sprite.
	var label := Label.new()
	label.text = npc_res.name_tp
	label.position = Vector2(0, -14)
	label.anchor_left = 0.5
	label.add_theme_font_size_override("font_size", 8)
	# Center-justify by shifting by half the measured width on layout.
	label.set("theme_override_colors/font_color", Color("#3D2E1E"))
	label.set("theme_override_colors/font_outline_color", Color("#FDF6E3"))
	label.set("theme_override_constants/outline_size", 2)
	# Quick centering: Label measures its text; put it at -half-width.
	label.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	label.position.x = -label.get_minimum_size().x * 0.5 - 8
	pivot.add_child(label)


func _spawn_signs() -> void:
	var town_tex := _find_town_texture()
	var signs_root := Node2D.new()
	signs_root.name = "Signs"
	add_child(signs_root)
	for sign_dict in region.signs:
		if not (sign_dict is Dictionary): continue
		var tile: Dictionary = sign_dict.get("tile", {"x": 0, "y": 0})
		print("[RegionBuilder]   sign %s @ %s" % [
			sign_dict.get("id", "?"), tile,
		])
		# Draw the sign post sprite (frame 92 in Tiny Town → atlas (8,7)).
		if town_tex != null:
			var sprite := Sprite2D.new()
			sprite.name = "sign_%s" % sign_dict.get("id", "x")
			sprite.texture = town_tex
			sprite.region_enabled = true
			sprite.region_rect = Rect2(8 * 17, 7 * 17, 16, 16)
			sprite.position = Vector2(
				int(tile.get("x", 0)) * cell_size.x + cell_size.x * 0.5,
				int(tile.get("y", 0)) * cell_size.y + cell_size.y * 0.5,
			)
			signs_root.add_child(sprite)


func _spawn_player() -> void:
	# Instantiate a Gamepiece at region.spawn, attach the generic
	# character gfx + player controller, hand the reference to Player.
	var gp = player_gamepiece_scene.instantiate()
	gp.name = "Player"
	# Gamepiece is a Path2D — positioning the root moves the gamepiece.
	gp.position = Vector2(
		region.spawn.x * cell_size.x + cell_size.x * 0.5,
		region.spawn.y * cell_size.y + cell_size.y * 0.5,
	)

	if player_gfx_scene != null:
		var gfx = player_gfx_scene.instantiate()
		gp.add_child(gfx)

	# Add to the scene so Gameboard can register the gamepiece.
	_gamepieces_root.add_child(gp)

	# Attach a controller so the player can move.
	if player_controller_scene != null:
		var ctrl = player_controller_scene.instantiate()
		gp.add_child(ctrl)
		if "is_active" in ctrl:
			ctrl.is_active = true

	# Wire the Player autoload — Camera tracking follows from this.
	if Player:
		Player.gamepiece = gp
	if Camera:
		Camera.gamepiece = gp


# Best-effort texture lookup: pull the atlas texture from the assigned
# tileset sources. Returns null if not found (sprite just won't draw).
func _find_town_texture() -> Texture2D:
	return _find_source_texture(TileKeys.SOURCE_TOWN)


func _find_dungeon_texture() -> Texture2D:
	return _find_source_texture(TileKeys.SOURCE_DUNGEON)


func _find_source_texture(source_id: int) -> Texture2D:
	if tileset == null: return null
	var src := tileset.get_source(source_id)
	if src is TileSetAtlasSource:
		return src.texture
	return null
