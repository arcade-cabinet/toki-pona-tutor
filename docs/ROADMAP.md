---
title: Roadmap
updated: 2026-04-19
status: current
domain: context
---

# poki soweli — Roadmap to Fun, Polished Game

This is the dependency-ordered backlog from "skeleton playable" (today, post-commit 16) to "fun polished 0.1.0 release". Execute top-to-bottom within a phase; later phases assume earlier phases are done. IDs are stable — reference them from PR titles, commit bodies, and `fixes #T*-*` callouts.

---

## 1. Definition of Done

poki soweli 0.1.0 ships when **all** of these are objectively true:

1. **Full playthrough, softlock-free.** From a fresh save, player can: boot → title → new game → `ma_tomo_lili` starter → jan Sewi starter ceremony (pick 1 of 3) → walk `nasin_wan` → catch ≥ 1 wild creature → defeat `nasin_wan` set-piece → reach `ma_telo` → beat jan Telo (gym 1) → progress through all 7 regions → beat all 7 jan lawa → end credits. No dead-ends, no unreachable content.
2. **Catch count reachable.** Player can catch ≥ 20 distinct creatures across 17 species (duplicates allowed) without grinding: normal-play encounter rates + starter gift + story gifts deliver this.
3. **Combat is legible and fair.** HP bars animate, damage numbers pop, type matchups visibly change damage (colored highlight + multiplier label), misses display "pakala", victory screen shows XP gain + level-ups, defeat returns player to last village with HP restored.
4. **UI is themed and mobile-legible.** All in-game UI uses `theme/toki_theme.tres` (amber/emerald/parchment + Nunito/Fredoka). Touch targets ≥ 44×44 dp on 1080p phone. sitelen-pona (nasin-nanpa) renders in creature names, moves, badges.
5. **Saves and resumes.** Quit from anywhere → relaunch → `Continue` restores party, inventory, flags, current region, player tile, caught-log, mastered-words set. Autosave on region change, on battle end, and on quit.
6. **Content volume.** 7 regions playable end-to-end, 17 species + 17 moves + ≥ 6 items (4 exist + `kili` + 1 jan-lawa reward) wired. 7 jan lawa fights as set-pieces. ≥ 80 validated multi-word TP lines in-game (out of 123 available).
7. **Audio live.** 4 tracks cross-fade by region biome; ≥ 12 SFX wired (footstep, encounter sting, hit, miss, faint, catch-success, catch-fail, menu move/select, dialog beep, warp whoosh, gym victory, badge award). Settings slider controls Music + SFX buses.
8. **Exports green.** Android AAB built via gradle_build, signed with release keystore, installable on a Pixel. Web HTML5 ≤ 30 MB compressed, playable at `https://arcade-cabinet.github.io/poki-soweli/`. Linux+Windows+macOS desktop binaries zipped by release.yml.
9. **CI green, test coverage positive.** gdUnit4 suite runs ≥ 25 tests covering: schema load, world build, encounter roll distribution, catch-math edge cases, type-matchup matrix, warp resolution, save round-trip, XP curve, NPC dialog selection by flag state. `make test` exits 0 on every PR.
10. **release-please v0.1.0 tagged** with changelog drawn from Conventional Commits since `pivot/godot` merged to main.

Anything beyond this list is 0.2.0 material.

---

## 2. Phases

Six phases. Each ends with a demoable, mergeable slice. Total task count: **91**.

| # | Phase | Tasks | Outcome |
|---|---|---|---|
| 1 | Playable Vertical Slice | 14 | Fresh game → starter ceremony → first encounter → first warp → return, no softlocks |
| 2 | Combat Polish + Party | 15 | Combat UI themed, HP bars animate, party panel, catch UX, XP/level |
| 3 | Save, Menus, Transitions | 13 | Title screen, pause, settings, continue, autosave, loading screens |
| 4 | Content Breadth | 17 | All 7 regions biome-correct, 7 set-pieces, 7 gyms, badges, Pokedex |
| 5 | Audio, Mobile, Accessibility | 14 | Music per region, SFX wired, virtual joystick, contrast AA, text speed |
| 6 | Release Hardening | 18 | Android AAB signed, web ≤ 30MB, CI matrix, gdUnit4 suite, v0.1.0 cut |

---

## Phase 1 — Playable Vertical Slice

