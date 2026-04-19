# PRD: poki soweli — Roadmap to v0.1.0

## Overview

Build poki soweli from its current "skeleton playable" state to a polished v0.1.0 release. The game is a Godot 4 toki-pona-language Pokémon-like: 7 regions, 17 species, 7 gym leaders (jan lawa), full combat loop, save/load, mobile + web exports, and CI-green test suite. This PRD enumerates all 91 roadmap tasks across 6 phases as user stories, executed top-to-bottom respecting dependencies.

The end-state is the 10-point Definition of Done in `docs/ROADMAP.md` §1: full softlock-free playthrough, ≥ 20 catchable creatures, themed mobile-legible UI, persistent saves, 4 audio tracks + 12 SFX, signed Android AAB + ≤ 30MB web build, ≥ 25 gdUnit4 tests passing, v0.1.0 tagged via release-please.

## Quality Gates

These commands must pass for every user story:

- `make validate` — schema + content validation (offline)
- `make build` — `build_spine.gd` produces all `.tres` artifacts
- `make test` — gdUnit4 suite exits 0
- `godot --headless --check-only` — no script parse errors

For UI-touching stories, also include:

- Capture a Godot screenshot of the affected scene (editor or `--headless` rendered) and review it for visual correctness, theme adherence, and mobile legibility before marking done

## Goals

- Ship a complete, fun, polished Godot game playable on desktop, mobile (Android), and web
- Eliminate every softlock, placeholder, and dev-only path on the critical user journey
- Establish a meaningful gdUnit4 test suite (≥ 25 tests) covering schema, combat math, save round-trip, warp graph, and scripted full playthrough
- Deliver content breadth: 7 regions, 17 species, 17 moves, 7 jan lawa fights, ≥ 80 validated TP lines
- Theme all UI through `theme/toki_theme.tres` and meet WCAG AA contrast on mobile-sized targets
- Cut a release-please v0.1.0 tag with signed Android AAB and ≤ 30MB compressed web build
- Fully remove Dialogic 2.0-Alpha-16 dependency in favor of the project's native `DialogOverlay` + schema-driven dialogs

## Resolved Decisions (previously open questions)

1. **US-083 playthrough coverage.** Full playthrough test covers all 7 jan lawa + credits, budget < 180s (vs. < 90s gym-1-only). DoD #1 is otherwise unverifiable.
2. **US-049 cave visibility shader.** Defer to v0.2.0 — optional, no DoD requirement.
3. **US-047 slippery ice tiles.** Defer to v0.2.0 — optional, adds untested movement physics.
4. **Dialogic removal (US-021).** Fully remove the addon. Installed version is 2.0-Alpha-16 (stale pre-release), autoloaded in `project.godot`, used only at `src/combat/combat.gd:216-229`. Project's native `DialogOverlay` handles all other dialogs. Steps baked into US-021 acceptance criteria.
5. **US-091 iOS coverage.** Web-on-Safari on iPhone satisfies v0.1.0 iOS requirement. Native iOS build is non-goal.

## User Stories

### US-001: Wire starter-ceremony dialog triggers end-to-end
As a player, I want completing the jan Sewi starter ceremony to actually grant my chosen creature and items, so that the opening tutorial has real consequences.

**Acceptance Criteria:**
- [ ] After jan_sewi tutorial dialog closes, `TokiSave.party()` contains soweli_seli @ L5
- [ ] Inventory contains 3 × poki_lili
- [ ] Flag `starter_chosen=true` is set and persists across save/load
- [ ] Files: `src/common/toki_save.gd`, `src/field/ui/dialog_overlay.gd`

### US-002: Let player pick from 3 starters (seli/telo/kasi)
As a player, I want to choose between three starter creatures during the ceremony, so that I can pick a play style.

**Acceptance Criteria:**
- [ ] jan Sewi dialog offers 3 lettered choices (seli / telo / kasi)
- [ ] Selecting a choice dispatches `add_party` with the picked species only
- [ ] Untouched species do not appear in party
- [ ] Files: `schema/dialog_resource.gd`, `content/spine/regions/ma_tomo_lili.json`, `src/field/ui/dialog_overlay.gd`

### US-003: Read from party instead of hardcoded DEFAULT_LEAD_SPECIES
As a player, I want my chosen starter to be the one that appears in encounters, not a hardcoded debug species.

**Acceptance Criteria:**
- [ ] `EncounterWatcher._on_player_arrived` uses `TokiSave.party()[0]` when party non-empty
- [ ] Falls back to DEFAULT_LEAD_SPECIES only when party is empty
- [ ] Files: `src/field/encounter_watcher.gd`

### US-004: Populate nasin_wan tall-grass encounter table
As a player, I want walking through tall grass in nasin_wan to trigger varied wild encounters, so that the route feels alive.

**Acceptance Criteria:**
- [ ] `nasin_wan.json` has `tall_grass_keys` populated
- [ ] `encounters[]` has ≥ 4 weighted species entries
- [ ] Encounters fire when player walks across tall_grass tiles
- [ ] Files: `content/spine/regions/nasin_wan.json`

### US-005: Add tall-grass tile painting to nasin_wan ground layer
As a player, I want to see tall-grass tiles painted in the world so I can avoid or seek encounters.

