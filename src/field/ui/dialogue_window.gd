extends Control

# Post-Dialogic stub. Was a DialogicNode_StyleLayer that showed/hid
# itself around timeline_started/ended. After migrating to
# nathanhoad/godot-dialogue-manager, the balloon UI ships with the
# addon (res://addons/dialogue_manager/components/balloon.tscn) so
# this wrapper is no longer load-bearing — hide the node and get out
# of the way.


func _ready() -> void:
	hide()
