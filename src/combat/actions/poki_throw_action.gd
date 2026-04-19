# Toki Town catch mechanic. Throws a poki (net) at the target wild
# creature. Success = (1 - hp_ratio)^2 * catch_rate * poki_power + 0.15,
# clamped to 0.95. On success, the wild creature is added to the
# player's party via TokiSave and combat ends in victory for the player.
#
# Field-facing: instantiated by the UI when the player picks the
# "poki" action; added to the player's battler actions list if they
# have any poki items in inventory.
class_name PokiThrowAction extends BattlerAction

## Species id of the wild target — the combat arena builder sets it
## when constructing the action for the encounter.
var wild_species_id: String = ""

## Level at which to add the caught creature to the party.
var wild_level: int = 1

## Base success multiplier from the thrown poki (1.0 standard, 1.5
## reinforced, 0.5 flimsy). Set by the UI when the player selects
## which poki to throw.
var poki_power: float = 1.0


func _init() -> void:
	name = "poki"
	description = "Throw a net. Weaker creatures are caught more easily."
	target_scope = BattlerAction.TargetScope.SINGLE
	targets_enemies = true
	targets_friendlies = false
	energy_cost = 0


func execute() -> void:
	if cached_targets.is_empty():
		return
	var target: Battler = cached_targets[0]
	var stats: BattlerStats = target.stats
	var hp_ratio: float = float(stats.health) / max(1, stats.max_health)
	# Lookup the wild species. If not pre-set, try to guess from target
	# node name (naming convention Wild_<species_id>).
	var species_id := wild_species_id
	if species_id == "":
		species_id = String(target.name).trim_prefix("Wild_")
	var species: SpeciesResource = _find_species(species_id)
	var catch_rate: float = species.catch_rate if species != null else 0.25
	var success_chance: float = pow(1.0 - hp_ratio, 2) * catch_rate * poki_power + 0.15
	success_chance = clamp(success_chance, 0.0, 0.95)
	# Use the global RNG (seeded once at startup) for consistency with
	# other combat rolls.
	var caught := randf() < success_chance

	# Throw animation: source arcs toward target over ~0.45s, target
	# flashes on impact, brief settle before result is published.
	_play_throw_arc(target)
	await source.get_tree().create_timer(0.45).timeout
	if target.has_method("flash"):
		target.flash()
	await source.get_tree().create_timer(0.2).timeout

	if caught:
		# Add to party (defer so the combat flow finishes cleanly first).
		var save_node: Node = Engine.get_main_loop().root.get_node_or_null("TokiSave")
		if save_node != null and save_node.has_method("add_to_party"):
			save_node.add_to_party(species_id, max(1, wild_level))
		# End the target — mechanically equivalent to a KO for combat loop.
		target.stats.health = 0
	# Result → combat.gd drives the catch-result panel via CombatEvents.
	if CombatEvents and CombatEvents.has_signal("poki_thrown"):
		CombatEvents.emit_signal("poki_thrown", species_id, caught, success_chance)


func _play_throw_arc(target: Battler) -> void:
	# Best-effort arc — if source has no visible sprite/pivot, skip silently.
	var pivot := source.get_node_or_null("BattlerAnim/Pivot") as Node2D
	if pivot == null:
		return
	var start := pivot.global_position
	var end := target.global_position if target is Node2D else start
	var apex := (start + end) * 0.5 + Vector2(0, -40)
	var tween := source.create_tween()
	tween.tween_property(pivot, "global_position", apex, 0.22).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_property(pivot, "global_position", end, 0.22).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	tween.tween_property(pivot, "global_position", start, 0.0)


func _find_species(id: String) -> SpeciesResource:
	if id == "": return null
	var world_autoload: Node = Engine.get_main_loop().root.get_node_or_null("World")
	if world_autoload != null and world_autoload.has_method("find_species"):
		return world_autoload.find_species(id)
	return null