**Acceptance Criteria:**
- [ ] ≥ 20 tiles tagged `tall_grass` visible in nasin_wan grid
- [ ] Tiles painted with forest_summer foliage atlas
- [ ] Files: `content/spine/regions/nasin_wan.json`

### US-006: Author jan Ike rival set-piece at nasin_wan east edge
As a player, I want a scripted rival fight when I reach the east edge of nasin_wan, so that the route has a story beat.

**Acceptance Criteria:**
- [ ] Stepping on tile (30,5) triggers a forced non-random battle
- [ ] jan Ike has 1-creature party
- [ ] Trigger fires only once per save
- [ ] Files: `content/spine/regions/nasin_wan.json`, `src/field/warp_watcher.gd`

### US-007: Create FieldTriggerWatcher for non-warp scripted tile triggers
As a developer, I want a clean separation between warp triggers and scripted-event triggers, so that set-pieces and dialogs are easy to author.

**Acceptance Criteria:**
- [ ] New `FieldTriggerWatcher` distinct from `WarpWatcher`
- [ ] Fires `FieldEvents.combat_triggered` or `dialog_requested` based on `region.triggers[]` data
- [ ] Files: `src/field/field_trigger_watcher.gd` (new), `src/field/field_events.gd`, `schema/region_resource.gd`

### US-008: Fix combat → field return so player lands on pre-combat tile
As a player, I want to return to exactly where I was after a battle ends, so that combat doesn't feel disorienting.

**Acceptance Criteria:**
- [ ] `Combat.hide()` emits `CombatEvents.combat_finished`
- [ ] Field restores input handling
- [ ] Player Gamepiece resumes at the pre-combat cell
- [ ] No scene reload during return
- [ ] Files: `src/combat/combat.gd`, `src/field/field.gd`

### US-009: Apply XP + level-up on combat victory
As a player, I want my creatures to gain XP and level up after winning fights, so that progression feels rewarding.

**Acceptance Criteria:**
- [ ] After victory, `TokiSave.party()[0].xp += enemy.xp_yield`
- [ ] Crossing a curve threshold triggers level up
- [ ] Level up recomputes max HP and learns moves per species curve
- [ ] Files: `src/common/toki_save.gd`, `src/combat/combat.gd`, `schema/species_resource.gd`

### US-010: Apply faint → whiteout → restore party at last village
As a player, I want a clear defeat sequence that returns me to safety, so that losing is not a softlock.

**Acceptance Criteria:**
- [ ] Defeat clears combat flag
- [ ] Player warps to `TokiSave.current_region_id` spawn point
- [ ] All party HP fully restored
- [ ] Files: `src/combat/combat.gd`, `src/field/warp_watcher.gd`, `src/common/toki_save.gd`

### US-011: Flee action in combat UI for wild battles
As a player, I want to flee from wild battles, so that I can retreat from unwanted fights.

**Acceptance Criteria:**
- [ ] Flee button in action menu (wild battles only)
- [ ] 75% base success rate
- [ ] On success, combat ends with `is_player_victory=false` and no faint whiteout
- [ ] Files: `src/combat/ui/action_menu/ui_action_menu.gd`, `src/combat/combat.gd`

### US-012: Swap toki_town_main.tscn to use forest_summer tileset for nasin_wan
As a player, I want nasin_wan to look like a forest, not a town, so that biomes feel distinct.

**Acceptance Criteria:**
- [ ] Visiting nasin_wan paints from `assets/tilesets/forest_summer/*.png`
- [ ] ma_tomo_lili continues to use Kenney town atlas
- [ ] Files: `src/field/region_builder.gd`, new `content/tilesets/forest_summer.tres`

### US-013: Build forest_summer tileset resource with walkable + tall_grass flags
As a developer, I want a complete forest_summer TileSet with collision and tag metadata, so that field systems can resolve tile types.

**Acceptance Criteria:**
- [ ] `TileKeys.resolve("tall_grass")` returns valid atlas coord from forest_summer
- [ ] Walkable flag honored by Gamepiece pathing
- [ ] Files: `tools/tile_keys.gd`, new `content/tilesets/forest_summer.tres`

### US-014: Sanity playthrough checklist for slice
As a developer, I want a documented manual playthrough script, so that I can verify the slice end-to-end before merging Phase 1.

**Acceptance Criteria:**
- [ ] `docs/SLICE_CHECK.md` exists with start→starter→warp→combat→warp checklist
- [ ] Checklist executes cleanly with `make build && make run`
- [ ] Files: `docs/SLICE_CHECK.md` (new)

### US-015: Theme combat UI with toki_theme.tres
As a player, I want combat to look like the rest of the game, so that the experience feels cohesive.

**Acceptance Criteria:**
- [ ] `ui_combat.theme` overridden by `toki_theme.tres`
- [ ] All Labels use Nunito/Fredoka
- [ ] All Panels use amber/parchment palette
- [ ] Files: `src/combat/ui/ui_combat.tscn`, `theme/toki_theme.tres`

### US-016: Animate HP bars with tween on damage
As a player, I want HP bars to animate when I take damage, so that combat feels responsive.

**Acceptance Criteria:**
- [ ] HP changes tween over 0.4s ease-out
- [ ] Bar color shifts green→amber at 50% HP
- [ ] Bar color shifts amber→red at 20% HP
- [ ] Files: `src/combat/ui/battler_entry/ui_life_bar.gd`

