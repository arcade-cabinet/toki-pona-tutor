# Use-kili-in-combat action. Consumes one kili from inventory, restores
# HEAL_AMOUNT HP to the source battler, and costs the turn. US-029 —
# lets the player heal during a fight without opening the party panel.
class_name KiliHealAction extends BattlerAction

const HEAL_ITEM_ID := "kili"
const HEAL_AMOUNT := 20


func _init() -> void:
	name = "kili"
	description = "Bite a kili to restore HP. Costs your turn."
	target_scope = BattlerAction.TargetScope.SELF
	targets_enemies = false
	targets_friendlies = true
	energy_cost = 0


func execute() -> void:
	if TokiSave == null: return
	var inv: Dictionary = TokiSave.inventory()
	var count: int = int(inv.get(HEAL_ITEM_ID, 0))
	if count <= 0:
		# No kili — silently fail (UI should have disabled the button).
		return
	inv[HEAL_ITEM_ID] = count - 1
	TokiSave.set_inventory(inv)
	# Heal the source battler.
	if source != null and source.stats != null:
		var s: BattlerStats = source.stats
		s.health = min(s.max_health, s.health + HEAL_AMOUNT)
	# Brief beat so the UI can reflect the action.
	await source.get_tree().create_timer(0.25).timeout
