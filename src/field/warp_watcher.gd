class_name WarpWatcher
extends Node

# Watches for the player gamepiece to arrive on a tile configured as a
# warp in the current region. On a match, reloads the main scene with
# the target region set as the current region_id, dropping the player
# at to_tile.
#
# Warp resolution is data-driven: region.warps[] is Array of dicts
#   {id, tile: {x,y}, to_region, to_tile: {x,y}}.
#
# Also handles rival-fight tile triggers (region.rival_fights[]) — a
# scripted non-warp combat set-piece. Entry shape:
#   {id, tile: {x,y}, npc_id, flag}
# On arrival at the tile, if TokiSave.get_flag(flag) is false, build an
# arena from the NPC's first team slot and fire combat_triggered. The
# flag is set on victory so the fight does not re-fire on the same save.

var _region: RegionResource = null
var _player_gp: Gamepiece = null
var _warps_by_cell: Dictionary = {}  # Vector2i → Dictionary (warp entry)
var _rivals_by_cell: Dictionary = {}  # Vector2i → Dictionary (rival fight entry)
var _warp_firing: bool = false  # guards against re-entry during the transition
var _pending_rival_flag: String = ""  # set when we fire a rival combat; consumed on combat_finished
var _fled: bool = false  # set by combat_fled; consumed (and cleared) in _on_combat_finished


func initialize(region: RegionResource) -> void:
	_region = region
	_warps_by_cell.clear()
	for w in region.warps:
		if not (w is Dictionary): continue
		var tile: Dictionary = w.get("tile", {"x": 0, "y": 0})
		_warps_by_cell[Vector2i(int(tile.get("x", 0)), int(tile.get("y", 0)))] = w
	_rivals_by_cell.clear()
	for r in region.rival_fights:
		if not (r is Dictionary): continue
		var r_tile: Dictionary = r.get("tile", {"x": 0, "y": 0})
		_rivals_by_cell[Vector2i(int(r_tile.get("x", 0)), int(r_tile.get("y", 0)))] = r
	Player.gamepiece_changed.connect(_on_player_changed)
	_on_player_changed()
	# Defeat whiteout: on a non-victory combat_finished, warp the player
	# to the last-known village (TokiSave.current_region_id) at its spawn
	# tile. Same _perform_warp path as a normal tile warp, just sourced
	# from save state instead of a tile lookup.
	if CombatEvents and not CombatEvents.combat_finished.is_connected(_on_combat_finished):
		CombatEvents.combat_finished.connect(_on_combat_finished)
	if CombatEvents and not CombatEvents.combat_fled.is_connected(_on_combat_fled):
		CombatEvents.combat_fled.connect(_on_combat_fled)


func _on_player_changed() -> void:
	if _player_gp != null and _player_gp.arrived.is_connected(_on_player_arrived):
		_player_gp.arrived.disconnect(_on_player_arrived)
	_player_gp = Player.gamepiece
	if _player_gp != null:
		_player_gp.arrived.connect(_on_player_arrived)


func _on_player_arrived() -> void:
	if _warp_firing or _player_gp == null or Gameboard == null: return
	var cell: Vector2i = Gameboard.get_cell_under_node(_player_gp)
	# Rival fights take precedence over warps — a rival tile can sit at
	# the same location as a warp (e.g. east edge gate) without leaking
	# the player into the next region.
	if _rivals_by_cell.has(cell):
		_maybe_fire_rival(_rivals_by_cell[cell])
		return
	if not _warps_by_cell.has(cell): return
	var warp: Dictionary = _warps_by_cell[cell]
	var target_region: String = String(warp.get("to_region", ""))
	var to_tile_dict: Dictionary = warp.get("to_tile", {"x": 0, "y": 0})
	var to_cell := Vector2i(int(to_tile_dict.get("x", 0)), int(to_tile_dict.get("y", 0)))
	# US-054: badge gate. If warp.required_badge is set, block until
	# TokiSave says we've earned it; show a short dialog instead of
	# just failing silently.
	var required_badge := String(warp.get("required_badge", ""))
	if required_badge != "" and TokiSave != null and not TokiSave.has_badge(required_badge):
		print("[WarpWatcher] blocked: need %s badge for %s" % [required_badge, target_region])
		_show_badge_gate_message(required_badge)
		return
	print("[WarpWatcher] → %s at %s" % [target_region, to_cell])
	_warp_firing = true
	_perform_warp(target_region, to_cell)


func _show_badge_gate_message(badge_id: String) -> void:
	# Uses the victory panel (re-used as a generic message panel) for
	# consistency with other in-field modal blurbs.
	var panel_scene: PackedScene = load("res://src/combat/ui/victory_panel.tscn")
	if panel_scene == null: return
	var panel = panel_scene.instantiate()
	# Attach to whatever Node2D root the current scene has; fall back to
	# the viewport Window so we never crash. The panel is a CanvasLayer
	# so parent type doesn't matter visually.
	var parent_node: Node = get_tree().current_scene
	if parent_node == null:
		parent_node = get_tree().root
	parent_node.add_child(panel)
	panel.show_sequence(["You need the %s badge to pass here." % badge_id])
	await panel.finished
	panel.queue_free()


