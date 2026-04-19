# Flee action for wild battles. On execute, rolls BASE_SUCCESS_RATE; on
# success, sets `fled` on the source battler's combat (discovered via the
# roster) so combat.gd can short-circuit the round into a clean escape
# (emits combat_fled then combat_finished(false); no heal, no warp).
# On failure, the turn ends normally and enemies get to act.
class_name FleeAction extends BattlerAction

const BASE_SUCCESS_RATE: float = 0.75

## Set to true by execute() when the flee roll succeeds. Combat.gd reads
## this off the player battler's cached_action just after act() completes.
var fled: bool = false


func _init() -> void:
	name = "flee"
	description = "Run away from a wild battle. Not always successful."
	target_scope = BattlerAction.TargetScope.SELF
	targets_enemies = false
	targets_friendlies = false
	energy_cost = 0


func execute() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	fled = rng.randf() < BASE_SUCCESS_RATE
	if fled:
		print("[Flee] success")
		# Signal the active Combat instance via Engine meta. Combat.gd reads
		# this in _play_next_action and short-circuits into the flee-end path.
		Engine.set_meta("combat_flee_requested", true)
	else:
		print("[Flee] failed")
	# Brief beat so the UI can reflect the action before the turn ends.
	await source.get_tree().create_timer(0.2).timeout
