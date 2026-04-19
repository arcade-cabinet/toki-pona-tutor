extends Node

# Toki Town save state. Thin typed wrapper over the SaveSystem addon.
# Stores:
#   flags: Dictionary[String, bool] — dialog-set flags (starter_chosen, badge_*)
#   quests: Dictionary[String, String] — questId → current stage
#   current_region_id: String — where the player is
#   player_tile: Vector2i — last known cell (for resume)
#   party: Array[Dictionary] — creature instances {instance_id, species_id, level, xp, hp, max_hp, moves, pp}
#   bestiary: Dictionary[String, Dictionary] — speciesId → {seen, caught, first_seen_at, first_caught_at}
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
signal xp_gained(instance_id: String, amount: int)
signal level_up(instance_id: String, new_level: int)

const KEY := "toki"
# Matches SaveSystem.default_file_path so the addon auto-loads our
# state on boot — _load() runs in SaveSystem._ready() against this
# exact path, no manual hydration needed.
const SAVE_PATH := "user://save_data.sav"


func _ready() -> void:
	# Seed the SaveSystem namespace before anything writes. SaveSystem's
	# hierarchical set_var silently no-ops when the key doesn't already
	# exist (addon line 175: `if not has(key_path): return`), so the
	# "toki" subtree has to be pre-populated or nothing ever persists.
	_ensure_namespace()
	# Connect to FieldEvents trigger stream.
	if FieldEvents:
		FieldEvents.flag_set.connect(_on_flag_set)
		FieldEvents.item_given.connect(_on_item_given)
		FieldEvents.party_add.connect(_on_party_add)
		FieldEvents.quest_advanced.connect(_on_quest_advanced)
	# Autosave on every region crossing.
	region_changed.connect(_on_region_changed)
	# Track the player's current tile across every arrival so Continue
	# resumes exactly where the player stopped. RegionBuilder already
	# writes current_region_id on scene load; player_tile rides along
	# through the Gamepiece.arrived signal.
	if Player:
		Player.gamepiece_changed.connect(_on_player_gamepiece_changed)
		_on_player_gamepiece_changed()
	# Save before the app closes so the player never loses progress on
	# quit (window X, cmd-Q, Android back-to-home, etc). process_mode
	# stays Always so this runs even during a paused tree.
	get_tree().set_auto_accept_quit(false)
	process_mode = Node.PROCESS_MODE_ALWAYS


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_APPLICATION_PAUSED:
		save()
		if what == NOTIFICATION_WM_CLOSE_REQUEST:
			get_tree().quit()


# Ensure the "toki" namespace + all known sub-keys exist in
# SaveSystem.current_state_dictionary so hierarchical writes go through.
# Preserves any already-hydrated values from the loaded save file.
func _ensure_namespace() -> void:
	if SaveSystem == null: return
	var root: Dictionary = SaveSystem.current_state_dictionary
	if not root.has(KEY) or not (root[KEY] is Dictionary):
		root[KEY] = {}
	var ns: Dictionary = root[KEY]
	if not ns.has("flags"): ns["flags"] = {}
	if not ns.has("quests"): ns["quests"] = {}
	if not ns.has("inventory"): ns["inventory"] = {}
	if not ns.has("party"): ns["party"] = []
	if not ns.has("bestiary"): ns["bestiary"] = {}
	if not ns.has("badges"): ns["badges"] = []
	if not ns.has("current_region_id"): ns["current_region_id"] = ""
	if not ns.has("player_tile"): ns["player_tile"] = {"x": 0, "y": 0}


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


# Grant XP to the party lead (index 0). Recomputes level by walking the
# cubic curve upward while XP covers the next threshold. On any level
# gain, max_hp is recomputed from the species base and new moves are
# appended (keeping at most 4). Returns the number of levels gained.
func grant_xp_to_lead(amount: int) -> int:
	if amount <= 0: return 0
	var current: Array = party()
	if current.is_empty(): return 0
	var member = current[0]
	if not (member is Dictionary): return 0
	var levels_gained: int = _grant_xp_to_member(member, amount)
	current[0] = member
	_set_array("party", current)
	xp_gained.emit(String(member.get("instance_id", "")), amount)
	if levels_gained > 0:
		level_up.emit(String(member.get("instance_id", "")), int(member.get("level", 1)))
	party_changed.emit()
	return levels_gained


# Fully restore HP and PP for every party member. Used on defeat
# whiteout so the next encounter starts from a clean slate.
func heal_party() -> void:
	var current: Array = party()
	if current.is_empty(): return
	for i in current.size():
		var member = current[i]
		if not (member is Dictionary): continue
		member["hp"] = int(member.get("max_hp", member.get("hp", 1)))
		var moves: Array = member.get("moves", []) if member.get("moves") is Array else []
		var pp: Array = []
		for _m in moves:
			pp.append(15)
		member["pp"] = pp
		current[i] = member
	_set_array("party", current)
	party_changed.emit()


