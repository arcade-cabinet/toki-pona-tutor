extends Control

# Rolling credits screen, shown on game-clear. 25-second auto-scroll
# followed by a fade back to the title. Reads CREDITS.md from the repo
# root so writers can maintain it in one place. Fallback text embedded
# in case the .md isn't packaged (web export filtering etc).
#
# Trigger: after the final jan-lawa victory, combat.gd routes into
# this scene via change_scene_to_file("res://src/title/credits.tscn").

const ROLL_DURATION := 25.0
const TITLE_SCENE := "res://src/title.tscn"
const CREDITS_PATH := "res://CREDITS.md"

@onready var _body: Label = $Root/Margin/Body
@onready var _skip_hint: Label = $Root/SkipHint


func _ready() -> void:
	_body.text = _load_credits_text()
	# Scroll body up from off-screen bottom to off-screen top.
	var start_y: float = get_viewport_rect().size.y + 40
	var end_y: float = -_body.size.y - 40
	_body.position.y = start_y
	var tween := create_tween()
	tween.tween_property(_body, "position:y", end_y, ROLL_DURATION) \
		.set_trans(Tween.TRANS_LINEAR)
	tween.tween_callback(_return_to_title)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact") or event.is_action_pressed("ui_accept") \
			or event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_return_to_title()


func _return_to_title() -> void:
	get_tree().change_scene_to_file(TITLE_SCENE)


func _load_credits_text() -> String:
	if FileAccess.file_exists(CREDITS_PATH):
		var f := FileAccess.open(CREDITS_PATH, FileAccess.READ)
		if f != null:
			var txt := f.get_as_text()
			f.close()
			return txt
	# Fallback — never empty, even if CREDITS.md gets stripped by export.
	return "poki soweli\n\n\ntoki pona corpus: Tatoeba contributors\nmusic: Zane Little Music (CC0)\nsfx: Kenney Impact Sounds (CC0)\n\n\npona!"
