class_name DialogOverlay
extends CanvasLayer

# Lightweight toki-town dialog UI. Listens for FieldEvents.dialog_requested
# and presents multi-beat dialog via a parchment panel at the bottom of
# the viewport. Advances on "interact" (Space/Enter/E). Emits triggers
# on close (set_flag / give_item / add_party / advance_quest) through
# FieldEvents so game systems can respond.
#
# When the dialog node has a non-empty `choices` array, after the last
# beat the overlay shows lettered options (A/B/C) and fires the picked
# choice's triggers in addition to the dialog-level triggers.
#
# Uses the project theme's `dialog` type for panel styling and
# `sitelen_pona` for the glyph card. No Dialogic dependency.

const TYPEWRITER_CPS_DEFAULT := 40.0  # characters per second fallback


# US-035 text-speed setting. Read from SettingsStore.text_speed when
# present; falls back to the compile-time default in tools/tests where
# the node isn't attached to a SceneTree yet.
func _cps() -> float:
	var tree: SceneTree = get_tree()
	if tree == null:
		return TYPEWRITER_CPS_DEFAULT
	var store: Node = tree.root.get_node_or_null("SettingsStore")
	if store != null and "text_speed" in store:
		return float(store.text_speed)
	return TYPEWRITER_CPS_DEFAULT
const CHOICE_LETTERS := ["A", "B", "C", "D", "E"]

@onready var _panel: PanelContainer = $Root/Margin/Panel
@onready var _speaker_label: Label = $Root/Margin/Panel/VBox/Speaker
@onready var _body_label: RichTextLabel = $Root/Margin/Panel/VBox/Body
@onready var _glyph_label: Label = $Root/Margin/Panel/VBox/Speaker/Glyph
@onready var _advance_hint: Label = $Root/Margin/Panel/VBox/Hint
@onready var _choices_box: VBoxContainer = $Root/Margin/Panel/VBox/Choices
@onready var _typewriter: Timer = $Typewriter

var _current: DialogResource = null
var _beat_index: int = 0
var _full_text: String = ""
var _revealed_chars: int = 0
var _open: bool = false
var _awaiting_choice: bool = false
var _selected_choice: int = -1


func _ready() -> void:
	visible = false
	_typewriter.timeout.connect(_on_typewriter_tick)
	if FieldEvents and FieldEvents.has_signal("dialog_requested"):
		FieldEvents.connect("dialog_requested", _on_dialog_requested)


func _on_dialog_requested(node: DialogResource) -> void:
	if _open or node == null or node.beats.is_empty():
		return
	_current = node
	_beat_index = 0
	_awaiting_choice = false
	_selected_choice = -1
	_clear_choices()
	_show_beat()
	visible = true
	_open = true


func _show_beat() -> void:
	var beat: Dictionary = _current.beats[_beat_index]
	var text_dict: Dictionary = beat.get("text", {})
	_full_text = String(text_dict.get("tp", text_dict.get("en", "")))
	_revealed_chars = 0
	_body_label.text = ""
	_typewriter.start(1.0 / _cps())
	# US-042: remember this TP phrase for the Mastered Words screen.
	if TokiSave != null and _full_text != "":
		var region_id := ""
		if TokiSave:
			region_id = TokiSave.current_region_id
		TokiSave.mark_word_heard(_full_text, region_id)

	var glyph: String = beat.get("glyph", "")
	_glyph_label.text = glyph
	_glyph_label.visible = glyph.length() > 0

	# Speaker name — pull from npc_id via World if we have it.
	_speaker_label.text = _speaker_for(_current.npc_id)
	_advance_hint.text = "space"


func _speaker_for(npc_id: String) -> String:
	if npc_id == "": return ""
	# Check if any region has this NPC — quick walk through current region.
	var rb := get_tree().get_first_node_in_group("region_builder") as RegionBuilder
	if rb and rb.region:
		for n: NpcResource in rb.region.npcs:
			if n.id == npc_id:
				return n.name_tp
	return npc_id


func _on_typewriter_tick() -> void:
	_revealed_chars += 1
	if _revealed_chars >= _full_text.length():
		_revealed_chars = _full_text.length()
		_typewriter.stop()
	_body_label.text = _full_text.substr(0, _revealed_chars)


func _unhandled_input(event: InputEvent) -> void:
	if not _open: return

	if _awaiting_choice:
		_handle_choice_input(event)
		return

	if not (event.is_action_pressed("interact") or event.is_action_pressed("ui_accept")):
		return
	get_viewport().set_input_as_handled()

	# If typewriter is still revealing, complete it immediately.
	if _typewriter.is_stopped() == false:
		_typewriter.stop()
		_revealed_chars = _full_text.length()
		_body_label.text = _full_text
		return

	# Advance to next beat, then either show choices or close.
	_beat_index += 1
	if _beat_index >= _current.beats.size():
		if _current.choices != null and not _current.choices.is_empty():
			_show_choices()
		else:
			_close()
	else:
		_show_beat()


