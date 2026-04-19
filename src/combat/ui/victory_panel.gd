class_name VictoryPanel
extends CanvasLayer

# End-of-battle victory sequence. Shows a series of short messages
# (e.g. "+24 xp", "L5 → L6", "new move: utala suli") one at a time.
# The caller waits on the `finished` signal, which fires after the
# player has advanced through every entry. Replaces the previous
# Dialogic-based victory timeline.
#
# Entries are plain strings; each is revealed with the same typewriter
# feel the field dialog uses. Space/Enter/E advances. An empty or null
# entry list completes immediately.

signal finished

const TYPEWRITER_CPS := 40.0

@onready var _body: RichTextLabel = $Root/Margin/Panel/VBox/Body
@onready var _hint: Label = $Root/Margin/Panel/VBox/Hint
@onready var _typewriter: Timer = $Typewriter

var _entries: Array = []
var _index: int = 0
var _full_text: String = ""
var _revealed: int = 0
var _open: bool = false


func _ready() -> void:
	visible = false
	_typewriter.timeout.connect(_on_tick)


func show_sequence(entries: Array) -> void:
	_entries = entries if entries != null else []
	_index = 0
	if _entries.is_empty():
		finished.emit()
		return
	visible = true
	_open = true
	_show_entry()


func _show_entry() -> void:
	_full_text = String(_entries[_index])
	_revealed = 0
	_body.text = ""
	_hint.text = "space"
	_typewriter.start(1.0 / TYPEWRITER_CPS)


func _on_tick() -> void:
	_revealed += 1
	if _revealed >= _full_text.length():
		_revealed = _full_text.length()
		_typewriter.stop()
	_body.text = _full_text.substr(0, _revealed)


func _unhandled_input(event: InputEvent) -> void:
	if not _open: return
	if not (event.is_action_pressed("interact") or event.is_action_pressed("ui_accept")):
		return
	get_viewport().set_input_as_handled()

	# Complete typewriter on first press if still revealing.
	if not _typewriter.is_stopped():
		_typewriter.stop()
		_revealed = _full_text.length()
		_body.text = _full_text
		return

	_index += 1
	if _index >= _entries.size():
		_open = false
		visible = false
		finished.emit()
		return
	_show_entry()
