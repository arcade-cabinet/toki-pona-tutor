class_name DialogOverlay
extends CanvasLayer

# Lightweight toki-town dialog UI. Listens for FieldEvents.dialog_requested
# and presents multi-beat dialog via a parchment panel at the bottom of
# the viewport. Advances on "interact" (Space/Enter/E). Emits triggers
# on close (set_flag / give_item / add_party / advance_quest) through
# FieldEvents so game systems can respond.
#
# Uses the project theme's `dialog` type for panel styling and
# `sitelen_pona` for the glyph card. No Dialogic dependency.

const TYPEWRITER_CPS := 40.0  # characters per second

@onready var _panel: PanelContainer = $Root/Margin/Panel
@onready var _speaker_label: Label = $Root/Margin/Panel/VBox/Speaker
@onready var _body_label: RichTextLabel = $Root/Margin/Panel/VBox/Body
@onready var _glyph_label: Label = $Root/Margin/Panel/VBox/Speaker/Glyph
@onready var _advance_hint: Label = $Root/Margin/Panel/VBox/Hint
@onready var _typewriter: Timer = $Typewriter

var _current: DialogResource = null
var _beat_index: int = 0
var _full_text: String = ""
var _revealed_chars: int = 0
var _open: bool = false


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
	_show_beat()
	visible = true
	_open = true


func _show_beat() -> void:
	var beat: Dictionary = _current.beats[_beat_index]
	var text_dict: Dictionary = beat.get("text", {})
	_full_text = String(text_dict.get("tp", text_dict.get("en", "")))
	_revealed_chars = 0
	_body_label.text = ""
	_typewriter.start(1.0 / TYPEWRITER_CPS)

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
	if not (event.is_action_pressed("interact") or event.is_action_pressed("ui_accept")):
		return
	get_viewport().set_input_as_handled()

	# If typewriter is still revealing, complete it immediately.
	if _typewriter.is_stopped() == false:
		_typewriter.stop()
		_revealed_chars = _full_text.length()
		_body_label.text = _full_text
		return

	# Advance to next beat, or close if we're out.
	_beat_index += 1
	if _beat_index >= _current.beats.size():
		_close()
	else:
		_show_beat()


func _close() -> void:
	_open = false
	visible = false
	_fire_triggers(_current)
	_current = null


func _fire_triggers(node: DialogResource) -> void:
	if node == null: return
	# Emit trigger events through FieldEvents so separate systems can act.
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
