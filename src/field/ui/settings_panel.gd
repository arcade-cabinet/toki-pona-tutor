class_name SettingsPanel
extends CanvasLayer

# Reusable settings overlay — Music / SFX / Text speed sliders that
# mutate SettingsStore. Available from the title screen and from the
# in-game PauseMenu. Pauses the tree while open.

@onready var _music: HSlider = $Root/Margin/Panel/V/MusicRow/Music
@onready var _sfx: HSlider = $Root/Margin/Panel/V/SfxRow/Sfx
@onready var _text: HSlider = $Root/Margin/Panel/V/TextRow/Text
@onready var _music_label: Label = $Root/Margin/Panel/V/MusicRow/Value
@onready var _sfx_label: Label = $Root/Margin/Panel/V/SfxRow/Value
@onready var _text_label: Label = $Root/Margin/Panel/V/TextRow/Value
@onready var _close_btn: Button = $Root/Margin/Panel/V/Close

var _paused_by_us: bool = false


func _ready() -> void:
	visible = false
	process_mode = Node.PROCESS_MODE_ALWAYS
	_close_btn.pressed.connect(close)
	_music.value_changed.connect(_on_music_changed)
	_sfx.value_changed.connect(_on_sfx_changed)
	_text.value_changed.connect(_on_text_changed)


func _unhandled_input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		close()


func open() -> void:
	_sync_from_store()
	visible = true
	if not get_tree().paused:
		get_tree().paused = true
		_paused_by_us = true
	_close_btn.grab_focus()


func close() -> void:
	visible = false
	if _paused_by_us:
		get_tree().paused = false
		_paused_by_us = false


func _sync_from_store() -> void:
	if SettingsStore == null: return
	_music.set_value_no_signal(SettingsStore.music_volume)
	_sfx.set_value_no_signal(SettingsStore.sfx_volume)
	_text.set_value_no_signal(SettingsStore.text_speed)
	_refresh_labels()


func _refresh_labels() -> void:
	_music_label.text = "%d%%" % round(_music.value * 100.0)
	_sfx_label.text = "%d%%" % round(_sfx.value * 100.0)
	_text_label.text = "%d cps" % round(_text.value)


func _on_music_changed(v: float) -> void:
	if SettingsStore != null: SettingsStore.set_music_volume(v)
	_refresh_labels()


func _on_sfx_changed(v: float) -> void:
	if SettingsStore != null: SettingsStore.set_sfx_volume(v)
	_refresh_labels()


func _on_text_changed(v: float) -> void:
	if SettingsStore != null: SettingsStore.set_text_speed(v)
	_refresh_labels()