func _show_choices() -> void:
	_awaiting_choice = true
	_clear_choices()
	_choices_box.visible = true
	var count: int = min(_current.choices.size(), CHOICE_LETTERS.size())
	for i in count:
		var choice: Dictionary = _current.choices[i]
		var label_dict: Dictionary = choice.get("label", {})
		var label_text: String = String(label_dict.get("tp", label_dict.get("en", "")))
		var glyph: String = String(choice.get("glyph", ""))
		var row := Label.new()
		var glyph_prefix := ("%s  " % glyph) if glyph != "" else ""
		row.text = "[%s]  %s%s" % [CHOICE_LETTERS[i], glyph_prefix, label_text]
		_choices_box.add_child(row)
	# Hint mirrors the letters actually rendered, so players see D/E when present.
	var used: Array = []
	for i in count:
		used.append(CHOICE_LETTERS[i])
	_advance_hint.text = " / ".join(used)


func _clear_choices() -> void:
	_choices_box.visible = false
	for child in _choices_box.get_children():
		child.queue_free()


func _handle_choice_input(event: InputEvent) -> void:
	if not event is InputEventKey: return
	var key_event: InputEventKey = event
	if not key_event.pressed or key_event.echo: return
	var idx := _index_for_key(key_event.keycode)
	if idx < 0 or idx >= _current.choices.size(): return
	get_viewport().set_input_as_handled()
	_selected_choice = idx
	_close()


func _index_for_key(keycode: int) -> int:
	match keycode:
		KEY_A, KEY_1, KEY_KP_1: return 0
		KEY_B, KEY_2, KEY_KP_2: return 1
		KEY_C, KEY_3, KEY_KP_3: return 2
		KEY_D, KEY_4, KEY_KP_4: return 3
		KEY_E, KEY_5, KEY_KP_5: return 4
		_: return -1


func _close() -> void:
	_open = false
	_awaiting_choice = false
	visible = false
	_clear_choices()
	# Snapshot & null `_current` before firing triggers, so a trigger
	# handler that reopens a new dialog doesn't get clobbered when we
	# return from _fire_triggers.
	var to_fire: DialogResource = _current
	_current = null
	_fire_triggers(to_fire)


func _fire_triggers(node: DialogResource) -> void:
	if node == null: return
	# Dialog-level triggers fire unconditionally on close.
	for flag in node.trigger_set_flags:
		Engine.set_meta("flag_" + flag, bool(node.trigger_set_flags[flag]))
		if FieldEvents and FieldEvents.has_signal("flag_set"):
			FieldEvents.emit_signal("flag_set", flag, node.trigger_set_flags[flag])

	if node.trigger_give_item_id != "" and FieldEvents and FieldEvents.has_signal("item_given"):
		FieldEvents.emit_signal("item_given", node.trigger_give_item_id, node.trigger_give_item_count)

	if node.trigger_add_party_species != "" and FieldEvents and FieldEvents.has_signal("party_add"):
		FieldEvents.emit_signal("party_add", node.trigger_add_party_species, node.trigger_add_party_level)

	if node.trigger_advance_quest_id != "" and FieldEvents and FieldEvents.has_signal("quest_advanced"):
		FieldEvents.emit_signal("quest_advanced", node.trigger_advance_quest_id, node.trigger_advance_quest_stage)

	# Choice-level triggers fire only for the picked option. Guard against
	# a null/absent choices list so dialogs without branches don't crash.
	if _selected_choice >= 0 and node.choices is Array and _selected_choice < node.choices.size():
		_fire_choice_triggers(node.choices[_selected_choice])


func _fire_choice_triggers(choice: Dictionary) -> void:
	var triggers: Dictionary = choice.get("triggers", {})
	if triggers.is_empty(): return

	var set_flags: Dictionary = triggers.get("set_flag", {})
	for flag in set_flags:
		Engine.set_meta("flag_" + flag, bool(set_flags[flag]))
		if FieldEvents and FieldEvents.has_signal("flag_set"):
			FieldEvents.emit_signal("flag_set", flag, set_flags[flag])

	var gi: Dictionary = triggers.get("give_item", {})
	var gi_id: String = String(gi.get("item_id", ""))
	if gi_id != "" and FieldEvents and FieldEvents.has_signal("item_given"):
		FieldEvents.emit_signal("item_given", gi_id, int(gi.get("count", 0)))

	var ap: Dictionary = triggers.get("add_party", {})
	var ap_id: String = String(ap.get("species_id", ""))
	if ap_id != "" and FieldEvents and FieldEvents.has_signal("party_add"):
		FieldEvents.emit_signal("party_add", ap_id, int(ap.get("level", 0)))

	var adv: Dictionary = triggers.get("advance_quest", {})
	var adv_id: String = String(adv.get("quest_id", ""))
	if adv_id != "" and FieldEvents and FieldEvents.has_signal("quest_advanced"):
		FieldEvents.emit_signal("quest_advanced", adv_id, String(adv.get("stage", "")))
