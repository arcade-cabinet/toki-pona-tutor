class_name FieldTriggerWatcher
extends Node

# Watches for the player gamepiece to arrive on a tile configured as a
# scripted (non-warp) trigger in the current region. On a match, emits
# FieldEvents.dialog_requested or FieldEvents.combat_triggered depending
# on the trigger's kind. Keeps set-piece events authorable as data.
#
# Region data shape (region.triggers[]):
#   {
#     id: String,                  # unique within region
#     tile: {x: int, y: int},
#     kind: "dialog" | "combat",
#     dialog_id: String,           # required when kind=="dialog"
#     arena: String,               # res:// path, required when kind=="combat"
#     once: bool,                  # default true — fire at most once per save
#     when_flags: {flag: bool},    # optional gate
#   }
#
# "Once" state is tracked in Engine meta (intra-session) so re-entering
# the same tile does not re-fire. Cross-session persistence can layer on
# TokiSave flags via the trigger's own set_flag side-effect if desired.

var _region: RegionResource = null
var _player_gp: Gamepiece = null
var _triggers_by_cell: Dictionary = {}  # Vector2i → Dictionary (trigger entry)
var _firing: bool = false


func initialize(region: RegionResource) -> void:
	_region = region
	_triggers_by_cell.clear()
	for t in region.triggers:
		if not (t is Dictionary): continue
		var tile: Dictionary = t.get("tile", {"x": 0, "y": 0})
		var cell := Vector2i(int(tile.get("x", 0)), int(tile.get("y", 0)))
		_triggers_by_cell[cell] = t
	Player.gamepiece_changed.connect(_on_player_changed)
	_on_player_changed()


func _on_player_changed() -> void:
	if _player_gp != null and _player_gp.arrived.is_connected(_on_player_arrived):
		_player_gp.arrived.disconnect(_on_player_arrived)
	_player_gp = Player.gamepiece
	if _player_gp != null:
		_player_gp.arrived.connect(_on_player_arrived)


func _on_player_arrived() -> void:
	if _firing or _player_gp == null or _region == null or Gameboard == null:
		return
	var cell: Vector2i = Gameboard.get_cell_under_node(_player_gp)
	if not _triggers_by_cell.has(cell):
		return
	var trigger: Dictionary = _triggers_by_cell[cell]
	if not _flags_satisfied(trigger):
		return
	var once: bool = bool(trigger.get("once", true))
	var trigger_id := String(trigger.get("id", ""))
	if trigger_id == "":
		trigger_id = "%d_%d" % [cell.x, cell.y]
	var fired_key := "trigger_fired_%s_%s" % [_region.id, trigger_id]
	if once and bool(Engine.get_meta(fired_key, false)):
		return
	_firing = true
	var kind := String(trigger.get("kind", ""))
	match kind:
		"dialog":
			_fire_dialog(trigger)
		"combat":
			_fire_combat(trigger)
		_:
			push_warning("[FieldTriggerWatcher] unknown kind '%s' on trigger %s" % [
				kind, trigger.get("id", "?"),
			])
			_firing = false
			return
	if once:
		Engine.set_meta(fired_key, true)
	_firing = false


func _flags_satisfied(trigger: Dictionary) -> bool:
	var when_flags: Dictionary = trigger.get("when_flags", {})
	for key in when_flags:
		var required: bool = bool(when_flags[key])
		var current: bool = bool(Engine.get_meta("flag_" + String(key), false))
		if current != required:
			return false
	return true


func _fire_dialog(trigger: Dictionary) -> void:
	var dialog_id := String(trigger.get("dialog_id", ""))
	if dialog_id == "":
		push_warning("[FieldTriggerWatcher] dialog trigger missing dialog_id")
		return
	var node := _find_dialog(dialog_id)
	if node == null:
		push_warning("[FieldTriggerWatcher] no dialog with id '%s' in region %s" % [
			dialog_id, _region.id,
		])
		return
	if FieldEvents and FieldEvents.has_signal("dialog_requested"):
		FieldEvents.emit_signal("dialog_requested", node)


func _fire_combat(trigger: Dictionary) -> void:
	var arena_path := String(trigger.get("arena", ""))
	if arena_path == "":
		push_warning("[FieldTriggerWatcher] combat trigger missing arena path")
		return
	if not ResourceLoader.exists(arena_path):
		push_warning("[FieldTriggerWatcher] arena scene not found: %s" % arena_path)
		return
	var arena: PackedScene = load(arena_path)
	if arena == null:
		push_warning("[FieldTriggerWatcher] arena failed to load: %s" % arena_path)
		return
	if FieldEvents and FieldEvents.has_signal("combat_triggered"):
		FieldEvents.emit_signal("combat_triggered", arena)


func _find_dialog(dialog_id: String) -> DialogResource:
	for d: DialogResource in _region.dialog:
		if d.id == dialog_id:
			return d
	return null