### US-017: Damage number popups with type-matchup color
As a player, I want to see floating damage numbers colored by effectiveness, so that I learn type matchups visually.

**Acceptance Criteria:**
- [ ] Damage labels float up and fade out
- [ ] Super-effective hits flash emerald
- [ ] Resisted hits flash grey
- [ ] Misses display "pakala"
- [ ] Files: `src/combat/ui/effect_labels/ui_damage_label.gd`, `ui_damage_label.tscn`

### US-018: Swap battler sprites to creature packs per species
As a player, I want each species to have a distinct battle sprite, so that creatures feel unique.

**Acceptance Criteria:**
- [ ] Each `SpeciesResource.sprite_frame` maps to an asset in `assets/creatures/`
- [ ] In-combat sprite is distinct per species (no shared placeholder)
- [ ] Files: `schema/species_resource.gd`, `src/combat/battlers/toki_battler_anim.gd`, `tools/build_spine.gd`

### US-019: Battler hit animation (shake + flash)
As a player, I want creatures to react when hit, so that damage feels impactful.

**Acceptance Criteria:**
- [ ] On taking damage, sprite shakes for 0.15s
- [ ] Sprite flashes white during shake
- [ ] Files: `src/combat/battlers/toki_battler_anim.gd`

### US-020: Faint animation (fade + slide down)
As a player, I want a clear faint animation when a creature reaches 0 HP.

**Acceptance Criteria:**
- [ ] Sprite drops 40px over 0.5s
- [ ] Sprite fades to 0 alpha during drop
- [ ] Files: `src/combat/battlers/toki_battler_anim.gd`

### US-021: Replace Dialogic victory timeline with native VictoryPanel + fully remove Dialogic addon
As a player, I want a satisfying end-of-battle sequence showing XP, level-ups, and new moves, using the project's native dialog style.

**Acceptance Criteria:**
- [ ] New `VictoryPanel` scene shows "+N xp" → "L{old}→L{new}" (if leveled) → "new move: X" (if learned) in sequence
- [ ] `src/combat/combat.gd:216-229` no longer references `Dialogic`
- [ ] `dialogic` removed from `project.godot` autoload list
- [ ] `dialogic`, `dialogic_additions` removed from `[editor_plugins]` enabled[] array
- [ ] `[dialogic]` config section removed from `project.godot`
- [ ] `addons/dialogic/` and `addons/dialogic_additions/` directories deleted
- [ ] `grep -r "Dialogic" src/ addons/ project.godot` returns zero hits
- [ ] Game boots and wins a fight without error
- [ ] Files: `src/combat/combat.gd`, new `src/combat/ui/victory_panel.tscn` + `victory_panel.gd`, `project.godot`, `addons/dialogic*` (deleted)

### US-022: Defeat screen panel
As a player, I want a clear defeat message before being returned to the village.

**Acceptance Criteria:**
- [ ] Full-screen fade with message "pakala! sina tawa ma tomo."
- [ ] Auto-returns to field after 2s
- [ ] Files: new `src/combat/ui/defeat_panel.tscn`

### US-023: Catch UX with poki-throw animation + result dialog
As a player, I want a tactile catch sequence with animation and clear result feedback.

**Acceptance Criteria:**
- [ ] Throwing a poki plays a sprite-arc animation
- [ ] On success, dialog shows "you caught {name_tp}"
- [ ] On fail, wild creature gets next turn
- [ ] Files: `src/combat/actions/poki_throw_action.gd`, new `src/combat/ui/catch_result_panel.tscn`

### US-024: Party Panel scene with 6 slots
As a player, I want to view my party from the field via a hotkey.

**Acceptance Criteria:**
- [ ] Pressing P on field opens panel overlay
- [ ] Panel shows 6 slots with sprite, name_tp (sitelen-pona), HP bar, level
- [ ] Files: new `src/field/ui/party_panel.tscn`, `party_panel.gd`

### US-025: Party Panel detail view with moves/XP/type
As a player, I want to inspect each creature's moves, XP progress, and type.

**Acceptance Criteria:**
- [ ] Tapping a slot shows detail card
- [ ] Card displays 4 moves, type badge, XP progress bar
- [ ] Files: `src/field/ui/party_panel.gd`

### US-026: Party Panel reorder via drag
As a player, I want to drag a creature to slot 0 to set my new lead.

**Acceptance Criteria:**
- [ ] Drag any slot to position 0 to reorder
- [ ] New lead persists via `TokiSave`
- [ ] Files: `src/field/ui/party_panel.gd`, `src/common/toki_save.gd`

### US-027: Reward item + XP drop table per species
As a developer, I want each species to define its XP yield and item drop chance.

**Acceptance Criteria:**
- [ ] `SpeciesResource` has `xp_yield` and optional `item_drop_chance` fields
- [ ] Victory grants both
- [ ] Files: `schema/species_resource.gd`, `content/spine/species/*.json`, `src/combat/combat.gd`

### US-028: Add kili healing item usable from party panel
As a player, I want to heal injured creatures with kili from the party panel.

**Acceptance Criteria:**
- [ ] From party panel, tapping a creature offers "use kili"
- [ ] Use grants +20 HP
- [ ] Inventory decrements
- [ ] Works on fainted or injured creatures
- [ ] Files: `src/field/ui/party_panel.gd`, `content/spine/items/kili.json`

