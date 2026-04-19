@tool

extends Interaction

# Pre/post combat dialog hooks. Original template ran Dialogic timelines
# before + after the fight; post-migration we skip the dialog portion
# and just drive the combat handoff. Re-author pre/victory/loss as
# DialogueManager .dialogue resources when gym flow is polished.

@export var pre_combat_timeline: Resource
@export var victory_timeline: Resource
@export var loss_timeline: Resource

@export var combat_arena: PackedScene


func _execute() -> void:
	# Let other systems know that a combat has been triggered and then
	# wait for its outcome.
	FieldEvents.combat_triggered.emit(combat_arena)

	var did_player_win: bool = await CombatEvents.combat_finished

	# The combat ends with a covered screen, and so we fix that here.
	Transition.clear.call_deferred(0.2)
	await Transition.finished

	# Post-combat dialog is a no-op stub until .dialogue resources exist.
	var _end_res := victory_timeline if did_player_win else loss_timeline
