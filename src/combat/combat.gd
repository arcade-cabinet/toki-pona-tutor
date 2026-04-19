## The Combat class manages combat logic from beginning to end.
##
## The battle is composed from several components which should all be wrapped up in a [CombatArena].
## The Combat class instantiates the arena as a child before instantiating the player battlers and
## assigning them as descendants of the arena's [BattlerRoster].[br][br]
##
## The combat logic follows the pattern set by early JRPGs, where each combat round includes two
## phases:
## [br]	1) Action selection: each Battler selects an action, AI battlers followed by the player.
## [br]	2) Action execution: the Battlers carry out their selected actions.[br][br]
## If the player and enemy sides are both still alive, combat procedes to the next round. Combat
## logic may be illustrated as follows:[br][br]
## [method setup] combat with a [CombatArena] (usually triggered by
## [signal FieldEvents.combat_triggered]).
## [br]	- Begin new combat round
## [br]		- AI Battlers select their actions.
## [br]		- Until all player Battlers have a [member Battler.cached_action]:
## [br]			- The next player Battler selects their action via the [UICombat].
## [br]			- If all player Battlers have a [member Battler.cached_action], move to action
## execution.
## [br][br]		- For each Battler with a cached action (sorted by speed):
## [br]			- [method Battler.act]
## [br]		- If player and enemy Battlers are still alive, go to the next round.[br]
## [method shutdown] combat, cleaning up combat objects
## [br]	- Emit the [signal CombatEvents.combat_finished] signal.
class_name Combat extends CanvasLayer

## Tracks which combat round is currently being played. Every round, all active [Battler]s will get
## a turn to act.
var round_count: int = 0

# Keep track of what music track was playing previously, and return to it once combat has finished.
var _previous_music_track: AudioStream = null

const VICTORY_PANEL_SCENE: PackedScene = preload("res://src/combat/ui/victory_panel.tscn")

@onready var _battler_roster: BattlerRoster
@onready var _combat_container: = $CenterContainer as CenterContainer
@onready var _transition_delay_timer: = $UI/TransitionDelay as Timer
@onready var _ui: = $UI as UICombat

# XP yield lifted off the active CombatArena at setup time so the
# victory panel can tally XP/level-ups/new-moves without reaching back
# into the spawner.
var _pending_xp_yield: int = 0
var _pending_enemy_species_id: String = ""
var _pending_badge_award: String = ""


func _ready() -> void:
	hide()
	FieldEvents.combat_triggered.connect(setup)
	if CombatEvents.has_signal("poki_thrown"):
		CombatEvents.poki_thrown.connect(_on_poki_thrown)


# Queue the catch-result dialog lines; _run_victory_sequence / the
# defeat path will consume them next time the victory panel opens.
var _pending_catch_message: PackedStringArray = PackedStringArray()


func _on_poki_thrown(species_id: String, caught: bool, _chance: float) -> void:
	if caught:
		if TokiSave != null:
			TokiSave.mark_caught(species_id)
		_pending_catch_message = PackedStringArray([
			"[b]poki li awen![/b]\nYou caught %s!" % species_id,
		])
	else:
		_pending_catch_message = PackedStringArray([
			"poki li pakala.\nThe %s escaped." % species_id,
		])


# Tracks whether the current combat is ending because the player
# successfully fled. Set by _play_next_action after inspecting the
# player's cached FleeAction; consumed by _on_combat_finished to skip
# heal/defeat-dialog and emit combat_fled.
var _fled: bool = false