### US-029: Items submenu in combat action menu
As a player, I want to use items mid-fight from a clear submenu.

**Acceptance Criteria:**
- [ ] Action menu has Fight / Poki / Item / Flee
- [ ] Item opens an inventory sub-list
- [ ] Files: `src/combat/ui/action_menu/ui_action_menu.gd` + `.tscn`

### US-030: Title scene with new game / continue / settings / quit
As a player, I want a real title screen instead of booting straight into gameplay.

**Acceptance Criteria:**
- [ ] `res://src/title.tscn` is the new `run/main_scene`
- [ ] Menu routes to game, settings, or quit
- [ ] Files: new `src/title.tscn` + `title.gd`, `project.godot`

### US-031: Hook SaveSystem.save() to autosave on region change
As a player, I want the game to autosave when I cross between regions.

**Acceptance Criteria:**
- [ ] Every `FieldEvents.region_changed` triggers `SaveSystem.save()`
- [ ] Save file at `user://save.tres`
- [ ] Files: `src/common/toki_save.gd`

### US-032: Autosave on combat_finished
As a player, I want progress saved after every battle so a crash doesn't lose XP.

**Acceptance Criteria:**
- [ ] Save flushes after every combat end (win or loss)
- [ ] Files: `src/common/toki_save.gd`, `src/combat/combat.gd`

### US-033: Save on WM_CLOSE_REQUEST
As a player, I want closing the window to persist my state.

**Acceptance Criteria:**
- [ ] Quit-intent triggers save
- [ ] Next launch + Continue restores full state
- [ ] Files: new `src/common/app_root.gd`, `project.godot` notification wiring

### US-034: Continue boots into current_region_id at player_tile
As a player, I want Continue to drop me exactly where I left off.

**Acceptance Criteria:**
- [ ] Continue loads save, builds region, places player on last tile
- [ ] No starter prompt re-fires
- [ ] Files: `src/title.gd`, `src/field/region_builder.gd`, `src/common/toki_save.gd`

### US-035: Settings menu for Music / SFX volume + Text speed
As a player, I want to adjust audio levels and text speed and have those settings persist.

**Acceptance Criteria:**
- [ ] Three sliders: Music, SFX, Text speed
- [ ] Values persist in `user://settings.cfg`
- [ ] Volume applied to AudioServer buses
- [ ] Text speed applied to DialogOverlay TYPEWRITER_CPS
- [ ] Files: new `src/title/settings.tscn` + `settings.gd`, `src/field/ui/dialog_overlay.gd`

### US-036: Loading screen between region warps
As a player, I want a smooth transition with the destination region's name during warps.

**Acceptance Criteria:**
- [ ] Transition covers, hides old region, async builds new, then clears
- [ ] Shows region `name_tp` as label during transition
- [ ] Files: `src/common/screen_transitions/screen_transition.gd`

### US-037: New Game flow with confirm-wipe modal
As a player, I want to be warned before a New Game overwrites my existing save.

**Acceptance Criteria:**
- [ ] New Game with existing save shows "are you sure?" modal
- [ ] Confirming deletes save, then runs starter ceremony
- [ ] Files: `src/title.gd`

### US-038: Pause menu with Resume / Party / Items / Save / Settings / Quit
As a player, I want to pause the game and access common actions.

**Acceptance Criteria:**
- [ ] ESC or start-button opens pause menu
- [ ] Pause halts the scene tree
- [ ] Save button triggers explicit save
- [ ] Quit returns to title
- [ ] Files: new `src/field/ui/pause_menu.tscn` + `pause_menu.gd`

### US-039: Sync current_region_id + player_tile in field
As a developer, I want save state to track player position continuously.

**Acceptance Criteria:**
- [ ] Every `Gamepiece.arrived` updates `TokiSave.player_tile`
- [ ] Region warps update `TokiSave.current_region_id`
- [ ] Files: `src/field/encounter_watcher.gd` or central listener

### US-040: Save format versioning + migration stub
As a developer, I want save files to carry a version so future migrations are possible.

**Acceptance Criteria:**
- [ ] Save tres has `schema_version:int` field
- [ ] Load checks version and warns on mismatch
- [ ] Files: `src/common/toki_save.gd`

### US-041: Credits scene rolls on game clear
As a player, I want a credits sequence after beating the final jan lawa.

**Acceptance Criteria:**
- [ ] Credits roll for 25s after final victory
- [ ] Music fades during roll
- [ ] Returns to title when complete
- [ ] Files: new `src/title/credits.tscn` + `credits.gd`, `CREDITS.md`

### US-042: Mastered words screen
As a player, I want to review the toki pona sentences I've encountered.

**Acceptance Criteria:**
- [ ] Pause → Mastered Words shows scrollable list
- [ ] Each entry shows EN + TP + first-heard region
- [ ] Files: new `src/field/ui/mastered_words.tscn`, `src/common/toki_save.gd`

### US-043: Extend RegionResource with biome + music_track
As a developer, I want regions to declare their biome and music so builders can pick the right tileset and track.

