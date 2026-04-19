extends Node

# Persistent app-level settings: audio bus volumes, text speed, and
# whatever else the settings menu exposes. Lives in user://settings.cfg
# so values survive across runs independent of the game save.
#
# Autoload name: SettingsStore (see project.godot).

const CFG_PATH := "user://settings.cfg"

signal changed

# Default values are applied before the cfg is loaded. Range 0.0..1.0
# for volumes (0 = silent, 1 = unity); later mapped to dB on the bus.
var music_volume: float = 0.7
var sfx_volume: float = 0.9
var text_speed: float = 40.0  # chars/second — consumed by DialogOverlay


func _ready() -> void:
	load_cfg()
	apply_audio()


func load_cfg() -> void:
	var cfg := ConfigFile.new()
	var err := cfg.load(CFG_PATH)
	if err != OK: return
	music_volume = float(cfg.get_value("audio", "music_volume", music_volume))
	sfx_volume = float(cfg.get_value("audio", "sfx_volume", sfx_volume))
	text_speed = float(cfg.get_value("ui", "text_speed", text_speed))


func save_cfg() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("audio", "music_volume", music_volume)
	cfg.set_value("audio", "sfx_volume", sfx_volume)
	cfg.set_value("ui", "text_speed", text_speed)
	cfg.save(CFG_PATH)


func set_music_volume(v: float) -> void:
	music_volume = clamp(v, 0.0, 1.0)
	apply_audio()
	save_cfg()
	changed.emit()


func set_sfx_volume(v: float) -> void:
	sfx_volume = clamp(v, 0.0, 1.0)
	apply_audio()
	save_cfg()
	changed.emit()


func set_text_speed(cps: float) -> void:
	text_speed = clamp(cps, 5.0, 120.0)
	save_cfg()
	changed.emit()


# Map a 0..1 slider value to a dB offset on the named bus. 0 → -80 dB
# (effectively silent), 1 → 0 dB (unity). Exponential curve feels
# linear to the ear.
func apply_audio() -> void:
	_apply_bus("Music", music_volume)
	_apply_bus("SFX", sfx_volume)


func _apply_bus(bus_name: String, v: float) -> void:
	var idx := AudioServer.get_bus_index(bus_name)
	if idx < 0: return
	if v <= 0.0001:
		AudioServer.set_bus_mute(idx, true)
		return
	AudioServer.set_bus_mute(idx, false)
	AudioServer.set_bus_volume_db(idx, linear_to_db(v))