## Begin a combat. Takes a PackedScene as its only parameter, expecting it to be a CombatState 
## object once instantiated.
## This is normally a response to [signal FieldEvents.combat_triggered].
func setup(arena: PackedScene) -> void:
	await Transition.cover(0.2)
	show()

	var new_arena := arena.instantiate()
	assert(
		new_arena != null,
		"Failed to initiate combat. Provided 'arena' arugment is not a CombatArena."
	)

	var combat_arena: CombatArena = new_arena
	_combat_container.add_child(combat_arena)
	_battler_roster = combat_arena.get_battler_roster()
	_pending_xp_yield = combat_arena.xp_yield
	_pending_enemy_species_id = combat_arena.enemy_species_id
	_pending_badge_award = combat_arena.badge_award
	_fled = false
	# US-056: flag the enemy species as "seen" as soon as combat opens.
	if TokiSave != null and _pending_enemy_species_id != "":
		TokiSave.mark_seen(_pending_enemy_species_id)

	# Wait a frame for the arena and its children (VFX, Battlers, etc.) to be ready.
	await get_tree().process_frame
	
	_ui.setup(_battler_roster)

	_previous_music_track = Music.get_playing_track()
	Music.play(combat_arena.music)

	CombatEvents.combat_initiated.emit()

	# Before starting combat itself, reveal the screen again.
	# The Transition.clear() call is deferred since it follows on the heels of cover(), and needs a
	# frame to allow everything else to respond to Transition.finished.
	Transition.clear.call_deferred(0.2)
	await Transition.finished
	
	# Fade in the combat UI elements.
	_ui.animation.play("fade_in")
	await _ui.animation.animation_finished
	
	# Begin the combat logic. The turn queue takes over from here.
	round_count = 0
	next_round.call_deferred()


# Moves combat to the next round. At the beginning of the round, all Battlers will choose an action.
func next_round() -> void:
	round_count += 1
	
	# First of all, let enemy (necessarily AI) battlers pick their actions.
	for battler in _battler_roster.find_live_battlers(_battler_roster.get_enemy_battlers()):
		if battler.ai != null:
			battler.ai.select_action(battler)
	
	# Secondly, allow player Battlers to pick their action.
	# This will be iterative as the player selects and cancels their choices. The turn queue will
	# move to the action phase once all player Battlers have an action selected.
	_select_next_player_action()


# Player Battlers select their actions by repeatedly calling _select_next_player_action. The method
# looks for player Battlers who have no cached action and prioritizes those further up in the scene
# tree. This allows the player to go "backwards" and "forwards" between Battlers, choosing actions
# and cancelling them as needed.
# At this point, all AI Battlers should have a cached actoin.
# Once all Battlers have an action cached (see Battler.cached_action), _select_next_player_action
# calls _next_turn to move into the second phase.
func _select_next_player_action() -> void:
	# Find any remaining player Battlers that need an action selected.
	var player_battlers: = _battler_roster.get_player_battlers()
	var remaining_battlers: = _battler_roster.find_battlers_needing_actions(player_battlers)
	
	# If there are no player Battlers needing actions, move on to the second phase of a round:
	# taking action!
	if remaining_battlers.is_empty():
		# De-select the last Battler that was receiving orders.
		CombatEvents.player_battler_selected.emit(null)
		_play_next_action.call_deferred()
		return
	
	# If there are player Battlers needing cached actions, pick the first one and allow it to search
	# for an action using either its AI controller (if present) or player input.
	var next_player_battler: Battler = remaining_battlers.front()
	
	# When the player selects an action (or presses 'back'), the current Battler needs to move back
	# to its rest position before moving on to the next battler, hence the await call below.
	next_player_battler.action_cached.connect(
		(func _on_selected_battler_action_cached(battler: Battler) -> void:
			# Check to see if the player cancelled action selection (pressed "back" from the
			# UIActionMenu). If so, the player wishes to reissue orders for the previous Battler.
			# If there IS a previous Battler, remove its cached action.
			if battler.cached_action == null:
				var battlers: = _battler_roster.get_player_battlers()
				var index: = battlers.find(battler)
				if index > 0:
					var previous_battler: Battler = battlers[index-1]
					previous_battler.cached_action = null
			
			await battler.anim.move_to_rest(0.15)
			_select_next_player_action()
			).bind(next_player_battler), 
		CONNECT_DEFERRED | CONNECT_ONE_SHOT)
	
	await next_player_battler.anim.move_forward(0.15)
	
	# Activate the player UI elements for the currently selected battler.
	CombatEvents.player_battler_selected.emit(next_player_battler)


