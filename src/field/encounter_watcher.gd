class_name EncounterWatcher
extends Node

# Listens for the player's gamepiece arriving at a new cell and, if that
# cell is tall grass in the current region, rolls the region's weighted
# encounter table. On a hit, emits CombatEvents.combat_triggered with
# the chosen wild species + level.
#
# Attached by RegionBuilder to the region's root.

## Odds of an encounter firing per tall-grass step. Tunable; classic
## Pokemon was ~12%, which felt right for our earlier prototype.
@export_range(0.0, 1.0) var per_step_chance: float = 0.12

var _region: RegionResource = null
var _grass_cells: Dictionary = {}  # Vector2i → true for tall-grass tiles
var _rng: RandomNumberGenerator = null
var _player_gp: Gamepiece = null


func initialize(region: RegionResource) -> void:
	_region = region
	_rng = RandomNumberGenerator.new()
	_rng.randomize()
	_build_grass_set()
	Player.gamepiece_changed.connect(_on_player_changed)
	_on_player_changed()


func _build_grass_set() -> void:
	_grass_cells.clear()
	if _region == null: return
	# Mark any cell whose tile-key is tall_grass in the region.tall_grass_keys
	# OR flagged tall_grass in the TileKeys lookup.
	var tall_keys := {}
	for k in _region.tall_grass_keys:
		tall_keys[String(k)] = true
	for layer in _region.layers:
		if not (layer is Dictionary): continue
		var tiles: Array = layer.get("tiles", [])
		for y in tiles.size():
			var row = tiles[y]
			if not (row is Array): continue
			for x in row.size():
				var key_variant = row[x]
				if key_variant == null: continue
				var key := String(key_variant)
				if tall_keys.has(key) or TileKeys.is_tall_grass(key):
					_grass_cells[Vector2i(x, y)] = true


func _on_player_changed() -> void:
	if _player_gp != null and _player_gp.arrived.is_connected(_on_player_arrived):
		_player_gp.arrived.disconnect(_on_player_arrived)
	_player_gp = Player.gamepiece
	if _player_gp != null:
		_player_gp.arrived.connect(_on_player_arrived)


func _on_player_arrived() -> void:
	if _player_gp == null or _region == null: return
	var cell := Gameboard.get_cell_under_node(_player_gp) if Gameboard else Vector2i.ZERO
	if not _grass_cells.has(cell): return
	if _rng.randf() > per_step_chance: return
	var enc := _roll_encounter()
	if enc == null:
		return
	print("[EncounterWatcher] encounter! %s @ L%d" % [enc.species_id, enc.level])
	# TODO: emit CombatEvents.combat_triggered with a combat scene
	# configured for enc.species_id + enc.level. For now, just log so
	# the flow is visible end-to-end.


class Encounter:
	var species_id: String
	var level: int


func _roll_encounter() -> Encounter:
	# Weighted pick across region.encounters[].
	var total := 0.0
	for e in _region.encounters:
		if e is Dictionary:
			total += float(e.get("weight", 0.0))
	if total <= 0.0: return null
	var r := _rng.randf() * total
	var acc := 0.0
	for e in _region.encounters:
		if not (e is Dictionary): continue
		acc += float(e.get("weight", 0.0))
		if r <= acc:
			var out := Encounter.new()
			out.species_id = String(e.get("species_id", ""))
			var lo: int = int(e.get("min_level", 1))
			var hi: int = int(e.get("max_level", lo))
			out.level = _rng.randi_range(lo, hi)
			return out
	return null
