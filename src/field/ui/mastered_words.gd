class_name MasteredWords
extends CanvasLayer

# Shows the scrollable list of TP phrases the player has seen in
# dialog. Each entry: tp phrase + first-heard region. Reached from
# PauseMenu (US-042).

@onready var _list: VBoxContainer = $Root/Margin/Panel/V/Scroll/List
@onready var _counter: Label = $Root/Margin/Panel/V/Counter
@onready var _close_btn: Button = $Root/Margin/Panel/V/Close


func _ready() -> void:
	visible = false
	process_mode = Node.PROCESS_MODE_ALWAYS
	_close_btn.pressed.connect(close)


func _unhandled_input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		close()


func open() -> void:
	_rebuild()
	visible = true
	get_tree().paused = true
	_close_btn.grab_focus()


func close() -> void:
	visible = false
	get_tree().paused = false


func _rebuild() -> void:
	for child in _list.get_children():
		child.queue_free()
	var words: Array = TokiSave.mastered_words() if TokiSave else []
	_counter.text = "%d phrases heard" % words.size()
	if words.is_empty():
		var empty := Label.new()
		empty.text = "— talk to villagers to fill this list —"
		_list.add_child(empty)
		return
	for w in words:
		if not (w is Dictionary): continue
		var entry: Dictionary = w
		var row := VBoxContainer.new()
		row.custom_minimum_size.y = 36
		var tp_l := Label.new()
		tp_l.theme_type_variation = &"display"
		tp_l.text = String(entry.get("tp", ""))
		row.add_child(tp_l)
		var meta := Label.new()
		meta.theme_type_variation = &"mono"
		meta.text = "first heard in %s" % String(entry.get("region", "?"))
		row.add_child(meta)
		_list.add_child(row)
		_list.add_child(HSeparator.new())
