class_name NpcInteraction
extends Area2D

# Attached to each NPC node by RegionBuilder. Detects player proximity
# (via InteractionSearcher's collision mask — layer 16) and fires a
# signal when the player presses their interact action.
#
# The DialogOverlay (or region-level dialog controller) listens for
# `interaction_requested` and selects the right dialog node for this
# NPC based on current quest/flag state.

signal interaction_requested(npc_id: String)

@export var npc_id: String = ""

var _player_near: bool = false


func _ready() -> void:
	# Collision — InteractionSearcher on the player is mask=16, layer=8.
	# So our NPC Area2D sits on layer 16 (so InteractionSearcher detects us)
	# and masks nothing (we don't need to detect anything ourselves).
	collision_layer = 16
	collision_mask = 0

	# A modest pickup radius for the interaction area.
	var shape := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 8.0
	shape.shape = circle
	add_child(shape)

	area_entered.connect(_on_area_entered)
	area_exited.connect(_on_area_exited)


func _on_area_entered(area: Area2D) -> void:
	# Tell FieldEvents an interactable is in range — lets a HUD show the
	# "[E] Talk" prompt if desired.
	_player_near = true
	if FieldEvents and FieldEvents.has_signal("interaction_range_entered"):
		FieldEvents.emit_signal("interaction_range_entered", npc_id)


func _on_area_exited(area: Area2D) -> void:
	_player_near = false
	if FieldEvents and FieldEvents.has_signal("interaction_range_exited"):
		FieldEvents.emit_signal("interaction_range_exited", npc_id)


func _unhandled_input(event: InputEvent) -> void:
	if not _player_near: return
	if event.is_action_pressed("interact") or event.is_action_pressed("ui_accept"):
		interaction_requested.emit(npc_id)
		get_viewport().set_input_as_handled()
