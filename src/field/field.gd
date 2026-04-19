extends Node2D

## The cutscene that will play on starting a new game.
@export var opening_cutscene: Cutscene

## A PlayerController that will be dynamically assigned to whichever Gamepiece the player currently
## controls.
@export var player_controller: PackedScene

## The first gamepiece that the player will control. This may be null and assigned via an
## introductory cutscene instead.
@export var player_default_gamepiece: Gamepiece


func _ready() -> void:
	randomize()
	
	# Assign proper controllers to player gamepieces whenever they change.
	Player.gamepiece_changed.connect(
		func _on_player_gp_changed() -> void:
			var new_gp: = Player.gamepiece
			Camera.gamepiece = new_gp
	
			# Free up any lingering controller(s).
			for controller in get_tree().get_nodes_in_group(PlayerController.GROUP):
				controller.queue_free()
			
			if new_gp:
				var new_controller = player_controller.instantiate()
				assert(new_controller is PlayerController, "The Field game state requires a valid
					 PlayerController set in the editor!")
				
				new_gp.add_child(new_controller)
				new_controller.is_active = true
	)
	
	Player.gamepiece = player_default_gamepiece
	
	# The field state must pause/unpause with combat accordingly. Input is paused via the
	# FieldEvents bus so PlayerController and FieldCursor disable themselves for the duration of the
	# battle; the player's Gamepiece stays parked on its pre-combat cell, and combat_finished
	# simply reveals the field and re-enables input — no scene reload, no teleport.
	CombatEvents.combat_initiated.connect(func() -> void:
		FieldEvents.input_paused.emit(true)
		hide()
	)
	CombatEvents.combat_finished.connect(func(_is_victory: bool) -> void:
		show()
		FieldEvents.input_paused.emit(false)
	)
	
	Camera.scale = scale
	Camera.make_current()
	Camera.reset_position()
	
	if opening_cutscene:
		opening_cutscene.run.call_deferred()
