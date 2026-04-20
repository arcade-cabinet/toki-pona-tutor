---
title: Roadmap
updated: 2026-04-20
status: current
domain: product
---

# poki soweli — Roadmap to Fun, Polished Game

Dependency-ordered backlog from "pivot landed, 7 beats walkable" (current state on `feat/rpgjs-v5-pivot`) to "fun polished v0.2.0 release". Execute top-to-bottom within a phase; later phases assume earlier phases are done. IDs are stable — reference them from PR titles, commit bodies, and `fixes #T*-*` callouts.

This doc is **ported from the Godot-era ROADMAP** (commit `3177af2`, 91 tasks). Every task that survived the pivot is preserved with its Godot ID so historical references still resolve; file-path pointers migrated to the RPG.js v5 / Capacitor stack.

**Versioning note:** the Godot-era tag `v0.1.0`..`v0.1.3` on `main` does not apply to this branch. The post-pivot first release will be cut as `v0.2.0` via release-please once Phase 1 completes.

---

## 1. Definition of Done

poki soweli v0.2.0 ships when **all** of these are objectively true:

1. **Full playthrough, softlock-free.** From a fresh install: boot → title → new game → `ma_tomo_lili` starter → jan Sewi ceremony (pick 1 of 3) → walk `nasin_wan` → catch ≥ 1 wild creature → defeat jan Ike rival → reach `nena_sewi` → beat jan Wawa → progress through all 7 beats → beat green dragon → end credits. No dead-ends, no unreachable content.
2. **Catch count reachable.** Player can catch ≥ 20 distinct wild creatures across the 17-species roster without grinding: normal encounter rates + starter gift + story gifts deliver this.
3. **Combat is legible and fair.** Action-battle HP indicators, damage flash, type matchups visibly change damage (colored highlight + multiplier label), victory sequence shows XP gain + level-up + new-move toasts, defeat returns player to last village with party preserved at full HP.
4. **UI is themed and mobile-legible.** All pause/inventory/save overlays use a consistent toki-pona theme (amber/emerald/parchment + Fredoka font). Touch targets ≥ 44×44 dp on a 1080p phone. sitelen-pona glyphs (via UCSUR codepoints from `dictionary.json`) render in creature names, moves, badges.
5. **Saves and resumes.** Quit from anywhere → relaunch → Continue restores party, inventory, flags, current map, player tile, encounter_log, mastered-words set. Autosave on map change, combat end, and quit — via `CapacitorSaveStorageStrategy`.
6. **Content volume.** All 7 beats playable end-to-end, 17 species + 17 moves + ≥ 6 items (poki_lili + kili + badge rewards + ma coin) wired. 4 gym fights + 1 rival + 1 final boss as set-pieces. ≥ 80 validated multi-word TP lines in-game.
7. **Audio live.** 4 tracks cross-fade by biome (town / forest / water / ice / peak / endgame / combat); ≥ 12 SFX wired (footstep, encounter sting, hit, miss, faint, catch-success, catch-fail, menu move/select, dialog beep, warp whoosh, gym victory, badge award). Settings slider controls Music + SFX buses.
8. **Exports green.** Android debug APK produced on every PR (`ci.yml`); signed release APK produced on every release-please tag (`release.yml`); web HTML5 ≤ 10 MB gzip, deployed to GitHub Pages via `cd.yml`.
9. **CI green, test coverage positive.** Vitest suite runs ≥ 25 tests covering: schema load, world.json build, encounter roll distribution, catch-math edge cases, type-matchup matrix, warp resolution, save round-trip, XP curve, dialog selection by flag state. `pnpm test:build-time` + `pnpm test:e2e` both green on every PR.
10. **release-please v0.2.0 tagged** with CHANGELOG drawn from Conventional Commits since `main` last tagged.

Anything beyond this list is v0.3.0 material.

---

## 2. Phases

Six phases. Each ends with a demoable, mergeable slice. Total task count: **94** (91 Godot-era + 3 RPG.js-v5-specific additions).

