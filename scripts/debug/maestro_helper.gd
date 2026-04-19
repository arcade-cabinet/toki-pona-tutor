extends CanvasLayer
## Debug-only automation surface for Maestro flows.
##
## Mirrors the pattern proven in ../ashworth-manor: a CanvasLayer with
## REAL visible buttons that Maestro taps by text. Maestro on Android
## does not see Godot canvas Label nodes through the Android accessibility
## tree, so the helper must render tappable UI at full opacity and rely
## on Maestro's OCR / text-match path.
##
## Activation: spawned manually from TitleScreen (or any early scene) when
## --maestro-helper is on the cmdline. Not an autoload — keeping it out of
## the autoload list avoids the "class_name hides autoload" collision and
## lets release builds skip the script entirely.

const REFRESH_INTERVAL := 0.2
const PANEL_MARGIN := 18
const PANEL_WIDTH := 280
const BUTTON_HEIGHT := 48
const HEADING_HEIGHT := 36
const STATUS_HEIGHT := 24

const HEADING_TEXT := "Maestro Helper"

var _panel: PanelContainer = null
var _content: VBoxContainer = null
var _refresh_accum: float = 0.0


func _ready() -> void:
	layer = 64
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = true
	_build_panel()
	print("MaestroHelper active")


func _process(delta: float) -> void:
	_refresh_accum += delta
	if _refresh_accum < REFRESH_INTERVAL:
		return
	_refresh_accum = 0.0
	_refresh_controls()


# --- panel ---

func _build_panel() -> void:
	_panel = PanelContainer.new()
	_panel.name = "MaestroPanel"
	_panel.anchor_left = 0.0
	_panel.anchor_top = 0.0
	_panel.anchor_right = 0.0
	_panel.anchor_bottom = 1.0
	_panel.offset_left = float(PANEL_MARGIN)
	_panel.offset_top = float(PANEL_MARGIN)
	_panel.offset_right = float(PANEL_MARGIN + PANEL_WIDTH)
	_panel.offset_bottom = -float(PANEL_MARGIN)
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_panel.z_index = 100
	_panel.self_modulate = Color(0.08, 0.06, 0.05, 0.92)
	add_child(_panel)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 12)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_right", 12)
	margin.add_theme_constant_override("margin_bottom", 12)
	_panel.add_child(margin)

	_content = VBoxContainer.new()
	_content.add_theme_constant_override("separation", 8)
	margin.add_child(_content)


func _refresh_controls() -> void:
	for child in _content.get_children():
		child.queue_free()
	_add_heading(HEADING_TEXT)
	_add_status_line("Scene", _current_scene_name())
	_add_status_line("Room", _current_room_name())


# --- content helpers ---

func _add_heading(text: String) -> void:
	var label := Label.new()
	label.text = text
	label.custom_minimum_size = Vector2(0.0, HEADING_HEIGHT)
	label.add_theme_font_size_override("font_size", 22)
	label.add_theme_color_override("font_color", Color(0.97, 0.94, 0.82, 0.98))
	label.add_theme_color_override("font_outline_color", Color(0.05, 0.03, 0.02, 0.98))
	label.add_theme_constant_override("outline_size", 3)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	_content.add_child(label)


func _add_status_line(label_text: String, value: String) -> void:
	var label := Label.new()
	label.text = "%s: %s" % [label_text, value]
	label.custom_minimum_size = Vector2(0.0, STATUS_HEIGHT)
	label.add_theme_font_size_override("font_size", 16)
	label.add_theme_color_override("font_color", Color(0.9, 0.9, 0.85, 0.95))
	label.add_theme_color_override("font_outline_color", Color(0.05, 0.03, 0.02, 0.98))
	label.add_theme_constant_override("outline_size", 2)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_content.add_child(label)


# --- state probes ---

func _current_scene_name() -> String:
	var tree := get_tree()
	if tree == null or tree.current_scene == null:
		return "<none>"
	return String(tree.current_scene.name)


func _current_room_name() -> String:
	var tree := get_tree()
	if tree == null or tree.root == null:
		return "<none>"
	var overworld := _find_node_by_name(tree.root, "Overworld")
	if overworld == null:
		return "<none>"
	if overworld.has_method("get_current_room_name"):
		return str(overworld.call("get_current_room_name"))
	return "<none>"


func _find_node_by_name(root: Node, target: String) -> Node:
	var stack: Array[Node] = [root]
	while not stack.is_empty():
		var node: Node = stack.pop_back()
		if node.name == target:
			return node
		stack.append_array(node.get_children())
	return null
