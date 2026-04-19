extends Node

# Toki Town save state. Thin typed wrapper over the SaveSystem addon.
# Stores:
#   flags: Dictionary[String, bool] — dialog-set flags (starter_chosen, badge_*)
#   quests: Dictionary[String, String] — questId → current stage
#   current_region_id: String — where the player is
#   player_tile: Vector2i — last known cell (for resume)
#   party: Array[Dictionary] — creature instances {instance_id, species_id, level, xp, hp, max_hp, moves, pp}
#   bestiary: Dictionary[String, Dictionary] — speciesId → {seen, caught, first_encountered_at}
#   inventory: Dictionary[String, int] — itemId → count
#   mastered_words: Array[String]
#   badges: Array[String]
#
# Listens for FieldEvents triggers (flag_set, item_given, party_add,
# quest_advanced) so dialog-driven game state automatically persists.

signal flags_changed
signal party_changed
signal inventory_changed
signal region_changed(id: String)

const KEY := "toki"


func _ready() -> void:
	# Connect to FieldEvents trigger stream.
	if FieldEvents:
		FieldEvents.flag_set.connect(_on_flag_set)
		FieldEvents.item_given.connect(_on_item_given)
		FieldEvents.party_add.connect(_on_party_add)
		FieldEvents.quest_advanced.connect(_on_quest_advanced)


# --- Flags ---

func get_flag(flag: String) -> bool:
	var flags: Dictionary = _get_dict("flags")
	return bool(flags.get(flag, false))


func set_flag(flag: String, value: bool) -> void:
	var flags: Dictionary = _get_dict("flags")
	if flags.get(flag, false) == value: return
	flags[flag] = value
	_set_dict("flags", flags)
	flags_changed.emit()


# --- Quests ---

func get_quest_stage(quest_id: String) -> String:
	var quests: Dictionary = _get_dict("quests")
	return String(quests.get(quest_id, ""))


func advance_quest(quest_id: String, stage: String) -> void:
	var quests: Dictionary = _get_dict("quests")
	quests[quest_id] = stage
	_set_dict("quests", quests)


# --- Party ---

func party() -> Array:
	return _get_array("party")


func add_to_party(species_id: String, level: int) -> bool:
	var current: Array = party()
	if current.size() >= 6: return false
	var species: SpeciesResource = _find_species(species_id)
	if species == null: return false
	var member: Dictionary = {
		"instance_id": "%s-%d-%d" % [species_id, Time.get_ticks_msec(), randi() % 100000],
		"species_id": species_id,
		"level": level,
		"xp": _xp_to_reach_level(level),
		"hp": species.hp + (level - 1) * 4,
		"max_hp": species.hp + (level - 1) * 4,
		"moves": _learned_moves_for(species, level),
		"pp": _starting_pp_for(species, level),
	}
	current.append(member)
	_set_array("party", current)
	party_changed.emit()
	return true


# XP curve: level^3. Seed xp to the level's floor so the first gain
# raises (never lowers) the level.
static func _xp_to_reach_level(level: int) -> int:
	return int(pow(max(1, level), 3))


static func _learned_moves_for(species: SpeciesResource, level: int) -> Array:
	var learned: Array = []
	for entry in species.learnset:
		if not (entry is Dictionary): continue
		if int(entry.get("level", 1)) > level: continue
		var id: String = String(entry.get("move_id", ""))
		if id != "" and not (id in learned):
			learned.append(id)
	if learned.size() > 4:
		learned = learned.slice(learned.size() - 4, learned.size())
	return learned


static func _starting_pp_for(species: SpeciesResource, level: int) -> Array:
	var pp: Array = []
	for m_id in _learned_moves_for(species, level):
		pp.append(15)
	return pp


# --- Inventory ---

func inventory() -> Dictionary:
	return _get_dict("inventory")


func give_item(item_id: String, count: int = 1) -> void:
	var inv: Dictionary = inventory()
	var now: int = int(inv.get(item_id, 0))
	inv[item_id] = now + max(1, count)
	_set_dict("inventory", inv)
	inventory_changed.emit()


# --- Region / player_tile ---

var current_region_id: String:
	get: return String(SaveSystem.get_var("%s:current_region_id" % KEY)) if SaveSystem else ""
	set(value):
		if SaveSystem:
			SaveSystem.set_var("%s:current_region_id" % KEY, value)
		region_changed.emit(value)


var player_tile: Vector2i:
	get:
		var raw = SaveSystem.get_var("%s:player_tile" % KEY) if SaveSystem else null
		if raw is Vector2i: return raw
		if raw is Dictionary:
			return Vector2i(int(raw.get("x", 0)), int(raw.get("y", 0)))
		return Vector2i.ZERO
	set(value):
		if SaveSystem:
			SaveSystem.set_var("%s:player_tile" % KEY, {"x": value.x, "y": value.y})


# --- Event handlers ---

func _on_flag_set(flag: String, value: bool) -> void:
	set_flag(flag, value)


func _on_item_given(item_id: String, count: int) -> void:
	give_item(item_id, count)


func _on_party_add(species_id: String, level: int) -> void:
	add_to_party(species_id, level)


func _on_quest_advanced(quest_id: String, stage: String) -> void:
	advance_quest(quest_id, stage)


# --- Internals ---

func _get_dict(sub_key: String) -> Dictionary:
	if SaveSystem == null: return {}
	var v = SaveSystem.get_var("%s:%s" % [KEY, sub_key])
	return v if v is Dictionary else {}


func _set_dict(sub_key: String, value: Dictionary) -> void:
	if SaveSystem == null: return
	SaveSystem.set_var("%s:%s" % [KEY, sub_key], value)


func _get_array(sub_key: String) -> Array:
	if SaveSystem == null: return []
	var v = SaveSystem.get_var("%s:%s" % [KEY, sub_key])
	return v if v is Array else []


func _set_array(sub_key: String, value: Array) -> void:
	if SaveSystem == null: return
	SaveSystem.set_var("%s:%s" % [KEY, sub_key], value)


func _find_species(id: String) -> SpeciesResource:
	var world_autoload: Node = get_tree().root.get_node_or_null("World")
	if world_autoload != null and world_autoload.has_method("find_species"):
		return world_autoload.find_species(id)
	return null