# The second phase of combat has each Battler act in order of speed. This is done by repeatedly
# calling _next_turn until no active Battlers have a cached action waiting to be executed.
func _play_next_action() -> void:
	# Flee takes precedence: if a player battler's cached_action is a
	# FleeAction whose execute() just set fled = true, end combat
	# immediately without resolving defeat/victory. This short-circuits
	# before any other battler gets another turn. Reading the flag off
	# the action instance (instead of Engine meta) keeps flee state
	# per-combat, not process-global.
	for battler in _battler_roster.get_player_battlers():
		var action := battler.cached_action
		if action is FleeAction and (action as FleeAction).fled:
			_fled = true
			_on_combat_finished.call_deferred(false)
			return
	# Check for battle end conditions, that one side has been downed.
	if _battler_roster.are_battlers_defeated(_battler_roster.get_player_battlers()):
		_on_combat_finished.call_deferred(false)
		return
	elif _battler_roster.are_battlers_defeated(_battler_roster.get_enemy_battlers()):
		_on_combat_finished.call_deferred(true)
		return

	# Check for an active Battler. If neither side has lost yet there are no active actors, it's
	# time to start the next round.
	var next_actor: = _get_next_actor()
	if next_actor == null:
		next_round()
		return
	
	# Connect to the actor's turn_finished signal. The actor is guaranteed to emit the signal,
	# even if it will be freed at the end of this frame.
	# However, we'll call_defer the next turn, since the current actor may have been downed on its
	# turn and we need a frame to process the change.
	next_actor.turn_finished.connect(_play_next_action, CONNECT_DEFERRED | CONNECT_ONE_SHOT)
	next_actor.act()


func _get_next_actor() -> Battler:
	var battlers: = _battler_roster.get_battlers()
	var ready_to_act_battlers: = _battler_roster.find_ready_to_act_battlers(battlers)
	if ready_to_act_battlers.is_empty():
		return null
	
	ready_to_act_battlers.sort_custom(Battler.sort)
	return ready_to_act_battlers.front()


func _on_combat_finished(is_player_victory: bool) -> void:
	# Fade out the combat UI elements.
	_ui.animation.play("fade_out")
	await _ui.animation.animation_finished

	if is_player_victory:
		await _run_victory_sequence()
	elif _fled:
		# Clean escape — no heal, no defeat dialog. A single beat panel
		# confirms the retreat; WarpWatcher is signalled via combat_fled
		# (fired below) to skip its faint-warp branch.
		await _display_flee_dialog()
	else:
		await _display_defeat_dialog()
		# Defeat whiteout: heal the whole party so the player resumes at
		# the last village with fresh HP/PP. The actual teleport back to
		# the region spawn is performed by WarpWatcher, which listens for
		# combat_finished(false).
		if TokiSave:
			TokiSave.heal_party()

	_battler_roster = null
	
	# Wait a short period of time and then fade the screen to black.
	_transition_delay_timer.start()
	await _transition_delay_timer.timeout
	await Transition.cover(0.2)
	hide()
	
	# Clean up the combat arena.
	for child in _combat_container.get_children():
		child.free()

	Music.play(_previous_music_track)
	_previous_music_track = null

	# Autosave after every battle (win or loss) so a crash after
	# combat doesn't cost the player the XP / heal / level-up that
	# just resolved. Runs after _run_victory_sequence (XP granted)
	# and _display_defeat_dialog (party healed), so the flushed
	# state already reflects the outcome.
	if TokiSave:
		TokiSave.save()

	# If the player fled, announce it on the dedicated signal before the
	# generic combat_finished fires. WarpWatcher uses this to suppress its
	# defeat-warp branch (a flee is not a faint).
	if _fled:
		CombatEvents.combat_fled.emit()

	# Whatever object started the combat will now be responsible for flow of the game. In
	# particular, the screen is still covered, so the combat-starting object will want to
	# decide what to do now that the outcome of the combat is known.
	CombatEvents.combat_finished.emit(is_player_victory)
	_fled = false