| # | Phase | Tasks | Outcome | Status |
|---|-------|-------|---------|--------|
| 1 | Playable Vertical Slice | 14 | Fresh game → starter ceremony → first encounter → first warp → return, no softlocks | **DONE** via V1-V14 |
| 2 | Combat Polish + Party | 15 | Combat UI themed, HP bars animate, party panel, catch UX, XP/level | 2/15 done (catch UX + multi-phase AI) |
| 3 | Save, Menus, Transitions | 13 | Title screen, pause, settings, continue, autosave, loading screens | 3/13 done (vocab pause + inventory pause + respawn) |
| 4 | Content Breadth | 17 | All 7 regions biome-correct, 7 set-pieces, 7 gyms, badges, Pokedex | 10/17 done (all 7 maps exist but grass placeholder; gyms + badges wired) |
| 5 | Audio, Mobile, Accessibility | 14 | Music per region, SFX wired, virtual joystick, contrast AA, text speed | 0/14 |
| 6 | Release Hardening | 18 | Signed release APK, web ≤ 10MB, CI matrix, Vitest suite, v0.2.0 cut | 5/18 done (ci + release + cd wiring) |

---

## Phase 1 — Playable Vertical Slice ✅ DONE

Completed via the RPG.js v5 pivot (commits `f8bd925` → `1aa8a37`, PR #66 commits 1-20). All 14 Godot-era tasks either completed as-specified or became no-ops under v5 (e.g., combat↔field return is handled by `@rpgjs/action-battle` instead of a custom `FieldTriggerWatcher`).

| Godot ID | Title | v5 commit |
|----------|-------|-----------|
| T1-01 | Starter ceremony dialog triggers end-to-end | `72568a5` V2 |
| T1-02 | Pick from 3 starters (seli/telo/kasi) | `72568a5` V2 |
| T1-03 | Read-from-party (not hardcoded) in encounters | `657ec52` V4 + `90342f1` V19 |
| T1-04 | Populate nasin_wan encounter table | `684b458` V3a (spec-authored) |
| T1-05 | Tall-grass tile painting in nasin_wan | spec `nasin_wan.ts` Encounters layer |
| T1-06 | jan Ike set-piece rival | `9e09d77` V7 |
| T1-07 | FieldTriggerWatcher for non-warp triggers | RPG.js v5 `onInShape` — free |
| T1-08 | Combat → field return | RPG.js v5 action-battle — free |
| T1-09 | XP + level-up on victory | **DEFERRED to Phase 2 T2-07** — combat grants flag + beat advance only |
| T1-10 | Faint → whiteout → restore at last village | `a56a98d` V9 |
| T1-11 | Flee action in combat | `657ec52` V4 (for wild) — action-battle fights are melee real-time, no flee |
| T1-12 | Forest tileset for nasin_wan | placeholder grass — deferred to Phase 4 T4-02 |
| T1-13 | Tileset mapping w/ walkable + tall_grass flags | Stage 0 palette — `684b458` V3a |
| T1-14 | Sanity playthrough checklist | `docs/ROADMAP.md` (this file) supersedes |

**Phase 1 exit:** ✅ `pnpm dev` boots, 7 beats walkable, no softlocks observed.

---

## Phase 2 — Combat Polish + Party Panel

**Goal:** combat no longer looks like a debug harness. Player can see whose turn it is, how much damage they did, and manage their roster from the field.

**Parallelization:** T2-01…T2-04 (HP bars, damage labels, theme, battler sprites) are independent and parallelizable. T2-05…T2-07 serial. T2-08…T2-12 (party panel) is a self-contained work stream that can run in parallel to combat polish.

| ID | Title | Status | Deps | Acceptance | Files (v5) |
|----|-------|--------|------|------------|------------|
| T2-01 | Theme combat UI (panels, fonts) | | T1-08 | Toki-pona theme overrides action-battle action-bar Vue component; amber/parchment chrome | `src/config/config.client.ts` (theme tokens), Vue/CSS overrides |
| T2-02 | Animate HP bars (tween, color shift) | | T2-01 | Damage to HP tweens smoothly; bar color shifts green→amber→red at 50%/20% | client-side Vue component |
| T2-03 | Damage-number pop-up labels | | T2-01 | Super-effective flash emerald; resisted flash grey; miss shows "pakala" | client-side overlay |
| T2-04 | Swap battler sprites to creature packs per species | | — | Each `species.sprite_frame` maps to `public/assets/creatures/<id>.png`; in-combat distinct per species | `config.client.ts` spritesheets[] |
| T2-05 | Battler hit animation (shake + flash) | | T2-02 | On damage, sprite shakes 0.15s and flashes white | client sprite layer |
| T2-06 | Faint animation (fade + slide) | | T2-05 | At HP 0, sprite drops 40px and fades over 0.5s | client sprite layer |
| T2-07 | Victory + level-up + XP gain sequence | | T1-09→T2-07, T2-02 | End-of-battle shows "+N xp" → "L{old}→L{new}" → "new move: X" if learned | `src/modules/main/gym-leader.ts` onDefeated + new overlay |
| T2-08 | Defeat screen ("pakala! sina tawa ma tomo.") | ✓ partial | T1-10 | Full-screen fade + auto-return | `src/modules/main/respawn.ts` (text done; fade animation deferred) |
| T2-09 | Catch UX: poki-throw animation + dialog | ✓ partial | T2-07 | Sprite-arc on catch; success/fail dialog | `src/modules/main/encounter.ts` (dialog done; animation deferred) |
| T2-10 | Party Panel — open from field | | — | Press inventory action → panel shows 6 slots with sprite, name_tp, HP bar, level | extend `src/modules/main/inventory-screen.ts` to use GUI |
| T2-11 | Party Panel — detail card (moves/XP/type) | | T2-10 | Tap slot → 4 moves + type badge + XP progress | same |
| T2-12 | Party Panel — reorder (drag lead to slot 0) | | T2-11 | Drag any slot to position 0 = new lead; persisted via `preferences.set(KEYS.partySlot, ...)` | `queries.ts` + screen |
| T2-13 | Item drops per species | | T1-09→T2-07 | Each `species.xp_yield` + optional `item_drop_chance`; victory grants | `spine/species/*.json`, gym-leader onDefeated |
| T2-14 | `kili` healing item usable from party panel | | T2-11, T2-13 | Inventory→kili→+20 HP on selected creature, decrements count | `inventory-screen.ts`, `spine/items/kili.json` |
| T2-15 | "Items" submenu in combat action menu | | T2-09, T2-14 | Fight / Poki / Item / Flee; Item opens inventory sublist | `src/modules/main/encounter.ts` + action-battle UI |

---

## Phase 3 — Save, Menus, Transitions

**Goal:** real title screen, saves persist, transitions feel intentional.

**Parallelization:** T3-01 (title) + T3-06 (settings) + T3-09 (pause) independent — parallelize. T3-02→T3-05 (save/load plumbing) serial.

| ID | Title | Status | Deps | Acceptance | Files (v5) |
|----|-------|--------|------|------------|------------|
| T3-01 | Title scene — logo, "new game" / "continue" / "settings" / "quit" | | — | Shown on first load; routes to game or settings | new client entry point / Vue component |
| T3-02 | Autosave on map change | | — | Every `changeMap` triggers `CapacitorSaveStorageStrategy.save()` | `src/modules/main/warp.ts` + respawn.ts hooks |
| T3-03 | Autosave on combat end | ✓ partial | T1-08 | Gym-leader/rival onDefeated already persists flags + journeyBeat; extend to call save API | `gym-leader.ts`, `green-dragon.ts`, `jan-ike.ts` |
| T3-04 | Save on quit intent (beforeunload / resume) | | T3-02 | Browser unload / Capacitor app.backgrounded → save flushes | new `src/platform/persistence/autosave.ts` |
| T3-05 | "Continue" boots into current map at player tile | | T3-02, T3-01 | Continue loads save → changeMap to `KEYS.currentMapId` at persisted coords | `src/modules/main/player.ts` onConnected |
| T3-06 | Settings menu — Music / SFX / Text speed | | — | Three sliders persist via `@capacitor/preferences`; applied at runtime | new Vue screen + preferences.ts keys |
| T3-07 | Loading screen between map warps | | — | Fade cover → changeMap → uncover; label shows destination `map_id` in sitelen-pona | `warp.ts` hook + overlay |
| T3-08 | New Game flow: confirm wipe if save exists | | T3-05 | Modal "are you sure?" before clearing save | title screen |
| T3-09 | Pause menu — Resume / Party / Items / Save / Settings / Quit to title | ✓ partial | T2-10, T3-06 | `escape` → vocab, `inventory` → inventory screen; add save + settings + quit | `src/modules/main/player.ts`, new overlay |
| T3-10 | Sync `currentMapId` + `player_tile` on every move | ✓ partial | T3-02 | `changeMap` already writes `KEYS.currentMapId`; extend to periodic tile snapshot | warp.ts + onInput tick |
| T3-11 | Save schema versioning + migration | ✓ | T3-02 | `PRAGMA user_version` tracked; `migrateSchema()` handles upgrades | `database.ts` — done in V19 `90342f1` |
| T3-12 | Credits scene on game clear | | T3-01 | After green-dragon win → 25s credit roll → returns to title | new overlay |
| T3-13 | "Mastered words" screen | ✓ | — | Pause → vocab shows all mastered TP words with sightings count | `src/modules/main/vocabulary-screen.ts` — done in V5 `bad5a16` |

---

## Phase 4 — Content Breadth

**Goal:** all 7 beats playable with biome-appropriate tilesets, gym set-pieces, badge UX, Pokedex.

**Parallelization:** each map spec (T4-02…T4-07) is data-only — run in parallel by sub-agents using worktree-per-agent. T4-09 (gyms) parallel per gym. T4-13 (Pokedex) independent UI stream.

| ID | Title | Status | Deps | Acceptance | Files (v5) |
|----|-------|--------|------|------------|------------|
| T4-01 | Tag each map spec with `biome` + `music_track` | | — | `MapSpec` schema grows biome; author:build emits into `.tmj` | `scripts/map-authoring/lib/types.ts`, all specs |
| T4-02 | nasin_wan biome=forest with forest_summer tileset | | T4-01 | nasin_wan paints from Fan-tasy forest pack, not placeholder grass | `scripts/map-authoring/specs/nasin_wan.ts`, palette |
| T4-03 | nasin_pi_telo biome=water with water tileset | | T4-01 | River route playable; water tiles impassable | `specs/nasin_pi_telo.ts` |
| T4-04 | ma_telo biome=town (lake village) full paint | | T4-02 | Stone island in lake; 4 NPCs + shop + warps | `specs/ma_telo.ts` |
| T4-05 | ma_lete biome=ice with forest_winter tileset | | T4-01 | Frozen biome; slippery-tile stub optional | `specs/ma_lete.ts` |
| T4-06 | nena_sewi biome=peak (mountain) | | T4-01 | Peak region; cliff tiles block traversal | `specs/nena_sewi.ts` |
| T4-07 | nena_suli biome=cave | | T4-01 | Cave interior; reduced visibility shader optional | `specs/nena_suli.ts` |
| T4-08 | Warp graph connectivity test | | T4-02…T4-07 | Vitest walks warp graph from ma_tomo_lili → every map reachable | new `tests/build-time/warp-graph.test.ts` |
| T4-09 | Gym set-piece fights (one per region) | ✓ | T4-02…T4-07, T1-07 | Scripted high-level multi-creature gym leader at each region | `server.ts` + `gym-leader.ts` — done via V8+V11+V12+V13+V16 |
| T4-10 | Badge award dialog + persist `badges[]` | ✓ | T4-09 | On gym win, award badge, show ceremony, persist | `gym-leader.ts` — done |
| T4-11 | Badge display in pause menu | ✓ | T4-10, T3-09 | Pause → Badges panel with sitelen-pona titles | `inventory-screen.ts` — done in V17 |
| T4-12 | Gate next-region warps until badge earned | ✓ | T4-10 | Stepping gated warp w/o badge shows gate dialog | `warp.ts` `requiredFlag` — done |
| T4-13 | Pokedex screen — 17-species grid with seen/caught | | T2-10 | Pause → Pokedex grid; silhouette until seen; full until caught | new `src/modules/main/pokedex-screen.ts` |
| T4-14 | Track `bestiary` seen/caught on encounter + catch | | T4-13 | Seen flag on encounter open; caught flag on successful poki | `encounter.ts` + new SQLite table |
| T4-15 | Authored multi-beat dialog per region (≥5 NPCs per region) | ✓ partial | T4-02…T4-07 | ≥35 region NPC dialog nodes | `spine/dialog/*.json` — 2-4 per region done, add 3 more per region |
| T4-16 | Shop NPC in ma_telo sells poki + kili | | T4-04 | Interact → menu: items + `ma` price; buy → inventory ++ | new `src/modules/main/shop.ts` |
| T4-17 | `ma` coin inventory + battle reward | | T4-16 | Each battle grants small coin reward; tracked in `inventory_items` | `database.ts` schema + gym-leader/encounter |

---

## Phase 5 — Audio, Mobile, Accessibility

**Goal:** feels good on phone, readable small, audible on speakers, passes basic accessibility.

**Parallelization:** T5-01…T5-05 (audio) parallel with T5-06…T5-09 (mobile). T5-10…T5-13 (accessibility) after both.

| ID | Title | Status | Deps | Acceptance | Files (v5) |
|----|-------|--------|------|------------|------------|
| T5-01 | Biome → music track map | | T4-01 | Entering forest plays track X; town plays Y; 4 tracks mapped to 7 biomes | new `src/modules/main/music.ts` + `public/assets/audio/` |
| T5-02 | Cross-fade music on map change | | T5-01 | 0.8s cross-fade when biome changes | same |
| T5-03 | Combat music override | | T5-01 | Gym-leader fight plays combat.mp3; restores field music on end | gym-leader.ts hook |
| T5-04 | Wire 12 SFX events | | — | Each event plays .ogg at SFX bus; volumes balanced | new `sfx.ts` + `public/assets/audio/sfx/` |
| T5-05 | Apply Settings volume sliders | | T3-06, T5-01, T5-04 | Slider live-adjusts bus volume | `settings.ts` |
| T5-06 | Virtual d-pad for mobile | | — | Detected via `Capacitor.getPlatform() !== 'web'` or touch-screen; hidden otherwise | new overlay |
| T5-07 | Virtual A/B action buttons | | T5-06 | Two round buttons bottom-right; route to action/back | same |
| T5-08 | ≥44dp touch targets audit | | T2-10, T3-09 | All Button/TextureButton `min_size ≥ 44dp`; lint rule | CSS audit |
| T5-09 | Portrait-lock for Android | | — | `capacitor.config.ts` or manifest sets portrait | `capacitor.config.ts` |
| T5-10 | Text-speed slider applied to typewriter + combat log | | T3-06 | Setting affects dialog CPS | `dialog.ts` + combat UI |
| T5-11 | Color-contrast AA audit | | T2-01 | All body text passes WCAG AA (4.5:1) on measured samples | theme audit |
| T5-12 | "Accessible mode" toggle — larger fonts + reduced motion | | T5-11 | Setting increases font to 20pt, disables screen shake + damage pop | settings + theme |
| T5-13 | Web ARIA landmarks + meta | | — | `index.html` gets semantic landmarks + title + description | `index.html` |
| T5-14 | Tutorial overlay on first boot (movement, interact, pause) | | T3-01 | Fresh save shows 30s hint arrows + key labels; dismissible | new overlay + preferences flag |

---

## Phase 6 — Release Hardening

**Goal:** CI matrix green, exports signed + under budget, Vitest coverage meaningful, v0.2.0 tagged.

**Parallelization:** testing (T6-01…T6-09) parallel. Exports (T6-10…T6-14) serialize on shared config. Release (T6-15…T6-18) last.

| ID | Title | Status | Deps | Acceptance | Files (v5) |
|----|-------|--------|------|------------|------------|
| T6-01 | `tests/build-time/` Vitest manifest | ✓ | — | `vitest.config.build-time.ts` exists; empty suite runs green | done pre-pivot |
| T6-02 | Unit test: schemas load all spine JSONs | | T6-01 | Zod validates every `spine/**/*.json` without error | `tests/build-time/schema-load.test.ts` |
| T6-03 | Unit test: build-spine emits expected shape | | T6-01 | Builder writes every key into `world.json` with correct type | `tests/build-time/build-spine.test.ts` |
| T6-04 | Unit test: encounter-roll weighted distribution | | T1-04 | 10,000 rolls across 4-species table within 3% of weights | `tests/build-time/encounter-roll.test.ts` |
| T6-05 | Unit test: type-matchup matrix (seli/telo/kasi/lete/wawa) | | T2-03 | Each of 25 matchups returns expected multiplier | `tests/build-time/type-matchups.test.ts` |
| T6-06 | Unit test: catch-math at full, half, 1HP | | T2-09 | Full HP fails; low HP with poki_wawa succeeds ≥90% | `tests/build-time/catch-math.test.ts` |
| T6-07 | Unit test: XP curve + level-up boundaries | | T1-09→T2-07 | Pre-threshold XP → +1 → L-up; moves learned | `tests/build-time/xp-curve.test.ts` |
| T6-08 | Integration test: warp graph connectivity | | T4-08 | Full walk start→every map; no orphans, no self-loops | `tests/build-time/warp-graph.test.ts` |
| T6-09 | Integration test: save round-trip | | T3-02 | Save state → clear memory → load → all fields match | `tests/build-time/save-round-trip.test.ts` |
| T6-10 | E2E scripted playthrough (headless walk) | | all | Injects inputs: walk → starter → warp → encounter → gym-win; completes < 90s | `tests/e2e/playthrough.test.ts` (needs RPG.js v5 inspector) |
| T6-11 | Android release APK: signed with release keystore | | — | `release.yml` uses `secrets.ANDROID_KEYSTORE_BASE64` + password; produces signed `.apk` (later `.aab`) | `release.yml`, setup |
| T6-12 | Release-please: upload web+APK to GH release | ✓ | T6-11 | `release.yml` exports web tar.gz + APK on tag; attaches artifacts | `release.yml` — done pattern via V48 (STD-workflows) |
| T6-13 | Web bundle size audit | | — | `dist/` gzip ≤ 10 MB; CI gate in `ci.yml` | `ci.yml` + `tools/web-size-audit.mjs` |
| T6-14 | Asset compression pass (WebP for web, downscale where possible) | | T6-13 | Textures compressed; size dropped ≥30% | vite plugin or build script |
| T6-15 | Expand CI matrix | ✓ partial | T6-01…T6-13 | `ci.yml` runs validate + typecheck + build + APK in parallel | done via V48 |
| T6-16 | Commitlint hook / CI check for Conventional Commits | | — | Non-conformant PR titles fail CI | new `.github/workflows/commitlint.yml` or hook |
| T6-17 | Write CHANGELOG prelude + tag v0.2.0 via release-please | | T6-15 | release-please PR opens; merge → v0.2.0 tag + release notes | `CHANGELOG.md`, release-please-config.json |
| T6-18 | Smoke-test signed APK on physical device + iOS browser | | T6-11 | Manual QA checklist in `docs/RELEASE_QA.md`; signed-off | `docs/RELEASE_QA.md` (new) |

---

## RPG.js v5 — additional tasks

Three items the Godot roadmap couldn't anticipate. All NEW.

| ID | Title | Status | Acceptance |
|----|-------|--------|------------|
| V5-01 | RPG.js v5 inspector surface for e2e | | Patch or request upstream to expose `window.__rpgjs__.client.player / currentMap / dialogOpen`. Unblocks T6-10 and all `it.todo` in `tests/e2e/`. |
| V5-02 | Multi-creature party combat (vs single-protagonist action-battle) | | The action-battle module pits player directly against enemy. For creature-catching the fight should be between the lead party creature and the enemy. Likely needs a custom `BattleAi` wrapper or a fork of action-battle. |
| V5-03 | Moves + cooldown UI (vs the module's hotbar) | | Map each species' `learnset` entries to action-battle action-bar skills. Hotbar UX may need theming (T2-01) to feel on-brand. |

---

## 3. Parallelization Quick Reference

- **Content authoring agents** — each map spec (`scripts/map-authoring/specs/*.ts`) or dialog JSON (`spine/dialog/*.json`) is independent. Worktree-per-agent, max 5 in flight (per AGENTS.md).
- **UI work streams** — Combat polish (T2-01…T2-07), Party panel (T2-10…T2-12), Pause/settings (T3-01, T3-06, T3-09) are three parallelizable streams in Phase 2-3.
- **Engine-serial** — anything touching `server.ts`, `player.ts`, or `config.client.ts` runs serially because these are hot shared surfaces.
- **Testing** — every `tests/build-time/*.test.ts` is independent; one agent per file.

---

## 4. Risk List

1. **RPG.js v5 is beta.** API churn possible between `5.0.0-beta.1` and a stable `5.0.0`. **Mitigation:** pin the version; read changelogs on every Dependabot PR; `@rpgjs/*` updates always need human review (the auto-merge excludes them via ecosystem filter; confirm this in `dependabot.yml`).
2. **Android keystore & signing.** Release APK requires a keystore not yet in the repo. **Mitigation:** generate `release.keystore` locally, store in `$HOME/.android/` (gitignored), upload password + keystore-base64 to GH secrets; document in T6-11.
3. **Web export > 10MB.** Pixi 8 + CanvasEngine + our 230 art assets can push over budget. **Mitigation:** T6-13 audit, T6-14 compression (WebP + downscale sprites that ship at 2× display size), lazy-load non-starter-map tilesets, tree-shake unused `@rpgjs/*` submodules.
4. **Tatoeba corpus drift.** Tatoeba updates weekly; a future refresh could invalidate lines that currently pass. **Mitigation:** corpus is vendored (`src/content/corpus/tatoeba.json`); refresh on human command via `pnpm fetch-corpus`, never in CI. `validate-tp` offline-only.
5. **RPG.js v5 inspector gap.** `tests/e2e/` can't do more than smoke-test until an inspector exists (V5-01). **Mitigation:** rely on `tests/build-time/` coverage; add e2e coverage opportunistically as the inspector lands. Don't block Phase 6 on V5-01.
6. **Save schema churn during Phase 2-4.** Adding `bestiary`, `badges`, `ma` coins grows save payload; will break in-flight saves. **Mitigation:** T3-11 schema versioning is done (V19 `90342f1` + migrations); every additive schema change bumps `DB_VERSION` and adds a migration step.
7. **Action-battle → party combat mismatch.** Default action-battle is single-protagonist melee; our creature-catching premise wants lead-creature-vs-enemy. **Mitigation:** V5-02 tracks this. Simpler fallback: keep player-as-fighter, treat the lead party creature as cosmetic companion until combat gets a rework.
8. **Mobile input vs grid-stepped movement.** RPG.js v5's player controller is grid-snapped; thumbstick expects analog. **Mitigation:** T5-06 virtual d-pad emits discrete directional presses matching keyboard semantics.
9. **Upstream `@rpgjs/common` TS bug.** `rooms/WorldMaps.ts` ships `.ts` source that has a type error; our typecheck script filters it. **Mitigation:** keep the grep-based filter; track when v5 promotes to stable and retest.

---

## Completion Forecast

Aggressive estimate with 1 engineer + 2 parallel content/UI agents:

- Phase 1: ✅ done (3 weeks elapsed — pivot cost)
- Phase 2: 1.5 weeks
- Phase 3: 1 week
- Phase 4: 2 weeks (content-heavy, parallelizable)
- Phase 5: 1 week
- Phase 6: 1 week

**v0.2.0 ETA: ~6.5 weeks from today** (2026-06-01 realistic target).

**Critical path:** T2-07 (victory sequence) → T3-02/05 (autosave/continue) → T4-02…T4-07 (biome paint all 7 maps) → T6-10 (E2E playthrough) → T6-11 (signed APK) → T6-17 (v0.2.0 tag).

---

## How to read this doc

A box is checked (✓) only when the behavior is **observable in a playtest**, not when a code review approves the wiring. "Partial" means the contract is met but polish / animation / dialog sophistication is below Phase-1 DoD. "DONE" without qualifier means all acceptance criteria pass.

When adding a new task, append it to its phase's table with the next sequential ID. Don't rewrite historical IDs — they're referenced from git history and PRs.
