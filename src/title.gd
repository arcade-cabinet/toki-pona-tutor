class_name TitleScreen
extends Control

# Title scene entry point. Menu routes to:
#   - o open (Play) → res://src/toki_town_main.tscn
#   - nasin (Settings) → in-scene panel (master volume slider)
#   - o pini (Quit) → SceneTree.quit()

const GAME_SCENE := "res://src/main.tscn"

@onready var _continue_button: Button = $Menu/Continue
@onready var _play_button: Button = $Menu/Primary
@onready var _settings_button: Button = $Menu/Settings
@onready var _quit_button: Button = $Menu/Quit
@onready var _settings_panel: Control = $SettingsPanel
@onready var _settings_back: Button = $SettingsPanel/Margin/Panel/VBox/Back
@onready var _volume_slider: HSlider = $SettingsPanel/Margin/Panel/VBox/VolumeRow/Slider
@onready var _volume_value: Label = $SettingsPanel/Margin/Panel/VBox/VolumeRow/Value


func _ready() -> void:
	_maybe_spawn_maestro_helper()
	_continue_button.pressed.connect(_on_continue_pressed)
	_play_button.pressed.connect(_on_play_pressed)
	_settings_button.pressed.connect(_on_settings_pressed)
	_quit_button.pressed.connect(_on_quit_pressed)
	_settings_back.pressed.connect(_on_settings_back_pressed)

	var master_idx := AudioServer.get_bus_index(&"Master")
	var db := AudioServer.get_bus_volume_db(master_idx) if master_idx >= 0 else 0.0
	_volume_slider.value = db_to_linear(db) * 100.0
	_volume_slider.value_changed.connect(_on_volume_changed)
	_update_volume_label(_volume_slider.value)

	_settings_panel.visible = false
	# Continue only appears when a save exists — otherwise New Game is
	# the only entry point and gets focus.
	var has_save := TokiSave != null and TokiSave.has_save()
	_continue_button.visible = has_save
	if has_save:
		_continue_button.grab_focus()
	else:
		_play_button.grab_focus()


func _on_play_pressed() -> void:
	# US-037: if a save already exists, confirm-wipe before starting fresh.
	if TokiSave != null and TokiSave.has_save():
		_show_new_game_confirm()
		return
	get_tree().change_scene_to_file(GAME_SCENE)


func _show_new_game_confirm() -> void:
	var dialog := ConfirmationDialog.new()
	dialog.title = "Start over?"
	dialog.dialog_text = "A saved game exists. Starting a new game will overwrite it. Continue?"
	dialog.get_ok_button().text = "Start new"
	dialog.get_cancel_button().text = "Keep save"
	add_child(dialog)
	dialog.confirmed.connect(func():
		# Wipe the save file so the next boot doesn't show Continue.
		if FileAccess.file_exists(TokiSave.SAVE_PATH):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(TokiSave.SAVE_PATH))
		get_tree().change_scene_to_file(GAME_SCENE)
	)
	dialog.canceled.connect(func(): dialog.queue_free())
	dialog.popup_centered()


# Boot the field scene pointed at the saved region+tile. Reuses the
# warp-target Engine.meta channel that RegionBuilder already consumes,
# so Continue just looks like an externally-triggered warp to the
# last-known cell. If player_tile was never written (older save), the
# region falls back to region.spawn via RegionBuilder's warp_tile guard.
func _on_continue_pressed() -> void:
	if TokiSave == null or not TokiSave.has_save():
		_on_play_pressed()
		return
	var region_id: String = TokiSave.current_region_id
	if region_id == "":
		_on_play_pressed()
		return
	Engine.set_meta("warp_target_region", region_id)
	var tile := TokiSave.player_tile
	if tile != Vector2i.ZERO:
		Engine.set_meta("warp_target_tile", tile)
	else:
		# Explicitly clear any stale tile meta from a prior Continue in
		# this session so the player doesn't warp to an outdated cell.
		Engine.remove_meta("warp_target_tile")
	get_tree().change_scene_to_file(GAME_SCENE)


func _on_settings_pressed() -> void:
	_settings_panel.visible = true
	_settings_back.grab_focus()


func _on_settings_back_pressed() -> void:
	_settings_panel.visible = false
	_settings_button.grab_focus()


func _on_quit_pressed() -> void:
	get_tree().quit()


func _on_volume_changed(value: float) -> void:
	var master_idx := AudioServer.get_bus_index(&"Master")
	if master_idx < 0:
		return
	var linear: float = clamp(value / 100.0, 0.0, 1.0)
	var db: float = -80.0 if linear <= 0.0 else linear_to_db(linear)
	AudioServer.set_bus_volume_db(master_idx, db)
	_update_volume_label(value)


func _update_volume_label(value: float) -> void:
	_volume_value.text = "%d%%" % int(round(value))


func _unhandled_input(event: InputEvent) -> void:
	if _settings_panel.visible and event.is_action_pressed("back"):
		get_viewport().set_input_as_handled()
		_on_settings_back_pressed()


func _maybe_spawn_maestro_helper() -> void:
	# Gate on --maestro-helper (baked into the Android Debug Helper preset;
	# never present in release builds). Spawn once as a child of the scene
	# tree root so it survives scene changes. Same pattern as
	# ../ashworth-manor/scripts/game_manager.gd::_maybe_enable_maestro_helper.
	if DisplayServer.get_name() == "headless":
		return
	var args := PackedStringArray(OS.get_cmdline_args())
	for user_arg in OS.get_cmdline_user_args():
		if not args.has(user_arg):
			args.append(user_arg)
	if not args.has("--maestro-helper"):
		return
	var tree := get_tree()
	if tree == null or tree.root == null or tree.root.has_node("MaestroHelper"):
		return
	var script := load("res://scripts/debug/maestro_helper.gd")
	if script == null:
		return
	var helper: Node = script.new()
	helper.name = "MaestroHelper"
	tree.root.call_deferred("add_child", helper)
