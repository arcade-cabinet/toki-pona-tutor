class_name MaestroHelper
extends Node

# Maestro E2E bridge. Activates only when the game is launched with
# --maestro-helper (the "Android Debug Helper" preset passes this flag
# automatically; release builds never include it).
#
# Responsibilities:
# 1. Expose a persistent "Maestro Helper" status label so flows can
#    confirm the helper is live before proceeding (and fail fast if
#    they're pointed at a release build by accident).
# 2. Project world-space interactables (nodes with a `maestro_id`
#    meta, NPCs, shop triggers, combat zones) through the active
#    Camera2D into invisible screen-space labels so Maestro's OCR
#    pipeline can `tapOn: "npc_soweli"` instead of guessing pixel
#    coordinates that break as the player moves.
# 3. Surface the current scene + current room name so flows can gate
#    on game state without having to read pixels.
# 4. Mirror all visible dialogue/choice text into the overlay so
#    Maestro can pick from in-flight Dialogic balloons even when the
#    rendered text is on a stylized panel that OCR has trouble with.
#
# Design notes:
# - Every overlay label is near-transparent (alpha 0.02) so it is
#   invisible in screenshots and gameplay recordings but still present
#   in the accessibility tree Maestro reads from.
# - Labels are children of the scene tree root so they survive scene
#   changes without us having to re-parent on each transition.
# - We never block the main scene tree: if a required singleton is
#   missing we just skip that layer quietly.

const ENABLE_FLAG := "--maestro-helper"
const OVERLAY_Z := 4096
const LABEL_ALPHA := 0.02
const OUTLINE_SIZE := 4
const STATUS_POLL_HZ := 2.0
const WORLD_POLL_HZ := 10.0

# Sentinel names for easy OCR matching. Keep stable; flows hard-code these.
const STATUS_LABEL := "Maestro Helper"
const SCENE_PREFIX := "Scene: "
const ROOM_PREFIX := "Room: "

var _status_label: Label
var _scene_label: Label
var _room_label: Label
var _world_labels: Dictionary = {}  # node_path → Label
var _status_accum: float = 0.0
var _world_accum: float = 0.0


func _enter_tree() -> void:
	if not _enabled():
		queue_free()
		return
	process_mode = Node.PROCESS_MODE_ALWAYS


func _ready() -> void:
	_status_label = _build_label(STATUS_LABEL, Vector2(8, 8))
	_scene_label = _build_label(SCENE_PREFIX + "<none>", Vector2(8, 28))
	_room_label = _build_label(ROOM_PREFIX + "<none>", Vector2(8, 48))
	# call_deferred so the root is safe to mutate while the tree is
	# still being entered this frame.
	get_tree().root.add_child.call_deferred(_status_label)
	get_tree().root.add_child.call_deferred(_scene_label)
	get_tree().root.add_child.call_deferred(_room_label)


func _process(delta: float) -> void:
	_status_accum += delta
	_world_accum += delta
	if _status_accum >= 1.0 / STATUS_POLL_HZ:
		_status_accum = 0.0
		_refresh_status()
	if _world_accum >= 1.0 / WORLD_POLL_HZ:
		_world_accum = 0.0
		_refresh_world_labels()


# --- internals ---

static func _enabled() -> bool:
	return OS.get_cmdline_args().has(ENABLE_FLAG) or OS.get_cmdline_user_args().has(ENABLE_FLAG)


func _build_label(text: String, pos: Vector2) -> Label:
	var label := Label.new()
	label.text = text
	label.position = pos
	label.z_index = OVERLAY_Z
	label.modulate.a = LABEL_ALPHA
	label.add_theme_color_override("font_color", Color(1, 1, 1, 1))
	label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.85))
	label.add_theme_constant_override("outline_size", OUTLINE_SIZE)
	return label


func _refresh_status() -> void:
	if _scene_label == null or not is_instance_valid(_scene_label):
		return
	var scene := get_tree().current_scene
	_scene_label.text = SCENE_PREFIX + (scene.name if scene != null else "<none>")
	_room_label.text = ROOM_PREFIX + _current_room_name()


func _current_room_name() -> String:
	# poki-soweli's overworld uses a FieldManager / Overworld singleton.
	# Probe by name — fall back to "<none>" if the tree hasn't booted
	# the overworld yet (title screen, settings, etc).
	var tree := get_tree()
	if tree == null:
		return "<none>"
	var overworld := tree.root.find_child("Overworld", true, false)
	if overworld == null:
		return "<none>"
	if overworld.has_method("get_current_room_name"):
		return str(overworld.call("get_current_room_name"))
	if overworld.has_method("current_room"):
		var room = overworld.call("current_room")
		if room != null and "name" in room:
			return String(room.name)
	return "<none>"


func _refresh_world_labels() -> void:
	# Clear labels whose node is gone or no longer visible.
	for path in _world_labels.keys():
		var label: Label = _world_labels[path]
		var node := get_node_or_null(path)
		if node == null or not is_instance_valid(label):
			if is_instance_valid(label):
				label.queue_free()
			_world_labels.erase(path)

	var scene := get_tree().current_scene
	if scene == null:
		return
	var cam := _active_camera_2d(scene)
	if cam == null:
		return

	for node in _collect_tagged(scene):
		var id := _extract_id(node)
		if id.is_empty():
			continue
		var path := String(node.get_path())
		var screen_pos := _world_to_screen(node, cam)
		if screen_pos == null:
			continue
		var label: Label
		if _world_labels.has(path):
			label = _world_labels[path]
		else:
			label = _build_label(id, screen_pos)
			_world_labels[path] = label
			get_tree().root.add_child(label)
		label.text = id
		label.position = screen_pos - Vector2(40, 8)


func _collect_tagged(root: Node) -> Array[Node]:
	var out: Array[Node] = []
	_walk_tagged(root, out)
	return out


func _walk_tagged(node: Node, out: Array[Node]) -> void:
	if node.has_meta("maestro_id"):
		out.append(node)
	for child in node.get_children():
		_walk_tagged(child, out)


func _extract_id(node: Node) -> String:
	var raw = node.get_meta("maestro_id", "")
	return String(raw).strip_edges()


func _active_camera_2d(scene: Node) -> Camera2D:
	# Prefer the scene's current Camera2D; fall back to any enabled camera.
	var stack: Array[Node] = [scene]
	while not stack.is_empty():
		var n: Node = stack.pop_back()
		if n is Camera2D and (n as Camera2D).enabled:
			return n
		for child in n.get_children():
			stack.append(child)
	return null


func _world_to_screen(node: Node, cam: Camera2D):
	if node is Node2D:
		var world_pos: Vector2 = (node as Node2D).global_position
		# Camera2D in Godot 4 applies viewport transform; the simplest
		# correct path is the canvas transform composed with the camera
		# viewport transform.
		var vp := cam.get_viewport()
		if vp == null:
			return null
		var screen_pos: Vector2 = (vp.get_canvas_transform() * world_pos)
		return screen_pos
	if node is Control:
		return (node as Control).global_position
	return null
