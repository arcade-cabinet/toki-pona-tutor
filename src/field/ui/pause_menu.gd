class_name PauseMenu
extends CanvasLayer

# Pause overlay accessible via the `pause` input action (Esc by default).
# Offers Resume / Party / Save / Quit-to-title. Uses Godot's tree pause
# while open so field + combat freeze. Survives even when the tree is
# paused because process_mode = PROCESS_MODE_ALWAYS.

const TITLE_SCENE := "res://src/title.tscn"

@onready var _root: Control = $Root
@onready var _resume_btn: Button = $Root/Margin/Panel/V/Resume
@onready var _party_btn: Button = $Root/Margin/Panel/V/Party
@onready var _pokedex_btn: Button = $Root/Margin/Panel/V/Pokedex
@onready var _badges_btn: Button = $Root/Margin/Panel/V/Badges
@onready var _save_btn: Button = $Root/Margin/Panel/V/Save
@onready var _quit_btn: Button = $Root/Margin/Panel/V/Quit


func _ready() -> void:
	visible = false
	process_mode = Node.PROCESS_MODE_ALWAYS
	_resume_btn.pressed.connect(close)
	_party_btn.pressed.connect(_on_party_pressed)
	_pokedex_btn.pressed.connect(_on_pokedex_pressed)
	_badges_btn.pressed.connect(_on_badges_pressed)
	_save_btn.pressed.connect(_on_save_pressed)
	_quit_btn.pressed.connect(_on_quit_pressed)


func _on_pokedex_pressed() -> void:
	close()
	var p := get_tree().root.find_child("Pokedex", true, false)
	if p != null and p.has_method("open"):
		p.call_deferred("open")


func _on_badges_pressed() -> void:
	close()
	var p := get_tree().root.find_child("BadgesPanel", true, false)
	if p != null and p.has_method("open"):
		p.call_deferred("open")


func _unhandled_input(event: InputEvent) -> void:
	if not InputMap.has_action("pause"): return
	if event.is_action_pressed("pause"):
		get_viewport().set_input_as_handled()
		if visible: close()
		else: open()


func open() -> void:
	visible = true
	get_tree().paused = true
	_resume_btn.grab_focus()


func close() -> void:
	visible = false
	get_tree().paused = false


func _on_party_pressed() -> void:
	close()
	var panel := get_tree().root.find_child("PartyPanel", true, false)
	if panel != null and panel.has_method("open"):
		panel.call_deferred("open")


func _on_save_pressed() -> void:
	if TokiSave != null:
		TokiSave.save()
	_save_btn.text = "Saved."
	_save_btn.disabled = true
	await get_tree().create_timer(0.8).timeout
	_save_btn.text = "Save"
	_save_btn.disabled = false


func _on_quit_pressed() -> void:
	# Flush before leaving the field scene.
	if TokiSave != null:
		TokiSave.save()
	get_tree().paused = false
	get_tree().change_scene_to_file(TITLE_SCENE)
