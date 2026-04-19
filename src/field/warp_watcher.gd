class_name WarpWatcher
extends Node

# Watches for the player gamepiece to arrive on a tile configured as a
# warp in the current region. On a match, reloads the main scene with
# the target region set as the current region_id, dropping the player
# at to_tile.
#
# Warp resolution is data-driven: region.warps[] is Array of dicts
#   {id, tile: {x,y}, to_region, to_tile: {x,y}}.

var _region: RegionResource = null
var _player_gp: Gamepiece = null
var _warps_by_cell: Dictionary = {}  # Vector2i → Dictionary (warp entry)
var _warp_firing: bool = false  # guards against re-entry during the transition


func initialize(region: RegionResource) -> void:
	_region = region
	_warps_by_cell.clear()
	for w in region.warps:
		if not (w is Dictionary): continue
		var tile: Dictionary = w.get("tile", {"x": 0, "y": 0})
		_warps_by_cell[Vector2i(int(tile.get("x", 0)), int(tile.get("y", 0)))] = w
	Player.gamepiece_changed.connect(_on_player_changed)
	_on_player_changed()


func _on_player_changed() -> void:
	if _player_gp != null and _player_gp.arrived.is_connected(_on_player_arrived):
		_player_gp.arrived.disconnect(_on_player_arrived)
	_player_gp = Player.gamepiece
	if _player_gp != null:
		_player_gp.arrived.connect(_on_player_arrived)


func _on_player_arrived() -> void:
	if _warp_firing or _player_gp == null or Gameboard == null: return
	var cell: Vector2i = Gameboard.get_cell_under_node(_player_gp)
	if not _warps_by_cell.has(cell): return
	var warp: Dictionary = _warps_by_cell[cell]
	var target_region: String = String(warp.get("to_region", ""))
	var to_tile_dict: Dictionary = warp.get("to_tile", {"x": 0, "y": 0})
	var to_cell := Vector2i(int(to_tile_dict.get("x", 0)), int(to_tile_dict.get("y", 0)))
	print("[WarpWatcher] → %s at %s" % [target_region, to_cell])
	_warp_firing = true
	_perform_warp(target_region, to_cell)


# Reload the main scene pointing at a different region. We store the
# target in a static singleton (Engine.meta) so the fresh RegionBuilder
# picks it up on _ready().
func _perform_warp(region_id: String, to_cell: Vector2i) -> void:
	Engine.set_meta("warp_target_region", region_id)
	Engine.set_meta("warp_target_tile", to_cell)
	# Transition out and reload.
	if Transition and Transition.has_method("cover"):
		await Transition.cover(0.2)
	get_tree().reload_current_scene()