func _grant_xp_to_member(member: Dictionary, amount: int) -> int:
	member["xp"] = int(member.get("xp", 0)) + amount
	var level: int = int(member.get("level", 1))
	var levels_gained: int = 0
	while member["xp"] >= _xp_to_reach_level(level + 1):
		level += 1
		levels_gained += 1
	if levels_gained == 0:
		return 0
	var species: SpeciesResource = _find_species(String(member.get("species_id", "")))
	member["level"] = level
	if species != null:
		var new_max_hp: int = species.hp + (level - 1) * 4
		# Preserve the fraction of HP the creature had before level-up
		# so a heal isn't implied.
		var old_max: int = int(member.get("max_hp", new_max_hp))
		var old_hp: int = int(member.get("hp", old_max))
		var frac: float = float(old_hp) / float(max(1, old_max))
		member["max_hp"] = new_max_hp
		member["hp"] = clamp(int(round(new_max_hp * frac)), 1, new_max_hp)
		var new_moves: Array = _learned_moves_for(species, level)
		var old_moves: Array = member.get("moves", []) if member.get("moves") is Array else []
		# Preserve order of old moves; append any newly-learned moves.
		for m_id in new_moves:
			if not (m_id in old_moves):
				old_moves.append(m_id)
		if old_moves.size() > 4:
			old_moves = old_moves.slice(old_moves.size() - 4, old_moves.size())
		member["moves"] = old_moves
		# Refill PP to 15 per move (keep existing refill convention).
		var pp: Array = []
		for _m in old_moves:
			pp.append(15)
		member["pp"] = pp
	return levels_gained


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


# --- Coins (ma), US-059 ---

func coins() -> int:
	return int(inventory().get("ma", 0))


func give_coins(amount: int) -> void:
	if amount == 0: return
	var inv: Dictionary = inventory()
	inv["ma"] = max(0, int(inv.get("ma", 0)) + amount)
	_set_dict("inventory", inv)
	inventory_changed.emit()


# --- Bestiary, US-056 ---

func bestiary() -> Dictionary:
	return _get_dict("bestiary")


func mark_seen(species_id: String) -> void:
	if species_id == "": return
	var b: Dictionary = bestiary()
	var entry: Dictionary = b.get(species_id, {})
	entry["seen"] = true
	entry["first_seen_at"] = entry.get("first_seen_at", Time.get_datetime_string_from_system())
	b[species_id] = entry
	_set_dict("bestiary", b)


func mark_caught(species_id: String) -> void:
	if species_id == "": return
	var b: Dictionary = bestiary()
	var entry: Dictionary = b.get(species_id, {})
	entry["seen"] = true
	entry["caught"] = true
	entry["first_caught_at"] = entry.get("first_caught_at", Time.get_datetime_string_from_system())
	b[species_id] = entry
	_set_dict("bestiary", b)


# --- Badges, US-052 ---

func badges() -> Array:
	return _get_array("badges")


func award_badge(badge_id: String) -> bool:
	if badge_id == "": return false
	var current: Array = badges()
	if badge_id in current: return false
	current.append(badge_id)
	_set_array("badges", current)
	return true


func has_badge(badge_id: String) -> bool:
	return badge_id in badges()


# --- Party mutations (public API — consumers should NOT touch the
# underlying _set_array/_set_dict helpers directly) ---

## Replace the entire party roster. Emits party_changed + flushes save.
func set_party(new_party: Array) -> void:
	_set_array("party", new_party)
	party_changed.emit()
	save()


## Replace the inventory subtree. Emits inventory_changed + flushes save.
func set_inventory(new_inventory: Dictionary) -> void:
	_set_dict("inventory", new_inventory)
	inventory_changed.emit()
	save()


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


func _on_region_changed(_id: String) -> void:
	save()


var _tracked_gamepiece: Gamepiece = null

func _on_player_gamepiece_changed() -> void:
	if _tracked_gamepiece != null and is_instance_valid(_tracked_gamepiece) \
			and _tracked_gamepiece.arrived.is_connected(_on_player_arrived):
		_tracked_gamepiece.arrived.disconnect(_on_player_arrived)
	_tracked_gamepiece = Player.gamepiece if Player else null
	if _tracked_gamepiece != null:
		_tracked_gamepiece.arrived.connect(_on_player_arrived)


func _on_player_arrived() -> void:
	if _tracked_gamepiece == null or Gameboard == null: return
	player_tile = Gameboard.get_cell_under_node(_tracked_gamepiece)


# Flush the current save state to disk. Safe to call from any system;
# no-ops when SaveSystem isn't available (headless tools, tests).
func save() -> void:
	if SaveSystem:
		SaveSystem.save(SAVE_PATH)


# Whether a save file exists on disk AND the save layer has hydrated
# state from it (SaveSystem._load runs in its _ready and populates
# current_state_dictionary from the default path, which is SAVE_PATH).
# Uses current_region_id as the canonical "has-progress" signal: a
# fresh install never writes it; any autosave after region load does.
# Must gate on the raw "toki" namespace existence before touching the
# current_region_id getter, because SaveSystem's getter logs errors
# when walking into a missing parent Dictionary.
func has_save() -> bool:
	if SaveSystem == null: return false
	if not FileAccess.file_exists(SAVE_PATH): return false
	if not SaveSystem.has("%s:current_region_id" % KEY): return false
	return current_region_id != ""


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
	if id == "" or World == null: return null
	return World.find_species(id)