**Acceptance Criteria:**
- [ ] `RegionResource` adds `biome:String` (`town`/`forest`/`water`/`ice`/`cave`/`peak`/`dungeon`) and `music_track:String`
- [ ] Builder reads `biome` to pick tileset
- [ ] Files: `schema/region_resource.gd`, `tools/build_spine.gd`

### US-044: Author nasin_wan biome=forest using forest_summer tileset
As a player, I want nasin_wan to fully use the forest biome.

**Acceptance Criteria:**
- [ ] `nasin_wan.json` declares `biome=forest`
- [ ] Painted entirely from forest_summer atlas
- [ ] Files: `content/spine/regions/nasin_wan.json`, `tools/tile_keys.gd`

### US-045: Author nasin_pi_telo biome=water with custom water atlas
As a player, I want a river-route region with proper water tiles.

**Acceptance Criteria:**
- [ ] River route playable
- [ ] Tall-grass on banks
- [ ] Water tiles impassable
- [ ] Files: `content/spine/regions/nasin_pi_telo.json`, new `content/tilesets/water.tres`

### US-046: Author ma_telo biome=town as second village
As a player, I want a second village hub with NPCs and the first gym.

**Acceptance Criteria:**
- [ ] Village hub contains jan Telo (gym 1), 3 NPCs, 1 shop-sign NPC, 2 warps
- [ ] Files: `content/spine/regions/ma_telo.json`

### US-047: Author ma_lete biome=ice using forest_winter tileset
As a player, I want an ice region painted with frozen-forest tiles.

**Acceptance Criteria:**
- [ ] Region uses forest_winter atlas
- [ ] Walkable paths, no slippery physics (deferred to v0.2.0)
- [ ] Files: `content/spine/regions/ma_lete.json`, `tools/tile_keys.gd`

### US-048: Author nena_sewi biome=peak (upper mountain)
As a player, I want a peak region housing the final gym.

**Acceptance Criteria:**
- [ ] Region playable end-to-end
- [ ] Cliff tiles block traversal
- [ ] Final gym placed
- [ ] Files: `content/spine/regions/nena_sewi.json`

### US-049: Author nena_suli biome=cave using cave tileset
As a player, I want a cave-interior region with appropriate visuals.

**Acceptance Criteria:**
- [ ] Cave interior painted with cave tileset
- [ ] Full lighting (reduced-visibility shader deferred to v0.2.0)
- [ ] Files: `content/spine/regions/nena_suli.json`

### US-050: Verify all 7 region warp graph is connected
As a developer, I want a test that catches any orphaned region in the warp graph.

**Acceptance Criteria:**
- [ ] gdUnit4 test walks warps from start
- [ ] Every region reachable
- [ ] No orphans
- [ ] Files: new `test/integration/test_warp_graph.gd`

### US-051: Author 7 jan lawa set-piece fights
As a player, I want one gym leader fight per region with a real multi-creature party.

**Acceptance Criteria:**
- [ ] Each jan lawa is scripted via FieldTriggerWatcher
- [ ] First fight at ma_telo, last at nena_sewi
- [ ] Each has a multi-creature party scaled to region
- [ ] Files: `content/spine/regions/*.json`

### US-052: Badge award dialog + persist badges[]
As a player, I want a ceremony when I beat a gym leader and a badge that persists.

**Acceptance Criteria:**
- [ ] On jan lawa win, ceremony dialog plays
- [ ] Badge added to `TokiSave.badges`
- [ ] Files: `src/common/toki_save.gd`, `src/combat/combat.gd`

### US-053: Badge display in pause menu (7 slots)
As a player, I want to see my badge collection.

**Acceptance Criteria:**
- [ ] Pause → Badges tab shows 7 slots
- [ ] Earned badges shown with sitelen-pona titles
- [ ] Unearned badges greyed out
- [ ] Files: `src/field/ui/pause_menu.gd`, new `src/field/ui/badges_panel.tscn`

### US-054: Gate next-region warps until matching badge earned
As a player, I want gym progression to gate region access for clear pacing.

**Acceptance Criteria:**
- [ ] `RegionResource.warp.required_badge` field added
- [ ] Stepping on a gated warp without badge shows "you need X badge" dialog
- [ ] Files: `src/field/warp_watcher.gd`, `schema/region_resource.gd`

### US-055: Pokedex screen — 17 species grid
As a player, I want a Pokedex showing my discovery and catch progress.

**Acceptance Criteria:**
- [ ] 17-species grid accessible from pause
- [ ] Silhouette → revealed on seen → full art on caught
- [ ] Each entry shows name_tp + type + flavor text
- [ ] Files: new `src/field/ui/pokedex.tscn` + `pokedex.gd`, `src/common/toki_save.gd`

### US-056: Track bestiary entries (seen/caught) on encounter + catch
As a developer, I want seen/caught flags written when encounters open and catches succeed.

**Acceptance Criteria:**
- [ ] Seen flag set on encounter open
- [ ] Caught flag set on poki success
- [ ] Files: `src/combat/combat.gd`, `src/combat/actions/poki_throw_action.gd`

### US-057: Author multi-beat dialog for all regions (≥ 5 NPCs each)
As a player, I want every region to have NPCs with flavor and story dialog.

**Acceptance Criteria:**
- [ ] ≥ 35 region-NPC dialog nodes total across regions
- [ ] ≥ 2 story beats per region
- [ ] All dialog passes `make validate`
- [ ] Files: `content/spine/regions/*.json`