**Goal:** from `git clone && make run`, a new player can boot into `ma_tomo_lili`, talk to jan Sewi, pick a starter, walk to `nasin_wan`, trigger an encounter, win or flee, warp back. No placeholder printlns, no softlocks, no dev keys.

**Parallelization:** T1-04/T1-05/T1-06 are pure content — run in parallel. T1-08 through T1-10 are engine work on the encounter flow and must run serially. T1-12/T1-13 can run parallel with T1-08 onward.

| ID | Title | Deps | Acceptance | Est | Files |
|---|---|---|---|---|---|
| T1-01 | Wire starter-ceremony dialog triggers end-to-end | — | After jan_sewi tutorial dialog closes, `TokiSave.party()` has soweli_seli @ L5, inventory has 3 × poki_lili, flag `starter_chosen=true` persists | S | `src/common/toki_save.gd`, `src/field/ui/dialog_overlay.gd` |
| T1-02 | Let player pick from 3 starters (seli/telo/kasi) | T1-01 | Dialog offers 3 choices; `add_party` dispatches the picked species; untouched species don't appear | M | `schema/dialog_resource.gd`, `content/spine/regions/ma_tomo_lili.json`, `src/field/ui/dialog_overlay.gd` |
| T1-03 | Read-from-party instead of hardcoded DEFAULT_LEAD_SPECIES in encounters | T1-01 | `EncounterWatcher._on_player_arrived` uses `TokiSave.party()[0]` when present; falls back only if party empty | S | `src/field/encounter_watcher.gd` |
| T1-04 | Populate nasin_wan tall-grass encounter table (4 species, weighted) | — | `nasin_wan.json` has tall_grass_keys + ≥ 4 encounters[] entries; encounters fire on walk-through | S | `content/spine/regions/nasin_wan.json` |
| T1-05 | Add tall-grass tile painting to nasin_wan ground layer | — | ≥ 20 tiles tagged `tall_grass` visible in grid; painted with forest_summer tileset foliage | S | `content/spine/regions/nasin_wan.json` |
| T1-06 | Author jan Ike set-piece rival encounter at nasin_wan east edge | T1-04 | Stepping on tile (30,5) triggers a forced non-random battle w/ jan Ike's 1-creature party | M | `content/spine/regions/nasin_wan.json`, `src/field/warp_watcher.gd` (repurpose as trigger watcher) |
| T1-07 | Create `FieldTriggerWatcher` for non-warp scripted tile triggers | T1-06 | Distinct from warp watcher; fires `FieldEvents.combat_triggered` or `dialog_requested` per `region.triggers[]` | M | `src/field/field_trigger_watcher.gd` (new), `src/field/field_events.gd`, `schema/region_resource.gd` |
| T1-08 | Fix combat → field return so player lands back on the tile they left | T1-03 | After win/loss, Combat.hide() emits `CombatEvents.combat_finished`; Field restores input and gameboard resumes at the pre-combat cell | M | `src/combat/combat.gd`, `src/field/field.gd` |
| T1-09 | Apply XP + level-up on combat victory | T1-08 | After victory, `TokiSave.party()[0].xp += enemy.xp_yield`; if crosses curve threshold, level up and recompute HP/moves | M | `src/common/toki_save.gd`, `src/combat/combat.gd`, `schema/species_resource.gd` |
| T1-10 | Apply faint → whiteout → restore party at last visited village | T1-08 | Defeat clears flag, warps player to `TokiSave.current_region_id` spawn, party HP fully restored | M | `src/combat/combat.gd`, `src/field/warp_watcher.gd`, `src/common/toki_save.gd` |
| T1-11 | "Flee" action in combat UI for wild battles | T1-08 | Flee button in action menu; 75% success base; on success ends combat with `is_player_victory=false` but no faint whiteout | S | `src/combat/ui/action_menu/ui_action_menu.gd`, `src/combat/combat.gd` |
| T1-12 | Swap `toki_town_main.tscn` to use forest_summer tileset for nasin_wan | — | Visiting nasin_wan paints from `assets/tilesets/forest_summer/*.png`; ma_tomo_lili stays Kenney town | M | `src/field/region_builder.gd`, new `content/tilesets/forest_summer.tres` |
| T1-13 | Build tileset resource mapping for forest_summer with walkable + tall_grass flags | T1-12 | `TileKeys.resolve("tall_grass")` returns a valid atlas coord from forest_summer when region is forest-biome | M | `tools/tile_keys.gd`, new `content/tilesets/forest_summer.tres` |
| T1-14 | Sanity `make build && make run` playthrough checklist | T1-01…T1-13 | Manual checklist in `docs/SLICE_CHECK.md` executes cleanly start→warp→combat→warp | S | `docs/SLICE_CHECK.md` (new) |

