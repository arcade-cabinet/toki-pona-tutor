class_name PartyPanel
extends CanvasLayer

# Party roster overlay. Press P (or the `party_panel` action when bound)
# on the field to open. Shows up to 6 slots — each lists species_id,
# level, HP/max_hp bar, and 4-move grid + XP progress on tap.
# Uses a kili inventory item to restore HP out of combat when selected.

const PARTY_ACTION := "party_panel"
const HEAL_ITEM_ID := "kili"
const HEAL_AMOUNT := 20

@onready var _root: Control = $Root
@onready var _slots_vbox: VBoxContainer = $Root/Margin/Panel/Columns/Slots
@onready var _detail_panel: PanelContainer = $Root/Margin/Panel/Columns/Detail
@onready var _detail_title: Label = $Root/Margin/Panel/Columns/Detail/V/Title
@onready var _detail_hp: Label = $Root/Margin/Panel/Columns/Detail/V/HP
@onready var _detail_xp: Label = $Root/Margin/Panel/Columns/Detail/V/XP
@onready var _detail_moves: VBoxContainer = $Root/Margin/Panel/Columns/Detail/V/Moves
@onready var _use_kili_btn: Button = $Root/Margin/Panel/Columns/Detail/V/UseKili
@onready var _hint: Label = $Root/Margin/Panel/Hint

var _selected_index: int = -1


func _ready() -> void:
	visible = false
	_detail_panel.visible = false
	_use_kili_btn.pressed.connect(_on_use_kili)
	process_mode = Node.PROCESS_MODE_ALWAYS


func _unhandled_input(event: InputEvent) -> void:
	var toggle_pressed := false
	if InputMap.has_action(PARTY_ACTION) and event.is_action_pressed(PARTY_ACTION):
		toggle_pressed = true
	elif event is InputEventKey and event.pressed and not event.echo \
			and (event as InputEventKey).keycode == KEY_P:
		toggle_pressed = true
	if toggle_pressed:
		get_viewport().set_input_as_handled()
		toggle()
		return
	if visible and event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		close()


func toggle() -> void:
	if visible: close()
	else: open()


func open() -> void:
	_rebuild_slots()
	visible = true
	get_tree().paused = true


func close() -> void:
	visible = false
	get_tree().paused = false


func _rebuild_slots() -> void:
	for child in _slots_vbox.get_children():
		child.queue_free()
	var party: Array = TokiSave.party() if TokiSave else []
	if party.is_empty():
		var empty := Label.new()
		empty.text = "— no creatures yet —"
		_slots_vbox.add_child(empty)
		_hint.text = "catch one to fill a slot"
		return
	for i in party.size():
		var member: Dictionary = party[i]
		var btn := Button.new()
		btn.text = _slot_label(member, i)
		btn.pressed.connect(_on_slot_pressed.bind(i))
		_slots_vbox.add_child(btn)
	_hint.text = "P: close   ↑↓: select"


func _slot_label(m: Dictionary, idx: int) -> String:
	var species: String = String(m.get("species_id", "?"))
	var level: int = int(m.get("level", 1))
	var hp: int = int(m.get("hp", 0))
	var max_hp: int = int(m.get("max_hp", 1))
	var marker := "▶ " if idx == 0 else "  "
	return "%s%s  L%d  %d/%d" % [marker, species, level, hp, max_hp]


func _on_slot_pressed(idx: int) -> void:
	_selected_index = idx
	_show_detail(idx)


func _show_detail(idx: int) -> void:
	var party: Array = TokiSave.party() if TokiSave else []
	if idx < 0 or idx >= party.size(): return
	var member: Dictionary = party[idx]
	var species_id := String(member.get("species_id", ""))
	var level: int = int(member.get("level", 1))
	var hp: int = int(member.get("hp", 0))
	var max_hp: int = int(member.get("max_hp", 1))
	_detail_title.text = "%s (L%d)" % [species_id, level]
	_detail_hp.text = "HP: %d / %d" % [hp, max_hp]
	# XP progress: cube curve per TokiSave
	var cur_xp: int = int(member.get("xp", 0))
	var next_floor: int = (level + 1) ** 3
	_detail_xp.text = "XP: %d / %d" % [cur_xp, next_floor]
	# Moves
	for child in _detail_moves.get_children():
		child.queue_free()
	var moves: Array = member.get("moves", []) if member.get("moves") is Array else []
	for move_id in moves:
		var m := Label.new()
		m.text = "• %s" % String(move_id)
		_detail_moves.add_child(m)
	# Kili availability
	var inv: Dictionary = TokiSave.inventory() if TokiSave else {}
	var kili_count: int = int(inv.get(HEAL_ITEM_ID, 0))
	_use_kili_btn.disabled = (kili_count <= 0) or (hp >= max_hp)
	_use_kili_btn.text = "Use kili (+%d HP) × %d" % [HEAL_AMOUNT, kili_count]
	_detail_panel.visible = true


func _on_use_kili() -> void:
	if TokiSave == null or _selected_index < 0: return
	var party: Array = TokiSave.party()
	if _selected_index >= party.size(): return
	var member: Dictionary = party[_selected_index]
	var hp: int = int(member.get("hp", 0))
	var max_hp: int = int(member.get("max_hp", 1))
	var inv: Dictionary = TokiSave.inventory()
	var kili_count: int = int(inv.get(HEAL_ITEM_ID, 0))
	if kili_count <= 0 or hp >= max_hp: return
	# Heal + decrement. Write back both subtrees via TokiSave's setters.
	var new_hp: int = min(max_hp, hp + HEAL_AMOUNT)
	member["hp"] = new_hp
	party[_selected_index] = member
	TokiSave._set_array("party", party)
	TokiSave.party_changed.emit()
	inv[HEAL_ITEM_ID] = kili_count - 1
	TokiSave._set_dict("inventory", inv)
	TokiSave.inventory_changed.emit()
	TokiSave.save()
	_rebuild_slots()
	_show_detail(_selected_index)
