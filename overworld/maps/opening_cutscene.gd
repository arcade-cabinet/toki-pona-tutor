extends Cutscene

# Opening cutscene. Original template ran a Dialogic timeline; post-
# migration we short-circuit straight to the transition so the scene
# boots cleanly. Re-author as .dialogue + DialogueManager.show_dialogue_balloon
# when writing poki soweli's own opening narration.

@export var timeline: Resource


func _execute() -> void:
	$Background/ColorRect.show()

	await Transition.cover()
	$Background/ColorRect.hide()

	Music.play(load("res://assets/music/Apple Cider.mp3"))
	await Transition.clear(2.0)

	queue_free.call_deferred()