**Phase 1 exit criterion:** open editor, hit Play, complete a full loop in < 3 minutes, no console errors.

---

## Phase 2 — Combat Polish + Party Panel

**Goal:** combat no longer looks like a debug harness. Player can see whose turn it is, how much damage they did, and manage their roster from the field.

**Parallelization:** T2-01…T2-04 (HP bars, damage labels, action-menu theme, battler sprites) are independent and parallelizable across asset-integration sessions. T2-05…T2-07 (victory/defeat/level-up sequence) are serial. T2-08…T2-12 (party panel) is a self-contained work stream that can run in parallel to combat polish.

| ID | Title | Deps | Acceptance | Est | Files |
|---|---|---|---|---|---|
| T2-01 | Theme combat UI with `toki_theme.tres` (panels, fonts) | T1-08 | `ui_combat.theme` overridden by toki theme; all Labels/Buttons/Panels use Nunito/Fredoka + amber/parchment | M | `src/combat/ui/ui_combat.tscn`, `theme/toki_theme.tres` |
| T2-02 | Animate HP bars (tween, 0.4s ease-out) on damage | T2-01 | Damage to HP tweens smoothly; bar color shifts green→amber→red at 50%/20% | S | `src/combat/ui/battler_entry/ui_life_bar.gd` |
| T2-03 | Damage number pop-up labels (float + fade, with type-matchup color) | T2-01 | Super-effective hits flash emerald; resisted hits flash grey; miss shows "pakala" | M | `src/combat/ui/effect_labels/ui_damage_label.gd`, `ui_damage_label.tscn` |
| T2-04 | Swap battler sprites to creature packs (monsters/dragons) per species | — | Each SpeciesResource.sprite_frame maps to an asset in `assets/creatures/`; in-combat sprite is distinct per species | M | `schema/species_resource.gd`, `src/combat/battlers/toki_battler_anim.gd`, `tools/build_spine.gd` |
| T2-05 | Battler hit animation (shake + flash) | T2-02 | On taking damage, battler sprite shakes 0.15s and flashes white | S | `src/combat/battlers/toki_battler_anim.gd` |
| T2-06 | Faint animation (fade + slide down) | T2-05 | When HP reaches 0, sprite drops 40px and fades to 0 alpha over 0.5s | S | `src/combat/battlers/toki_battler_anim.gd` |
| T2-07 | Victory + level-up + XP gain popup sequence | T1-09, T2-02 | End-of-battle shows "+N xp" then "L{old}→L{new}" if leveled, then "new move: X" if learned | M | `src/combat/combat.gd`, new `src/combat/ui/victory_panel.tscn` |
| T2-08 | Defeat screen ("pakala! sina tawa ma tomo.") | T1-10 | Full-screen fade with defeat message + auto-return after 2s | S | new `src/combat/ui/defeat_panel.tscn` |
| T2-09 | Catch UX: poki-throw animation + success/fail dialog | T2-07 | Throwing a poki plays sprite-arc; on success, "you caught {name_tp}" dialog; on fail, wild gets turn | M | `src/combat/actions/poki_throw_action.gd`, new `src/combat/ui/catch_result_panel.tscn` |
| T2-10 | Party Panel scene — P key opens overlay with 6 slots | — | Press P on field → panel shows each creature with sprite, name_tp (sitelen-pona), HP bar, level | M | new `src/field/ui/party_panel.tscn` + `party_panel.gd` |
| T2-11 | Party Panel — tap creature to see moves/XP/type | T2-10 | Tap a slot → detail card with 4 moves + type badge + XP progress bar | M | `src/field/ui/party_panel.gd` |
| T2-12 | Party Panel — reorder (drag lead) | T2-11 | Drag any slot to position 0 to set new lead; persisted via `TokiSave` | S | `src/field/ui/party_panel.gd`, `src/common/toki_save.gd` |
| T2-13 | "Reward" item + XP drop table per species | T1-09 | Each SpeciesResource has `xp_yield` and optional `item_drop_chance`; victory grants them | S | `schema/species_resource.gd`, `content/spine/species/*.json`, `src/combat/combat.gd` |
| T2-14 | Add `kili` healing item usable from party panel out of combat | T2-11, T2-13 | From party panel, tap a fainted/injured creature → use kili → +20 HP, decrements inventory | S | `src/field/ui/party_panel.gd`, `content/spine/items/kili.json` |
| T2-15 | Add "Items" submenu in combat action menu — use poki, kili mid-fight | T2-09, T2-14 | Action menu has Fight / Poki / Item / Flee; Item opens inventory sub-list | M | `src/combat/ui/action_menu/ui_action_menu.gd` + .tscn |