# Snapshot the lead's pre-grant state, tally XP via TokiSave, then
# walk a VictoryPanel sequence showing +N xp, level-up, and any
# newly-learned moves. Uses our own VictoryPanel instead of a
# Dialogic timeline to avoid the 4.6 subsystem_text runtime warning;
# field dialogs continue to use the existing DialogOverlay + resource
# pipeline, which is the long-term dialogue approach for this game.
func _run_victory_sequence() -> void:
	var amount: int = max(0, _pending_xp_yield)
	var pre_level: int = 0
	var pre_moves: Array = []
	if TokiSave:
		var party_snapshot: Array = TokiSave.party()
		if not party_snapshot.is_empty() and party_snapshot[0] is Dictionary:
			pre_level = int(party_snapshot[0].get("level", 1))
			var pm: Variant = party_snapshot[0].get("moves", [])
			pre_moves = (pm as Array).duplicate() if pm is Array else []

	if amount > 0 and TokiSave:
		TokiSave.grant_xp_to_lead(amount)

	var post_level: int = pre_level
	var post_moves: Array = pre_moves
	if TokiSave:
		var after: Array = TokiSave.party()
		if not after.is_empty() and after[0] is Dictionary:
			post_level = int(after[0].get("level", pre_level))
			var am: Variant = after[0].get("moves", [])
			post_moves = am if am is Array else pre_moves

	var entries: Array = _build_victory_entries(amount, pre_level, post_level, pre_moves, post_moves)

	# US-027 + US-059: roll item drop + coin reward based on enemy species.
	if TokiSave != null and _pending_enemy_species_id != "":
		var species := _lookup_species(_pending_enemy_species_id)
		if species != null:
			if species.coin_yield > 0:
				TokiSave.give_coins(species.coin_yield)
				entries.append("+%d ma" % species.coin_yield)
			if species.item_drop_id != "" and randf() < species.item_drop_chance:
				TokiSave.give_item(species.item_drop_id, 1)
				entries.append("found: %s" % species.item_drop_id)

	# US-052: award the arena-configured badge. First-time award only.
	if TokiSave != null and _pending_badge_award != "":
		if TokiSave.award_badge(_pending_badge_award):
			entries.append("[b]sina kama jo e poki sewi![/b]\nYou earned the %s badge!" % _pending_badge_award)

	# Prepend any pending catch-result lines so a successful/failed
	# poki throw shows BEFORE the xp/level-up tally.
	if _pending_catch_message.size() > 0:
		var combined: Array = []
		for m in _pending_catch_message:
			combined.append(m)
		for e in entries:
			combined.append(e)
		entries = combined
		_pending_catch_message = PackedStringArray()
	if entries.is_empty():
		return
	var panel: VictoryPanel = VICTORY_PANEL_SCENE.instantiate() as VictoryPanel
	add_child(panel)
	panel.show_sequence(entries)
	await panel.finished
	panel.queue_free()


func _build_victory_entries(
	amount: int, pre_level: int, post_level: int, pre_moves: Array, post_moves: Array
) -> Array:
	var entries: Array = []
	if amount > 0:
		entries.append("+%d xp" % amount)
	if post_level > pre_level:
		entries.append("L%d → L%d" % [pre_level, post_level])
	for move_id in post_moves:
		if move_id in pre_moves: continue
		var move_name: String = _move_display_name(String(move_id))
		entries.append("new move: %s" % move_name)
	return entries


func _move_display_name(move_id: String) -> String:
	var world_autoload: Node = get_tree().root.get_node_or_null("World")
	if world_autoload and world_autoload.has_method("find_move"):
		var move: MoveResource = world_autoload.find_move(move_id)
		if move != null and move.name_tp != "":
			return move.name_tp
	return move_id


# Shim around World autoload so the unit-test tooling (no autoload tree)
# doesn't crash. Production code should just call World.find_species.
func _lookup_species(species_id: String) -> SpeciesResource:
	if species_id == "" or World == null: return null
	return World.find_species(species_id)


# Defeat message — single beat via the victory panel for visual
# consistency. (It's still technically the end-of-combat panel; the
# name reflects its primary role.)
func _display_defeat_dialog() -> void:
	var leader_name: String = "sina"
	if _battler_roster != null:
		var players := _battler_roster.get_player_battlers()
		if not players.is_empty():
			leader_name = players[0].name
	var panel: VictoryPanel = VICTORY_PANEL_SCENE.instantiate() as VictoryPanel
	add_child(panel)
	# Diegetic toki-pona "pakala!" (~breakage/failure) + English help.
	panel.show_sequence([
		"pakala!\n[i]%s has fainted.[/i]" % leader_name,
		"[i]sina tawa ma tomo.[/i]\nYou wake up back in the village.",
	])
	# Auto-advance after 2s per AC — players can still press to skip.
	var timer := get_tree().create_timer(2.0)
	await timer.timeout
	panel.queue_free()


# Successful-flee message — single beat via the victory panel.
func _display_flee_dialog() -> void:
	var panel: VictoryPanel = VICTORY_PANEL_SCENE.instantiate() as VictoryPanel
	add_child(panel)
	panel.show_sequence(["Got away safely!"])
	await panel.finished
	panel.queue_free()
