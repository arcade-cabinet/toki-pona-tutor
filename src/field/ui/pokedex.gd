class_name Pokedex
extends CanvasLayer

# Species grid showing all 17 creatures. Each tile shows:
#   - Silhouette (modulated) → never seen
#   - Sprite + name_tp → seen but not caught
#   - Sprite + name_tp + ✓ → caught
# Accessed from PauseMenu (US-055). Reads seen/caught flags from
# TokiSave.bestiary, species metadata from the World autoload.

@onready var _root: Control = $Root
@onready var _grid: GridContainer = $Root/Margin/Panel/V/Scroll/Grid
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
	var all_species: Array = []
	if World != null and World.world != null:
		all_species = World.world.species
	if all_species.is_empty():
		_counter.text = "no species loaded"
		return
	var bestiary: Dictionary = TokiSave.bestiary() if TokiSave else {}
	var seen_count := 0
	var caught_count := 0
	for s: SpeciesResource in all_species:
		var entry: Dictionary = bestiary.get(s.id, {})
		var seen: bool = bool(entry.get("seen", false))
		var caught: bool = bool(entry.get("caught", false))
		if seen: seen_count += 1
		if caught: caught_count += 1
		_grid.add_child(_build_tile(s, seen, caught))
	_counter.text = "seen %d  ·  caught %d  ·  total %d" % [
		seen_count, caught_count, all_species.size()
	]


func _build_tile(s: SpeciesResource, seen: bool, caught: bool) -> Control:
	var v := VBoxContainer.new()
	v.custom_minimum_size = Vector2(120, 120)
	var frame := TextureRect.new()
	frame.custom_minimum_size = Vector2(96, 96)
	frame.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	if s.sprite_src != "" and ResourceLoader.exists(s.sprite_src):
		frame.texture = load(s.sprite_src)
	if not seen:
		# Silhouette: full black via modulate.
		frame.modulate = Color(0, 0, 0, 1)
	elif not caught:
		# Faint grayscale to distinguish from full collection.
		frame.modulate = Color(0.6, 0.6, 0.6, 1)
	v.add_child(frame)
	var label := Label.new()
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if not seen:
		label.text = "???"
	else:
		label.text = s.name_tp + ("  ✓" if caught else "")
	v.add_child(label)
	return v