---

## Phase 3 — Save, Menus, Transitions

**Goal:** game boots into a real title screen, saves persist across quits, transitions feel intentional.

**Parallelization:** T3-01 (title) and T3-06 (settings) and T3-09 (pause menu) are independent scenes — parallelize. T3-02→T3-05 (save/load plumbing) must run serially.

| ID | Title | Deps | Acceptance | Est | Files |
|---|---|---|---|---|---|
| T3-01 | Title scene — logo, "new game" / "continue" / "settings" / "quit" | — | `res://src/title.tscn` is new `run/main_scene`; routes to game or settings | M | new `src/title.tscn` + `title.gd`, `project.godot` |
| T3-02 | Hook `SaveSystem.save()` to autosave on region change | — | Every `FieldEvents.region_changed` → `SaveSystem.save()`; file at `user://save.tres` | S | `src/common/toki_save.gd` |
| T3-03 | Autosave on combat_finished | T1-08 | After every battle end, save flushes | S | `src/common/toki_save.gd`, `src/combat/combat.gd` |
| T3-04 | Save on `WM_CLOSE_REQUEST` (quit intent) | T3-02 | Closing window persists; next launch + Continue restores state | S | new `src/common/app_root.gd`, `project.godot` notification wiring |
| T3-05 | "Continue" boots directly into `current_region_id` at `player_tile` | T3-02, T3-01 | Selecting Continue loads save, builds region, places player on last tile, no starter prompt | M | `src/title.gd`, `src/field/region_builder.gd`, `src/common/toki_save.gd` |
| T3-06 | Settings menu — Music / SFX volume + Text speed | — | Three sliders; values persist in `user://settings.cfg`; applied to AudioServer + DialogOverlay TYPEWRITER_CPS | M | new `src/title/settings.tscn` + `settings.gd`, `src/field/ui/dialog_overlay.gd` |
| T3-07 | Loading screen between region warps | — | `Transition.cover → hide old region → async build new → Transition.clear`; shows region name_tp as label | S | `src/common/screen_transitions/screen_transition.gd` |
| T3-08 | New Game flow: confirm wipe if save exists, then starter ceremony | T3-05 | New Game w/ existing save shows "are you sure?" modal before deleting | S | `src/title.gd` |
| T3-09 | Pause menu (ESC / start button) — Resume / Party / Items / Save / Settings / Quit to title | T2-10, T3-06 | Pause pauses tree; Save button triggers explicit save; Quit returns to title | M | new `src/field/ui/pause_menu.tscn` + `pause_menu.gd` |
| T3-10 | In-field `current_region_id` + `player_tile` sync | T3-02 | Every `Gamepiece.arrived` updates `TokiSave.player_tile`; region warps update `current_region_id` | S | `src/field/encounter_watcher.gd` (or central listener) |
| T3-11 | Save format versioning + migration stub | T3-02 | Save tres has `schema_version:int`; load checks version and warns on mismatch | S | `src/common/toki_save.gd` |
| T3-12 | Credits scene (roll on game clear) | T3-01 | After final jan lawa win → credits roll 25s, music fades, returns to title | S | new `src/title/credits.tscn` + `credits.gd`, `CREDITS.md` |
| T3-13 | "Mastered words" screen — list of canonical-TP sentences player has heard | — | Pause → Mastered Words → scrollable list showing EN + TP + first-heard region | M | new `src/field/ui/mastered_words.tscn`, `src/common/toki_save.gd` |

---

## Phase 4 — Content Breadth (Regions, Gyms, Pokedex)

**Goal:** all 7 regions playable with biome-appropriate tilesets, per-region jan lawa fights, a Pokedex screen, and narrative connective tissue.