### US-058: Shop NPC in ma_telo sells poki + kili
As a player, I want to buy items from a shop NPC.

**Acceptance Criteria:**
- [ ] Interacting with shop NPC opens menu of items + price in ma
- [ ] Buying decrements ma and increments inventory
- [ ] Files: new `src/field/ui/shop_panel.tscn` + `shop_panel.gd`, `schema/npc_resource.gd` (role=shop)

### US-059: Add ma (coin) inventory + win-reward currency
As a player, I want to earn coins from battles to spend at shops.

**Acceptance Criteria:**
- [ ] `TokiSave.inventory["ma"]` tracked
- [ ] Each battle grants small coin reward
- [ ] Files: `src/common/toki_save.gd`, `src/combat/combat.gd`

### US-060: Wire Music autoload to region biome → track map
As a player, I want each biome to play its own music.

**Acceptance Criteria:**
- [ ] Forest plays Apple Cider.mp3
- [ ] Town plays Insect Factory.mp3
- [ ] All 4 tracks mapped to 7 biomes
- [ ] Files: `src/common/music/music_player.gd`, new `content/audio/biome_music.tres`

### US-061: Cross-fade music on region change
As a player, I want music to transition smoothly between biomes.

**Acceptance Criteria:**
- [ ] 0.8s cross-fade between tracks on biome change
- [ ] Files: `src/common/music/music_player.gd`

### US-062: Combat music override
As a player, I want a distinct combat track that returns to field music after.

**Acceptance Criteria:**
- [ ] `Combat.setup()` fades out field music + plays combat.mp3
- [ ] Field music restores on combat finish
- [ ] Files: `src/combat/combat.gd`

### US-063: Wire 12 SFX events via AdaptiSound
As a player, I want sound effects on every key action so the game feels reactive.

**Acceptance Criteria:**
- [ ] 12 events wired: footstep, encounter sting, hit, miss, faint, catch-success, catch-fail, menu move, menu select, dialog beep, warp whoosh, gym-victory + badge
- [ ] All play correct .ogg at SFX bus
- [ ] Volumes balanced
- [ ] Files: new `src/common/sfx_player.gd`, `assets/sfx/*`

### US-064: Apply Settings volume sliders to Music + SFX buses
As a player, I want volume sliders to control audio in real time.

**Acceptance Criteria:**
- [ ] Slider movement live-adjusts bus volume in dB
- [ ] Files: `src/title/settings.gd`, `default_bus_layout.tres`

### US-065: Virtual d-pad UI for mobile
As a mobile player, I want an on-screen d-pad to move my character.

**Acceptance Criteria:**
- [ ] 4-button on-screen d-pad
- [ ] Detects touch
- [ ] Hidden on desktop (DisplayServer.touch_screen)
- [ ] Files: new `src/field/ui/virtual_dpad.tscn` + `virtual_dpad.gd`

### US-066: Virtual A/B action buttons for mobile
As a mobile player, I want on-screen interact and back buttons.

**Acceptance Criteria:**
- [ ] Two round buttons bottom-right
- [ ] Route to `interact` and `back` actions
- [ ] Files: `src/field/ui/virtual_dpad.tscn`

### US-067: Enforce ≥ 44dp touch targets in all UI
As a mobile player, I want comfortably tappable buttons everywhere.

**Acceptance Criteria:**
- [ ] All Button/TextureButton nodes have `min_size ≥ 44dp`
- [ ] gdUnit4 test scans scenes and asserts compliance
- [ ] Files: `src/field/ui/*`, `src/combat/ui/*`, `theme/toki_theme.tres`

### US-068: Lock screen rotation to portrait for Android
As a mobile player, I want the game to stay in portrait orientation.

**Acceptance Criteria:**
- [ ] `project.godot` sets `display/window/handheld/orientation="portrait"`
- [ ] Files: `project.godot`

### US-069: Apply text-speed slider to typewriter + combat log
As a player, I want my text-speed setting to affect all text rendering.

**Acceptance Criteria:**
- [ ] Setting affects DialogOverlay CPS
- [ ] Setting affects combat message delay
- [ ] Files: `src/field/ui/dialog_overlay.gd`, `src/combat/ui/ui_combat.gd`

### US-070: Color-contrast AA audit on theme
As a player with low vision, I want text and UI chrome to meet WCAG AA contrast.

**Acceptance Criteria:**
- [ ] All body text + UI chrome passes 4.5:1 contrast on measured samples
- [ ] Files: `theme/toki_theme.tres`

### US-071: Accessible mode toggle
As a player who needs accessibility accommodations, I want a single toggle for larger fonts and reduced motion.

**Acceptance Criteria:**
- [ ] Setting increases body font to 20pt
- [ ] Disables screen shake + damage-pop animation
- [ ] Files: `src/title/settings.gd`, `theme/toki_theme.tres`, `src/combat/ui/effect_labels/ui_damage_label.gd`

### US-072: Web export ARIA landmarks + HTML title + meta description
As a web player, I want the page to be accessible and discoverable.

**Acceptance Criteria:**
- [ ] HTML5 preset uses custom shell with semantic landmarks
- [ ] Title and meta description set
- [ ] Files: `export_presets.cfg`, new `templates/web_shell.html`

