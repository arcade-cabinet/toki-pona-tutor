class_name TokiArenaBuilder
extends RefCounted

# Constructs a CombatArena PackedScene dynamically from Toki Town content
# data. Given a wild SpeciesResource + level and the player's lead
# PartyMember equivalent, returns a PackedScene ready to pass to
# Combat.setup() via FieldEvents.combat_triggered.
#
# Not a Node — a one-shot helper. The returned scene is
# inherited from combat_arena.tscn with programmatically-added Battlers.

const BASE_ARENA: PackedScene = preload("res://src/combat/combat_arena.tscn")
const BATTLER_ANIM_SCENE: PackedScene = preload("res://src/combat/battlers/toki_battler_anim.tscn")
const AI_SCENE: PackedScene = preload("res://src/combat/CombatAI.tscn")
const ATTACK_ACTION_SCRIPT := preload("res://src/combat/actions/battler_action_attack.gd")
const POKI_THROW_SCRIPT := preload("res://src/combat/actions/poki_throw_action.gd")

# Battler screen positions — mirroring open-rpg's layout.
# Player on the right (x ~1370), enemy on the left (x ~465).
const PLAYER_POS := Vector2(1370, 738)
const ENEMY_POS := Vector2(465, 722)


# Build a ready-to-instantiate arena. Returns a PackedScene so Combat's
# existing setup(PackedScene) path takes it unchanged.
static func build_arena_for_encounter(
	wild_species: SpeciesResource,
	wild_level: int,
	player_species: SpeciesResource,
	player_level: int
) -> PackedScene:
	var arena_node: Node = _build_arena_node(wild_species, wild_level, player_species, player_level)
	if arena_node == null:
		return null
	# Mark all children as owned by the root so pack() includes them.
	_set_owner_recursive(arena_node, arena_node)
	var packed := PackedScene.new()
	var err: int = packed.pack(arena_node)
	if err != OK:
		push_error("[ArenaBuilder] failed to pack arena: %s" % error_string(err))
		return null
	# The source node is no longer needed.
	arena_node.queue_free()
	return packed


static func _set_owner_recursive(node: Node, owner: Node) -> void:
	for child in node.get_children():
		if child != owner:
			child.owner = owner
			_set_owner_recursive(child, owner)


static func _build_arena_node(
	wild_species: SpeciesResource,
	wild_level: int,
	player_species: SpeciesResource,
	player_level: int
) -> Node:
	if wild_species == null or player_species == null:
		push_error("[ArenaBuilder] missing species resource")
		return null

	var arena: Node = BASE_ARENA.instantiate()
	var battlers_root: Node = arena.get_node("Battlers")

	# Enemy battler (left side, AI-controlled).
	var enemy: Battler = _build_battler(wild_species, wild_level, false)
	enemy.name = "Wild_%s" % wild_species.id
	enemy.position = ENEMY_POS
	battlers_root.add_child(enemy)

	# Player battler (right side, player-controlled). Gets a PokiThrow
	# action pre-wired to the wild species for the catch flow.
	var player: Battler = _build_battler(player_species, player_level, true)
	var poki: PokiThrowAction = POKI_THROW_SCRIPT.new()
	poki.wild_species_id = wild_species.id
	poki.poki_power = 1.0  # standard; UI can tune based on player inventory
	player.actions.append(poki)
	player.name = "Player_%s" % player_species.id
	player.position = PLAYER_POS
	battlers_root.add_child(player)

	return arena


static func _build_battler(sp: SpeciesResource, level: int, is_player: bool) -> Battler:
	var battler := Battler.new()
	battler.stats = _build_stats(sp, level)
	battler.actions = _build_actions_for(sp, level)
	battler.battler_anim_scene = BATTLER_ANIM_SCENE
	battler.is_player = is_player
	if not is_player:
		battler.ai_scene = AI_SCENE
	# Attach script — Battler is a Node2D with a class_name, so new() already
	# sets the script via class_name mechanism.

	# Defer sprite-frame configuration until BattlerAnim exists in-tree.
	# Battler.gd instantiates battler_anim_scene and adds it as a child
	# during its _ready(), so we await that.
	battler.ready.connect(
		func(): _configure_anim.call_deferred(battler, sp.sprite_frame),
		CONNECT_ONE_SHOT,
	)
	return battler