**Parallelization:** each region (T4-02 … T4-07) is a data-only authoring task and can run in parallel by 6 sub-agents. T4-09 (jan lawa fights) depends on each region's encounter list being authored but is still parallelizable per gym. T4-13 (Pokedex) is an independent UI task.

| ID | Title | Deps | Acceptance | Est | Files |
|---|---|---|---|---|---|
| T4-01 | Extend `RegionResource` with `biome:String` + `music_track:String` | — | Builder reads `biome` (`town`/`forest`/`water`/`ice`/`cave`/`peak`/`dungeon`), picks tileset+music | S | `schema/region_resource.gd`, `tools/build_spine.gd` |
| T4-02 | Author nasin_wan biome=forest using forest_summer tileset | T4-01, T1-13 | nasin_wan paints from forest_summer; old Kenney tiles swapped | M | `content/spine/regions/nasin_wan.json`, `tools/tile_keys.gd` |
| T4-03 | Author nasin_pi_telo biome=water using custom water atlas | T4-01 | River route playable; tall-grass on banks; water tiles impassable | M | `content/spine/regions/nasin_pi_telo.json`, new `content/tilesets/water.tres` |
| T4-04 | Author ma_telo biome=town (second village) + warp in + out | T4-02 | Village hub with jan Telo (gym 1), 3 NPCs, 1 shop-sign NPC, 2 warps | M | `content/spine/regions/ma_telo.json` |
| T4-05 | Author ma_lete biome=ice using forest_winter tileset | T4-01 | Ice region paints frozen forest; slippery-tile stub (optional) | L | `content/spine/regions/ma_lete.json`, `tools/tile_keys.gd` |
| T4-06 | Author nena_sewi biome=peak (upper mountain) | T4-01 | Peak region with final gym, cliff tiles block traversal | L | `content/spine/regions/nena_sewi.json` |
| T4-07 | Author nena_suli biome=cave using cave tileset | T4-01 | Cave region interior; reduced visibility shader (optional) | M | `content/spine/regions/nena_suli.json` |
| T4-08 | Verify all 7 region warp graph is connected & directional | T4-02…T4-07 | gdUnit4 test walks the warp graph from start → every region reachable, no orphans | S | new `test/integration/test_warp_graph.gd` |
| T4-09 | Jan lawa set-piece fights — one per region | T4-02…T4-07, T1-07 | Each jan lawa is a scripted high-level multi-creature fight; first hit at ma_telo → last at nena_sewi | L | `content/spine/regions/*.json` (jan lawa NPC+trigger) |
| T4-10 | Badge award dialog + persist `badges[]` | T4-09 | On jan lawa win, award badge, show ceremony dialog, add to `TokiSave.badges` | S | `src/common/toki_save.gd`, `src/combat/combat.gd` |
| T4-11 | Badge display in pause menu (7 slots, greyed until won) | T4-10, T3-09 | Pause → Badges tab shows earned badges with sitelen-pona titles | S | `src/field/ui/pause_menu.gd`, new `src/field/ui/badges_panel.tscn` |
| T4-12 | Gate next-region warps until matching badge earned | T4-10 | Stepping on a gated warp without badge shows "you need X badge" dialog | S | `src/field/warp_watcher.gd`, `schema/region_resource.gd` (add `warp.required_badge`) |
| T4-13 | Pokedex screen — 17 species grid, silhouette → revealed on seen, full art on caught | T2-10 | Accessible from pause menu; shows name_tp + type + flavor text | M | new `src/field/ui/pokedex.tscn` + `pokedex.gd`, `src/common/toki_save.gd` (seen/caught) |
| T4-14 | Track `bestiary` entries (seen/caught) on encounter + catch | T4-13 | Seen flag set on encounter open; caught flag set on poki success | S | `src/combat/combat.gd`, `src/combat/actions/poki_throw_action.gd` |
| T4-15 | Authored multi-beat dialog per region (≥ 5 NPCs each, flavor + 2 story beats per region) | T4-02…T4-07 | ≥ 35 region-NPC dialog nodes across all regions; all validated by `make validate` | L | `content/spine/regions/*.json` |
| T4-16 | Shop NPC in ma_telo sells poki + kili | T4-04 | Interact with shop NPC → menu: items + price in ma (coins); buy → inventory ++ | M | new `src/field/ui/shop_panel.tscn` + `shop_panel.gd`, `schema/npc_resource.gd` (role=shop) |
| T4-17 | Add `ma` (coin) inventory + win-reward currency | T4-16 | Each battle grants small coin reward; `TokiSave.inventory["ma"]` tracked | S | `src/common/toki_save.gd`, `src/combat/combat.gd` |