### US-073: Tutorial overlay on first boot
As a new player, I want movement, interact, and pause hints on first boot.

**Acceptance Criteria:**
- [ ] First 30s of fresh save show hint arrows + "WASD / [E] / [ESC]"
- [ ] Suppressed after dismissal
- [ ] Files: new `src/field/ui/tutorial_overlay.tscn` + `tutorial_overlay.gd`, `src/common/toki_save.gd`

### US-074: Create test/ dir with gdUnit4 manifest
As a developer, I want a working gdUnit4 setup before writing tests.

**Acceptance Criteria:**
- [ ] `test/gdunit4.cfg` exists
- [ ] Empty suite runs green
- [ ] Files: new `test/gdunit4.cfg`, `test/unit/.gdkeep`

### US-075: Unit test — schemas load all spine JSONs without error
As a developer, I want CI to catch any malformed spine JSON.

**Acceptance Criteria:**
- [ ] `test/unit/test_schema_load.gd` passes for every `.json`
- [ ] Files: new `test/unit/test_schema_load.gd`

### US-076: Unit test — build_spine emits .tres for all content
As a developer, I want CI to verify the builder produces every expected artifact.

**Acceptance Criteria:**
- [ ] `test/unit/test_build_spine.gd` runs builder
- [ ] Verifies every expected `.tres` exists
- [ ] Files: new `test/unit/test_build_spine.gd`

### US-077: Unit test — encounter-roll weighted distribution
As a developer, I want statistical confidence in the encounter table.

**Acceptance Criteria:**
- [ ] 10,000 rolls across 4-species table within 3% of weights
- [ ] Files: new `test/unit/test_encounter_roll.gd`

### US-078: Unit test — type-matchup matrix
As a developer, I want every type pairing verified.

**Acceptance Criteria:**
- [ ] 25 cases (seli/telo/kasi/lete/wawa pairings) each return expected multiplier
- [ ] Files: new `test/unit/test_type_matchups.gd`, `src/combat/elements.gd`

### US-079: Unit test — catch math at full, half, and 1HP
As a developer, I want catch probabilities verified at edge cases.

**Acceptance Criteria:**
- [ ] Full HP catches fail
- [ ] ≤ 5% HP succeeds ≥ 90% with poki_wawa
- [ ] Files: new `test/unit/test_catch_math.gd`

### US-080: Unit test — XP curve + level-up at boundaries
As a developer, I want level-up math verified at curve thresholds.

**Acceptance Criteria:**
- [ ] At L3 floor + 1 XP → L4
- [ ] Moves learned at correct levels
- [ ] Files: new `test/unit/test_xp_curve.gd`

### US-081: Integration test — warp graph connectivity
As a developer, I want CI to catch orphaned regions or self-loops.

**Acceptance Criteria:**
- [ ] Walks warps start → every region
- [ ] No orphans, no self-loops
- [ ] Files: `test/integration/test_warp_graph.gd`

### US-082: Integration test — save round-trip
As a developer, I want CI to verify save/load preserves all state.

**Acceptance Criteria:**
- [ ] Save current state → clear memory → load
- [ ] All fields match original
- [ ] Files: new `test/integration/test_save_round_trip.gd`

### US-083: Integration test — full scripted 7-gym playthrough (headless)
As a developer, I want CI to run a scripted full playthrough end-to-end.

**Acceptance Criteria:**
- [ ] Deterministic RNG: `seed(0xC0FFEE)` before catch/encounter rolls
- [ ] Scripted key events: walk → starter → warp through all 7 regions → defeat all 7 jan lawa → credits
- [ ] At end, all 7 badges present in `TokiSave.badges`
- [ ] Bestiary shows ≥ 20 caught entries
- [ ] Passes in < 180s
- [ ] Files: new `test/integration/test_full_playthrough.gd`

### US-084: Android gradle_build preset enabled + signed
As a release engineer, I want signed AABs produced from CI.

**Acceptance Criteria:**
- [ ] `export_presets.cfg` Android preset has `use_gradle_build=true`, `export_format=1` (AAB)
- [ ] Signing cert paths under `$HOME/.android/release.keystore`
- [ ] Keystore password from GH secret
- [ ] Files: `export_presets.cfg`, `.github/workflows/release.yml`

### US-085: release-please + CD uploads AAB + APK + web zip
As a release engineer, I want every tag to publish all platform artifacts.

**Acceptance Criteria:**
- [ ] `release.yml` exports all platforms on tag push
- [ ] Attaches AAB, APK, web zip to GH release
- [ ] Files: `.github/workflows/release.yml`, `release-please-config.json`

### US-086: Web HTML5 export size audit + compression
As a web player, I want the build to load fast (≤ 30MB compressed).

**Acceptance Criteria:**
- [ ] Final `.wasm` + pck + assets ≤ 30 MB gzip
- [ ] Audit script in `tools/web_size_audit.gd`
- [ ] Files: `export_presets.cfg`, new `tools/web_size_audit.gd`

### US-087: Asset compression pass (ETC2/ASTC + WebP)
As a release engineer, I want texture sizes reduced for mobile + web.

**Acceptance Criteria:**
- [ ] Textures imported with platform-appropriate compression
- [ ] Total size dropped ≥ 30%
- [ ] Files: `*.png.import` across `assets/`

