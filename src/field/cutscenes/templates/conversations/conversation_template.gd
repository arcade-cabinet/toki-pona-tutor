@tool

# Template interaction that used to launch a Dialogic timeline. Post-
# Dialogic removal (migrating to nathanhoad/godot-dialogue-manager),
# this becomes a no-op stub. Individual consumers should call
# DialogueManager.show_dialogue_balloon(resource, title) directly once
# their .dtl timelines are re-authored as .dialogue resources.

class_name InteractionTemplateConversation extends Interaction

@export var timeline: Resource


func _execute() -> void:
	# Intentionally empty — no-op until this interaction is ported to
	# a .dialogue resource and invoked via DialogueManager.
	pass