---

## Phase 5 — Audio, Mobile, Accessibility

**Goal:** feels good on a phone, readable at small sizes, audible on speakers, passes basic accessibility.

**Parallelization:** T5-01…T5-04 (audio wiring) parallel with T5-06…T5-09 (mobile input). T5-10…T5-13 (accessibility passes) can run after both.

| ID | Title | Deps | Acceptance | Est | Files |
|---|---|---|---|---|---|
| T5-01 | Wire `Music` autoload to region biome → track map | T4-01 | Entering forest plays Apple Cider.mp3; town plays Insect Factory.mp3; etc. 4 tracks mapped to 7 biomes | M | `src/common/music/music_player.gd`, new `content/audio/biome_music.tres` |
| T5-02 | Cross-fade music on region change | T5-01 | 0.8s cross-fade between tracks when biome changes | S | `src/common/music/music_player.gd` |
| T5-03 | Combat music override (battle theme while in combat) | T5-01 | Combat.setup() fades out field music + plays combat.mp3; restores on finish | S | `src/combat/combat.gd` |
| T5-04 | Wire 12 SFX events via AdaptiSound (footstep, hit, miss, faint, catch-succ/fail, menu, dialog, warp, gym-victory, badge) | — | Each event plays correct .ogg at SFX bus; volumes balanced | M | new `src/common/sfx_player.gd`, `assets/sfx/*` |
| T5-05 | Apply Settings volume sliders to Music + SFX buses | T3-06, T5-01, T5-04 | Moving slider live-adjusts bus volume in dB | S | `src/title/settings.gd`, `default_bus_layout.tres` |
| T5-06 | Virtual d-pad UI (4-button on-screen, mobile only) | — | Detects touch; hidden on desktop (via DisplayServer.touch_screen) | M | new `src/field/ui/virtual_dpad.tscn` + `virtual_dpad.gd` |
| T5-07 | Virtual "A/B" action buttons (interact, back) for mobile | T5-06 | Two round buttons bottom-right; route to `interact` and `back` actions | S | `src/field/ui/virtual_dpad.tscn` |
| T5-08 | Enforce ≥ 44dp touch targets in all UI (audit + fix) | T2-10, T3-09 | All Button/TextureButton nodes have min_size ≥ 44dp; CI-side check via gdUnit4 scans scenes | M | `src/field/ui/*`, `src/combat/ui/*`, `theme/toki_theme.tres` |
| T5-09 | Screen-rotation lock to portrait for Android export | — | `project.godot` → `display/window/handheld/orientation="portrait"` | S | `project.godot` |
| T5-10 | Text-speed slider applied to typewriter + combat-log | T3-06 | Setting affects DialogOverlay CPS and combat message delay | S | `src/field/ui/dialog_overlay.gd`, `src/combat/ui/ui_combat.gd` |
| T5-11 | Color-contrast AA audit on theme | T2-01 | All body text / UI chrome passes WCAG AA (4.5:1) on measured samples | S | `theme/toki_theme.tres` |
| T5-12 | "Accessible mode" toggle: larger fonts + reduced motion | T5-11 | Setting increases body font to 20pt, disables screen shake + damage-pop | S | `src/title/settings.gd`, `theme/toki_theme.tres`, `src/combat/ui/effect_labels/ui_damage_label.gd` |
| T5-13 | Web export: ARIA landmarks + HTML title + meta description | — | `export_presets.cfg` HTML5 preset has custom HTML shell with semantic landmarks | S | `export_presets.cfg`, new `templates/web_shell.html` |
| T5-14 | Tutorial overlay on first boot (movement, interact, pause) | T3-01 | On fresh save, first 30s show hint arrows + "WASD / [E] / [ESC]"; suppressed after dismissal | M | new `src/field/ui/tutorial_overlay.tscn` + `tutorial_overlay.gd`, `src/common/toki_save.gd` |

---

## Phase 6 — Release Hardening

**Goal:** CI matrix is green, exports are signed and under budget, gdUnit4 coverage is meaningful, v0.1.0 is tagged and published.