static func _configure_anim(battler: Battler, sprite_frame: int) -> void:
	for child in battler.get_children():
		if child is TokiBattlerAnim:
			(child as TokiBattlerAnim).set_sprite_frame(sprite_frame)
			return


# Build a BattlerStats resource from a SpeciesResource at a given level.
# Simple linear curve: each stat gains +2 per level above 1, HP gains +4.
static func _build_stats(sp: SpeciesResource, level: int) -> BattlerStats:
	var stats: BattlerStats = BattlerStats.new()
	var level_bonus: int = max(0, level - 1)
	stats.base_max_health = sp.hp + level_bonus * 4
	stats.base_attack = sp.attack + level_bonus * 2
	stats.base_defense = sp.defense + level_bonus * 2
	stats.base_speed = sp.speed + level_bonus * 2
	stats.base_max_energy = 6
	stats.affinity = Elements.from_string(sp.type)
	# BattlerStats has a _recalculate pass driven by its setters, plus a
	# post-init `reset()`-ish fill. Ensure runtime vars are seeded.
	stats.max_health = stats.base_max_health
	stats.max_energy = stats.base_max_energy
	stats.attack = stats.base_attack
	stats.defense = stats.base_defense
	stats.speed = stats.base_speed
	stats.health = stats.max_health
	stats.energy = 0
	return stats


# Build the BattlerAction list from the species' learnset, taking up to
# the last 4 moves the creature has learned at `level`. Each move becomes
# an AttackBattlerAction with power / element / name pulled from its
# MoveResource.
#
# Looks up moves via a tree-walked reference to the World autoload. Static
# context can't see the autoload name directly, so we fetch it from the
# main loop / scene tree at call time.
static func _build_actions_for(sp: SpeciesResource, level: int) -> Array[BattlerAction]:
	var actions: Array[BattlerAction] = []
	var learned_ids: Array[String] = []
	for entry in sp.learnset:
		if not (entry is Dictionary): continue
		if int(entry.get("level", 1)) > level: continue
		var id: String = String(entry.get("move_id", ""))
		if id != "" and not (id in learned_ids):
			learned_ids.append(id)
	# Keep the most recent 4.
	if learned_ids.size() > 4:
		learned_ids = learned_ids.slice(learned_ids.size() - 4, learned_ids.size())
	var world_autoload: Node = Engine.get_main_loop().root.get_node_or_null("World")
	for id in learned_ids:
		var move: MoveResource = null
		if world_autoload != null and world_autoload.has_method("find_move"):
			move = world_autoload.find_move(id)
		if move == null: continue
		actions.append(_build_action_from_move(move))
	# Fallback: at least one basic attack so the fight isn't stuck.
	if actions.is_empty():
		actions.append(_basic_attack())
	return actions


static func _build_action_from_move(move: MoveResource) -> BattlerAction:
	var action: BattlerAction = ATTACK_ACTION_SCRIPT.new()
	action.name = move.name_tp if move.name_tp.length() > 0 else move.name_en
	action.description = move.description_en
	action.element = Elements.from_string(move.type)
	action.target_scope = BattlerAction.TargetScope.SINGLE
	action.targets_enemies = true
	action.targets_friendlies = false
	# AttackBattlerAction-specific fields.
	action.base_damage = max(1, int(move.power))
	action.hit_chance = move.accuracy
	action.energy_cost = 0
	return action


static func _basic_attack() -> BattlerAction:
	var action: BattlerAction = ATTACK_ACTION_SCRIPT.new()
	action.name = "utala"
	action.description = "A plain strike."
	action.target_scope = BattlerAction.TargetScope.SINGLE
	action.targets_enemies = true
	action.base_damage = 20
	action.hit_chance = 100
	return action
