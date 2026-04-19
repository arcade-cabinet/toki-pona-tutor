class_name BadgesPanel
extends CanvasLayer

# 7-slot badge display, one per gym region. Earned badges render bright;
# unearned render as greyed-out silhouettes. Shown from PauseMenu.
# Badge IDs line up with the jan-lawa per region: telo, pona, wawa, ma,
# lete, suli, sewi (matching the 7 content/spine/regions/*.json gyms).

const BADGE_ORDER := [
	"telo", "pona", "wawa", "ma",
	"lete", "suli", "sewi",
]

@onready var _grid: HBoxContainer = $Root/Margin/Panel/V/Grid
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
	for child in _grid.get_children():
		child.queue_free()
	var earned: Array = TokiSave.badges() if TokiSave else []
	var count := 0
	for id in BADGE_ORDER:
		var has_badge: bool = id in earned
		if has_badge:
			count += 1
		var slot := _build_slot(id, has_badge)
		_grid.add_child(slot)
	_counter.text = "%d / %d badges" % [count, BADGE_ORDER.size()]


func _build_slot(id: String, earned: bool) -> Control:
	var v := VBoxContainer.new()
	v.custom_minimum_size = Vector2(80, 100)
	var coin := ColorRect.new()
	coin.custom_minimum_size = Vector2(56, 56)
	coin.color = Color(0.95, 0.78, 0.28, 1.0) if earned else Color(0.25, 0.25, 0.25, 1.0)
	var center := CenterContainer.new()
	center.add_child(coin)
	v.add_child(center)
	var label := Label.new()
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.text = id if earned else "?"
	v.add_child(label)
	return v