**Parallelization:** testing tasks (T6-01…T6-09) are independent and parallelizable. Export tasks (T6-10…T6-14) serialize on a single `export_presets.cfg` but split cleanly by platform. Release tasks (T6-15…T6-18) must run last.

| ID | Title | Deps | Acceptance | Est | Files |
|---|---|---|---|---|---|
| T6-01 | Create `test/` dir with gdUnit4 manifest | — | `test/gdunit4.cfg` exists; empty suite runs green | S | new `test/gdunit4.cfg`, `test/unit/.gdkeep` |
| T6-02 | Unit test: schemas load all 45 spine JSONs without error | T6-01 | `test/unit/test_schema_load.gd` passes for every .json | S | new `test/unit/test_schema_load.gd` |
| T6-03 | Unit test: build_spine emits `.tres` for all content | T6-01 | `test/unit/test_build_spine.gd` runs builder, verifies every expected file exists | S | new `test/unit/test_build_spine.gd` |
| T6-04 | Unit test: encounter-roll weighted distribution | T1-04 | 10,000 rolls across 4-species table within 3% of weights | S | new `test/unit/test_encounter_roll.gd` |
| T6-05 | Unit test: type-matchup matrix (seli/telo/kasi/lete/wawa) | T2-03 | Each matchup returns expected multiplier; 25 cases | S | new `test/unit/test_type_matchups.gd`, `src/combat/elements.gd` |
| T6-06 | Unit test: catch-math at full, half, and 1HP | T2-09 | Full HP fails, ≤ 5% HP succeeds ≥ 90% with poki_wawa | S | new `test/unit/test_catch_math.gd` |
| T6-07 | Unit test: XP curve + level-up at boundaries | T1-09 | XP at L3 floor → +1 XP → L4, moves learned correct | S | new `test/unit/test_xp_curve.gd` |
| T6-08 | Integration test: warp graph connectivity | T4-08 | Walks warps start→every region; no orphans, no self-loops | S | `test/integration/test_warp_graph.gd` |
| T6-09 | Integration test: save round-trip | T3-02 | Save current state → clear memory → load → all fields match | M | new `test/integration/test_save_round_trip.gd` |
| T6-10 | Integration test: full scripted playthrough (headless walk) | all | Injects key events: walk → starter → warp → encounter → win → gym1 win; passes in < 90s | L | new `test/integration/test_full_playthrough.gd` |
| T6-11 | Android gradle_build preset: enable + sign with release keystore | — | `export_presets.cfg` preset 1 has `use_gradle_build=true`, `export_format=1` (AAB), signing cert paths under `$HOME/.android/release.keystore` | M | `export_presets.cfg`, `.github/workflows/release.yml` |
| T6-12 | Release-please + CD: upload AAB + APK + web zip to GH release | T6-11 | `release.yml` exports all platforms on tag push; attaches artifacts | M | `.github/workflows/release.yml`, `release-please-config.json` |
| T6-13 | Web HTML5 export size audit + compression | — | Final `.wasm` + pck + assets ≤ 30 MB gzip; audit script in `tools/web_size_audit.gd` | M | `export_presets.cfg`, new `tools/web_size_audit.gd` |
| T6-14 | Asset compression pass (ETC2/ASTC for mobile, WebP for web) | T6-13 | Textures imported with compression; size dropped ≥ 30% | M | `*.png.import` across `assets/` |
| T6-15 | Expand CI matrix: unit + integration + schema + web-size gate | T6-01…T6-13 | `.github/workflows/ci.yml` runs all 4 jobs in parallel; all green | S | `.github/workflows/ci.yml` |
| T6-16 | Enforce Conventional Commits via `commitlint` hook or CI check | — | Non-conformant PR titles fail CI | S | new `.github/workflows/commitlint.yml` |
| T6-17 | Write `CHANGELOG.md` prelude + tag v0.1.0 via release-please | T6-15 | release-please PR opens; merge → v0.1.0 tag cut; release notes rendered | S | `CHANGELOG.md`, `release-please-config.json` |
| T6-18 | Smoke-test signed APK on physical Pixel + iOS web browser | T6-11 | Manual QA checklist in `docs/RELEASE_QA.md`; signed-off before release promotion | M | `docs/RELEASE_QA.md` (new) |

---

## 3. Parallelization Quick Reference