func _maybe_fire_rival(rival: Dictionary) -> void:
	var flag := String(rival.get("flag", ""))
	if flag != "" and TokiSave and TokiSave.get_flag(flag):
		return
	var npc_id := String(rival.get("npc_id", ""))
	var npc: NpcResource = _find_npc(npc_id)
	if npc == null:
		push_warning("[WarpWatcher] rival NPC '%s' not found in region %s" % [npc_id, _region.id])
		return
	if npc.team.is_empty() or not (npc.team[0] is Dictionary):
		push_warning("[WarpWatcher] rival NPC '%s' has no team" % npc_id)
		return
	var slot: Dictionary = npc.team[0]
	var enemy_species_id := String(slot.get("species_id", ""))
	var enemy_species: SpeciesResource = World.find_species(enemy_species_id) if World else null
	if enemy_species == null:
		push_warning("[WarpWatcher] rival species '%s' not in world" % enemy_species_id)
		return
	var enemy_level := int(slot.get("level", 1))
	var enemy_moves: Array = slot.get("moves", []) if slot.get("moves") is Array else []

	var lead_species_id := EncounterWatcher.DEFAULT_LEAD_SPECIES
	var lead_level := EncounterWatcher.DEFAULT_LEAD_LEVEL
	var party: Array = TokiSave.party() if TokiSave else []
	if not party.is_empty() and party[0] is Dictionary:
		var lead: Dictionary = party[0]
		lead_species_id = String(lead.get("species_id", lead_species_id))
		lead_level = int(lead.get("level", lead_level))
	var lead_species: SpeciesResource = World.find_species(lead_species_id) if World else null
	if lead_species == null:
		push_warning("[WarpWatcher] lead species '%s' missing" % lead_species_id)
		return

	var arena: PackedScene = TokiArenaBuilder.build_arena_for_rival(
		enemy_species, enemy_level, enemy_moves, npc.name_tp,
		lead_species, lead_level, npc.badge_award,
	)
	if arena == null:
		push_error("[WarpWatcher] rival arena build failed")
		return
	print("[WarpWatcher] rival fight! %s (%s L%d)" % [npc.name_tp, enemy_species_id, enemy_level])
	_pending_rival_flag = flag
	if FieldEvents and FieldEvents.has_signal("combat_triggered"):
		FieldEvents.emit_signal("combat_triggered", arena)


func _find_npc(npc_id: String) -> NpcResource:
	if _region == null: return null
	for n in _region.npcs:
		if n is NpcResource and (n as NpcResource).id == npc_id:
			return n
	return null


func _on_combat_fled() -> void:
	_fled = true


func _on_combat_finished(is_player_victory: bool) -> void:
	# Flee takes precedence over both rival and defeat-warp branches.
	# A successful escape leaves the player standing on the pre-combat
	# tile (Field.gd re-shows the field) — no warp, no flag set.
	if _fled:
		_fled = false
		_pending_rival_flag = ""
		return
	# A rival victory is a set-piece outcome: mark the flag so the
	# trigger does not re-fire, then return without warping. On defeat,
	# fall through to the village-respawn path below.
	if _pending_rival_flag != "":
		var flag := _pending_rival_flag
		_pending_rival_flag = ""
		if is_player_victory:
			if TokiSave and flag != "":
				TokiSave.set_flag(flag, true)
				TokiSave.save()
			return
	if is_player_victory: return
	if _warp_firing: return
	if TokiSave == null: return
	var target_region: String = TokiSave.current_region_id
	if target_region == "": return
	var target_region_res: RegionResource = World.find_region(target_region) if World else null
	if target_region_res == null: return
	var to_cell: Vector2i = target_region_res.spawn
	print("[WarpWatcher] defeat → %s at %s" % [target_region, to_cell])
	_warp_firing = true
	_perform_warp(target_region, to_cell)


# Reload the main scene pointing at a different region. We store the
# target in a static singleton (Engine.meta) so the fresh RegionBuilder
# picks it up on _ready().
func _perform_warp(region_id: String, to_cell: Vector2i) -> void:
	Engine.set_meta("warp_target_region", region_id)
	Engine.set_meta("warp_target_tile", to_cell)
	# US-036: show the destination region's name on the cover screen so
	# the player understands "where am I going" during the transition.
	var label_text: String = _pretty_region_label(region_id)
	if Transition and Transition.has_method("cover_with_label"):
		await Transition.cover_with_label(label_text, 0.3)
	elif Transition and Transition.has_method("cover"):
		await Transition.cover(0.2)
	get_tree().reload_current_scene()


func _pretty_region_label(region_id: String) -> String:
	var world_autoload: Node = get_tree().root.get_node_or_null("World")
	if world_autoload != null and world_autoload.has_method("find_region"):
		var r = world_autoload.find_region(region_id)
		if r != null and "name_tp" in r and String(r.name_tp) != "":
			return String(r.name_tp)
	# Fallback: humanize the id (ma_tomo_lili → ma tomo lili)
	return region_id.replace("_", " ")