### US-088: Expand CI matrix — unit + integration + schema + web-size gate
As a developer, I want CI to run all jobs in parallel and gate the merge.

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml` runs 4 jobs in parallel
- [ ] All jobs green for merge
- [ ] Files: `.github/workflows/ci.yml`

### US-089: Enforce Conventional Commits via commitlint
As a release engineer, I want non-conformant PR titles to fail CI.

**Acceptance Criteria:**
- [ ] commitlint workflow rejects non-conformant titles
- [ ] Files: new `.github/workflows/commitlint.yml`

### US-090: Write CHANGELOG.md prelude + tag v0.1.0 via release-please
As a release engineer, I want a clean changelog and tagged v0.1.0 release.

**Acceptance Criteria:**
- [ ] release-please PR opens
- [ ] Merge cuts v0.1.0 tag
- [ ] Release notes rendered
- [ ] Files: `CHANGELOG.md`, `release-please-config.json`

### US-091: Smoke-test signed APK on Pixel + iOS Safari web build
As a release engineer, I want manual QA sign-off on both Android AAB and iOS-via-web before promoting v0.1.0.

**Acceptance Criteria:**
- [ ] Manual QA checklist in `docs/RELEASE_QA.md`
- [ ] Android APK sideload on a physical Pixel passes: title → new game → starter → win one fight → save → continue
- [ ] Web build loads + plays on iOS Safari (iPhone) through the same path
- [ ] Sign-off recorded before release promotion
- [ ] Files: `docs/RELEASE_QA.md` (new)

## Functional Requirements

- FR-1: From a fresh save, the player must complete a softlock-free playthrough through all 7 regions and 7 jan lawa fights to credits.
- FR-2: The system must allow catching ≥ 20 distinct creatures across 17 species through normal play.
- FR-3: Combat must visually animate HP, damage numbers (type-matchup colored), misses ("pakala"), victory, and defeat.
- FR-4: All in-game UI must use `theme/toki_theme.tres` and present ≥ 44dp touch targets on a 1080p phone.
- FR-5: The system must autosave on region change, combat finish, and quit.
- FR-6: Continue must restore party, inventory, flags, current_region_id, player_tile, bestiary, and badges exactly as left.
- FR-7: All 7 regions must use biome-correct tilesets and music tracks.
- FR-8: The system must wire ≥ 12 SFX events through an SFX bus controlled by the Settings slider.
- FR-9: The system must produce a signed Android AAB, a desktop binary per platform, and a web HTML5 build ≤ 30MB compressed.
- FR-10: The gdUnit4 suite must contain ≥ 25 tests covering schema, builder, encounter rolls, catch math, type matchups, warp graph, save round-trip, XP curve, and the full 7-gym playthrough.
- FR-11: Every PR must pass `make validate && make build && make test` plus `godot --headless --check-only`.
- FR-12: The Dialogic addon must be entirely absent from the repository by end of US-021.

## Non-Goals

- Multiplayer, trading, proc-gen regions, voice acting, in-game level editor
- iOS native build (web-via-Safari covers iOS)
- Localization beyond EN + toki pona
- System theme detection, per-component overrides, achievements, cloud save
- Reduced-visibility cave shader (v0.2.0)
- Slippery ice-tile physics (v0.2.0)
- Retaining Dialogic as an addon
- Anything outside the 91 enumerated stories

## Technical Considerations

- **Engine:** Godot 4.x; never edit `.uid` or `.godot/`.
- **Schema-driven content:** `content/spine/*.json` → `.tres` via `tools/build_spine.gd`. Never hand-edit `.tres`.
- **Hot serial surfaces:** `combat.gd`, `toki_save.gd`, `region_builder.gd`, `field_events.gd`. Content JSONs parallelize freely.
- **Dialogic full removal (US-021):** Version 2.0-Alpha-16, single call site at `combat.gd:216-229`, no saved timelines. Steps: build VictoryPanel → swap call → delete autoload → remove from enabled[] → drop `[dialogic]` section → `rm -rf addons/dialogic{,_additions}/` → verify grep empty.
- **Save migration:** US-040 introduces `schema_version`; bump on additive changes.
- **Web budget:** US-086/087 may strip `limboai`, `shaky_camera_3d`, `godot_material_footsteps`, `quest_system`, `gloot` from web preset. Dialogic removal (US-021) also helps.
- **Android keystore:** `$HOME/.android/release.keystore`, password via GH secret `ANDROID_KEYSTORE_PASSWORD`.
- **Tatoeba validation:** `make validate` offline in PR CI; `make validate-online` nightly only.
- **US-083 determinism:** `seed(0xC0FFEE)` before catch/encounter rolls.

## Success Metrics

- All 10 DoD criteria from `docs/ROADMAP.md` §1 objectively pass
- gdUnit4 suite ≥ 25 tests, green on every PR
- Web build ≤ 30MB compressed; Android AAB installs + launches on a physical Pixel
- Full 7-gym headless playthrough passes in < 180s
- ≥ 80 validated multi-word TP lines in-game
- `grep -r Dialogic` returns zero hits
- Critical path (US-007 → US-008 → US-009/010 → US-021 → US-031/034 → US-051 → US-083 → US-084 → US-090) completes without rework
- v0.1.0 tag cut by release-please

## Open Questions

None — all prior open questions resolved above.