- **Content authoring agents (regions, dialog, species curves)**: T1-04/05, T4-02…T4-07, T4-15 — all spine JSON-only, independent. Worktree-per-agent pattern.
- **UI work streams (combat vs party vs pause)**: T2-01…T2-07 serial; T2-10…T2-12 separate stream; T3-01/T3-06/T3-09 separate stream. Three parallel UI agents possible in phases 2–3.
- **Engine-serial**: anything touching `combat.gd`, `toki_save.gd`, `region_builder.gd`, or `field_events.gd` must run serially within a phase because these are hot shared surfaces.
- **Testing**: T6-01…T6-09 all parallel; one agent per test file.

---

## 4. Risk List

1. **Dialogic 4.6 incompatibility** — `addons/dialogic` still warns on Godot 4.6 (subsystem_text Dictionary). **Mitigation:** custom `DialogOverlay.tscn` already in-tree; combat.gd still calls `Dialogic.start_timeline` for victory/defeat at `combat.gd:226-229`. **Action:** in T2-07, replace Dialogic victory timeline with our own `victory_panel.tscn`. Delete Dialogic autoload once nothing references it.
2. **Android keystore & signing** — release AAB requires a keystore that is not yet in the repo. **Mitigation:** generate `release.keystore` locally, store in `$HOME/.android/`, add path to repo `.gitignore`; keystore password via GH secret `ANDROID_KEYSTORE_PASSWORD`; document in T6-11.
3. **Web export > 30MB** — Godot HTML5 baseline is ~25MB wasm + project. Adding our 230 art assets can push over budget. **Mitigation:** T6-13 audit, T6-14 compression (WebP + ETC2), lazy-load region assets, strip unused addons from web preset (limboai, shaky_camera_3d, godot_material_footsteps likely unneeded).
4. **Tatoeba API rate limits in CI** — `make validate-online` in CI can rate-limit. **Mitigation:** cache is authoritative, CI runs `--offline`; only author-time editor calls hit network; `make validate` offline in PR CI, `make validate-online` nightly.
5. **gdUnit4 headless flakes** — scene-loading tests can flake on first boot (import lag). **Mitigation:** `make import` in CI before tests; cache `.godot/` between runs; allow 2 retries on test steps per ashworth-manor precedent.
6. **RegionBuilder `reload_current_scene()` in WarpWatcher** — reloads the whole main scene, losing combat state and pausing autoloads. **Mitigation:** T3-07 refactor warp to hot-swap just the Field subtree, not reload scene. Track as T6-pre-work if savestate round-trip fails.
7. **Kenney Tiny Town tileset mismatch for forest/cave/ice regions** — currently all regions use Kenney Tiny Town atlas. Forest_summer/winter, cave, dungeon_16 tilesets exist as PNG atlases but have no TileSet.tres authored. **Mitigation:** T1-13, T4-02…T4-07 — one tilesheet-importer pass per biome using `kenny_spritesheet_importer` addon.
8. **Save schema churn during Phase 2–4** — adding `bestiary`, `badges`, `ma` coins grows save payload and will break old saves. **Mitigation:** T3-11 — version the save; bump `schema_version` on every additive change; migration function handles upgrades; delete-save escape hatch in settings.
9. **Dynamic `TokiArenaBuilder.pack()` vs scene-inheritance conflicts** — the arena is packed at runtime, not authored. Any future editor-time battler hooks break. **Mitigation:** keep arena construction dynamic; if editor-time design of arena becomes needed, introduce `arena_template.tscn` base and overlay battlers.
10. **Mobile input vs gridstep movement** — current player controller is grid-snapped with discrete inputs; thumbstick expects analog. **Mitigation:** T5-06 virtual d-pad emits discrete `ui_left/right/up/down` presses on tap-and-hold, matching keyboard semantics. No analog needed.

---

## Completion Forecast

Aggressive estimate with 1 engineer full-time + 2 content agents:

- Phase 1: 1 week
- Phase 2: 1.5 weeks
- Phase 3: 1 week
- Phase 4: 2 weeks (content-heavy, parallelizable)
- Phase 5: 1 week
- Phase 6: 1 week

**v0.1.0 ETA: ~7.5 weeks of focused work.**

Critical path: T1-07 (trigger watcher) → T1-08 (field↔combat return) → T1-09/10 (XP + faint) → T2-07 (victory) → T3-02/05 (autosave/continue) → T4-09 (gym fights) → T6-10 (full playthrough test) → T6-11 (signed AAB) → T6-17 (tag).
