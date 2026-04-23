---
title: Roadmap
updated: 2026-04-23
status: current
domain: planning
---

# Rivers Reckoning Roadmap

The project has pivoted to native-English Rivers Reckoning. The old language-learning layer is retired; v1 work now focuses on a complete, polished creature-catching investigation with strong maps, richer quests, better pacing, and proven web/mobile release flow.

## Phase Inventory

| Phase | Name               | Goal                                                       |  ✅ |  🟡 |  ⬜ |
| ----- | ------------------ | ---------------------------------------------------------- | --: | --: | --: |
| 1     | Stabilize          | Keep the pivot runnable/buildable                          |   3 |   1 |   1 |
| 2     | English Content    | Replace product-facing language mechanics with clues/story |   4 |   1 |   0 |
| 3     | Art Direction      | Choose and enforce a cohesive v1 visual stack              |   4 |   1 |   1 |
| 4     | Map Rebuild        | Recompose maps for density, transitions, and tap space     |   1 |   2 |   5 |
| 5     | Journey            | Expand the complete beginning-to-end game                  |   5 |   0 |   0 |
| 6     | Combat And Economy | Tune repeated play for fun and fairness                    |   2 |   2 |   2 |
| 7     | Mobile UX          | Make tap/mouse the complete control surface                |   2 |   3 |   1 |
| 8     | Release Proof      | Prove Pages, release artifacts, and debug APKs             |   5 |   0 |   1 |
| 9     | Docs And QA        | Keep docs honest and acceptance artifacts reviewable       |   3 |   0 |   1 |
| 10    | V1 Polish          | Finish audio, post-clear loop, and final product QA        |   1 |   1 |   3 |
| 11    | Onboarding + Opening Scene | Story is the asset that lasts — close the landing→gameplay cliff and script the first 30 seconds |  11 |   0 |   0 |

## Phase 1: Stabilize

| ID    | Task                                                        | Status | Notes                                                                                                              |
| ----- | ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| T1-01 | Backup pre-pivot repo state                                 | ✅     | Git bundle created under the user backup directory before destructive product changes.                             |
| T1-02 | Rename player-facing product to Rivers Reckoning            | ✅     | Title, manifest, package, Capacitor app name, and UI copy now use Rivers Reckoning.                                |
| T1-03 | Rename current map IDs to English route names               | ✅     | Seven map IDs now use English names and regenerated artifacts.                                                     |
| T1-04 | Preserve compatibility for old saves/internal IDs           | 🟡     | Legacy table/module names remain where needed; product copy should keep moving to clue/native-English terminology. |
| T1-05 | Remove dead compatibility aliases after a migration release | ⬜     | Requires explicit save-migration plan.                                                                             |

## Phase 2: English Content

| ID    | Task                                                                       | Status | Notes                                                                                                    |
| ----- | -------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| T2-01 | Replace corpus vocabulary data with curated clues                          | ✅     | Clue records are now the investigation journal source of truth.                                          |
| T2-02 | Convert dialog, UI, quests, starters, and trainer rewards to English/clues | ✅     | Current content builds without the retired corpus scripts.                                               |
| T2-03 | Convert Field Notes into an investigation micro-game                       | ✅     | The micro-game now uses English field-note prompts.                                                      |
| T2-04 | Rewrite remaining species/item/internal labels into stronger English       | 🟡     | Player-facing labels are improved, but internal IDs still expose old naming in some debug/data contexts. |
| T2-05 | Write final v1 quest/NPC/story bible                                       | ✅     | `docs/STORY.md` shipped in PR #96 (T6). Reconciled against implementation in PR #116 (T16).              |

## Phase 3: Art Direction

| ID    | Task                                                             | Status | Notes                                                                                    |
| ----- | ---------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| T3-01 | Add curated art manifest and reject-list boundary                | ✅     | Map palette code can reference curated tile IDs.                                         |
| T3-02 | Audit current tiles for visual cohesion and transparent overlays | 🟡     | Known bad rectangular overlays are rejected; full pack-wide classification remains open. |
| T3-03 | Evaluate pending asset archives in bakeoff form                  | ✅     | Pending pack inventory + audit tooling both shipped. Evaluation done and recorded in `docs/ART_DIRECTION.md`. |
| T3-04 | Choose primary overworld identity                                | ✅     | **Fan-tasy family, full v1 stack.** Decision + alt rejections + per-region pack map live in `docs/ART_DIRECTION.md`. |
| T3-05 | Choose compatible interior/cave identity                         | ✅     | Fan-tasy Castles and Fortresses for caves/shrines/endgame architecture; Fan-tasy Medieval Interiors for lake/frost/indoor surfaces. All in-family. |
| T3-06 | Render collection landmarks from generated atlases               | ⬜     | Salvage from closed PR #81: map specs should render landmark tiles from `src/content/art/tilesets.json` atlas IDs, not hardcoded coordinates. Fresh PR against current main. |

## Phase 4: Map Rebuild

| ID    | Task                                                     | Status | Notes                                                                  |
| ----- | -------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| T4-01 | Keep all maps generated and verified                     | ✅     | Spec-generated artifacts are the only accepted maps.                   |
| T4-02 | Rebuild terrain grammar around curated IDs               | 🟡     | Current maps use curated paths in places but still need a deeper pass. |
| T4-03 | Improve biome transitions and encounter-zone readability | 🟡     | Visual audit catches issues; composition work remains.                 |
| T4-04 | Add landmarks and route language to every map            | ⬜     | Each map needs clearer identity and memory hooks.                      |
| T4-05 | Expand map scale/density for polished v1 feel            | ⬜     | Current maps are playable but still proof-path dense.                  |
| T4-06 | Transition-aware map painting                            | ⬜     | Salvage from closed PR #81: map painter should route biome transitions through a shared helper rather than per-spec inline tile arrays. Fresh PR. |
| T4-07 | Buffer water-route seams                                 | ⬜     | Salvage from closed PR #81: `nasin_pi_telo` + `lakehaven` water edges had visible seams; add a shore-tile buffer pass to the painter. Fresh PR. |
| T4-08 | Enforce map surface metadata                             | ⬜     | Salvage from closed PR #81: every tile in every spec must declare surface kind (walkable/blocker/warp/encounter) via metadata, asserted by a build-time test. |

## Phase 5: Journey

| ID    | Task                                                      | Status | Notes                                                                     |
| ----- | --------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| T5-01 | Maintain current seven-map playable arc                   | ✅     | Starter to green-dragon clear exists.                                     |
| T5-02 | Convert current arc into a richer investigation structure | ✅     | Story bible (PR #96) + T7 quest expansion (PR #111) + T21 quest dialog authoring (PR #146). 15 quests covering all 7 regions, cross-region payoff in `quest_sewi_lost_hiker`. |
| T5-03 | Add regional quest chains with cross-region payoff        | ✅     | T7 (PR #111) landed 8 new quests. Every region now has ≥2 side quests; `quest_sewi_lost_hiker` delivers from highridge_pass → lakehaven. |
| T5-04 | Add optional catches/rewards/side paths                   | ✅     | 15 quests in `src/content/gameplay/quests.json` across 7 regions — 2-3 per region, each optional outside the main golden path. |
| T5-05 | Add post-clear loop                                       | ✅     | PR #113 — green-dragon re-fight after clear. `decideFinalBossTrigger()` pure state machine in `src/modules/main/green-dragon.ts`; locked by `tests/build-time/post-clear-loop.test.ts`. |

## Phase 6: Combat And Economy

| ID    | Task                                                      | Status | Notes                                                                  |
| ----- | --------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| T6-01 | Keep wild encounter fight/catch loop playable             | ✅     | Wild battle UI, capture, drops, XP, and clue rewards exist.            |
| T6-02 | Keep set-piece action-battle lead bridge playable         | ✅     | Rival, masters, and dragon use lead creature body/stat/movebar bridge. |
| T6-03 | Tune encounter frequency and catch odds through playtests | 🟡     | Functional now; fun pacing remains unproven.                           |
| T6-04 | Tune XP, item economy, and shop prices                    | 🟡     | Needs repeated golden-path and side-path playtests.                    |
| T6-05 | Expand move variety and type feedback                     | ⬜     | Current move set is serviceable but thin for v1.                       |
| T6-06 | Design richer full-party battle command flow              | ⬜     | Current bench switching is useful but not final depth.                 |

## Phase 7: Mobile UX

| ID    | Task                                                | Status | Notes                                                                           |
| ----- | --------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| T7-01 | Provide HUD menu and pause routes for major actions | ✅     | Party, Clues, Gear, Bestiary, Settings, Save, and Title are reachable.          |
| T7-02 | Support tap-to-walk and contextual tap interaction  | ✅     | Current E2E covers tap movement, hint, and adjacent interaction.                |
| T7-03 | Improve HUD framing around gameplay area            | 🟡     | Works, but needs more visual review on real mobile screens.                     |
| T7-04 | Broaden mobile failure-path coverage                | 🟡     | Current coverage is strong for happy paths and selected failures.               |
| T7-05 | Device-prove touch comfort on Android/iOS           | 🟡     | Android emulator smoke passed; iOS simulator and physical-device passes remain. |
| T7-06 | Improve HUD portrait + map viewport framing         | ⬜     | Salvage from closed PR #81: party portraits clip at small viewports; map viewport crops landmarks on portrait tablets. Fresh PR with visual-audit evidence. |

## Phase 8: Release Proof

| ID    | Task                                          | Status | Notes                                                                                                                       |
| ----- | --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| T8-01 | Keep PR CI gates and reviewer artifacts wired | ✅     | CI creates Pages-ready web and debug APK artifacts.                                                                         |
| T8-02 | Keep release-please artifact handoff wired    | ✅     | Release artifacts flow through release metadata to CD.                                                                      |
| T8-03 | Prove remote release chain end to end         | ✅     | `v0.3.1` proved release-please PR -> artifact-producing `release.yml` -> consuming `cd.yml`.                                |
| T8-04 | Keep CD on workflow_run consumption           | ✅     | `cd.yml` consumed the completed `release.yml` run `24819206623` and deployed Pages in run `24819295738`.                    |
| T8-05 | Run Maestro Android debug APK smoke           | ✅     | Passed on `Maestro_ANDROID_pixel_6_android-33` with the locally built debug APK; release-attached APK proof remains T10-03. |
| T8-06 | Run Maestro iOS Pages smoke                   | ⬜     | Needs simulator execution against deployed Pages.                                                                           |

## Phase 9: Docs And QA

| ID    | Task                                                 | Status | Notes                                                                                                        |
| ----- | ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| T9-01 | Update current-state docs for Rivers Reckoning pivot | ✅     | Root/current docs now describe native-English clues and release contracts.                                   |
| T9-02 | Keep visual diagnostics as acceptance artifacts      | ✅     | Visual audit and golden-path diagnostics remain required review inputs.                                      |
| T9-03 | Audit all non-roadmap docs after each feature phase  | ✅     | Docs index, production/runbook/readiness docs, and root agent docs now align to the verified `v0.3.1` state. |
| T9-04 | Remove legacy naming debt from modules/tests/docs    | ⬜     | Needs save-compatible staged rename plan.                                                                    |

## Phase 10: V1 Polish

| ID     | Task                                               | Status | Notes                                                                                                                  |
| ------ | -------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| T10-01 | Final soundtrack/SFX pass                          | 🟡     | Runtime audio is wired, but final asset identity is not done.                                                          |
| T10-02 | Full manual playtest from fresh install to credits | ⬜     | Must include screenshots, diagnostics, and notes.                                                                      |
| T10-03 | Physical Android debug APK QA                      | ⬜     | Must use release-attached artifact, not local rebuild.                                                                 |
| T10-04 | Final docs accuracy pass                           | ✅     | Current-state, production, release, QA, and root agent docs now reflect the shipped `v0.3.1` state and remaining work. |
| T10-05 | V1 release candidate checklist                     | ⬜     | Requires all prior phases to be green or explicitly scoped out.                                                        |

## Phase 11: Onboarding And Opening Scene (v1 blocker)

North-star: Pokémon Blue, Final Fantasy VI, Chrono Trigger — **story is the asset that lasts**. The opening 30 seconds of a 16-bit RPG *is* the world in miniature. Our current opening drops the player onto a map with no scripted moment, no visible protagonist, and no HUD. Every row below is a v1 blocker surfaced by `docs/screenshots/visual-audit/1.0-onboarding/NOTES.md` (automated capture via `tests/e2e/full/onboarding-capture.spec.ts`).

| ID     | Task                                                                      | Status | Notes                                                                                                                         |
| ------ | ------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| T11-01  | Close the landing→gameplay quality cliff                                  | ✅     | Meta row — covered by T11-02/03/04/05/09/10/11. Every sub-row shipped; the visual-audit cliff flagged in the 1.0 capture is closed. |
| T11-02  | Distinguish the player sprite from NPCs                                   | ✅     | PR #136 — overhead "Rivers" name tag via `setComponentsTop` + `Components.text`. Implemented in `src/modules/main/player-identity.ts`; re-applied in `onConnected` / `onJoinMap`; locked by `tests/build-time/player-name-tag.test.ts`. |
| T11-03  | Fix black rectangle placeholders on `riverside_home`                      | ✅     | PR #138 — added `collectionAtlasTileset("seasons/Objects_Trees_Seasons")` + 12 tree/bush placements to the spec. Black-edge rectangles gone; starter village reads as a tree-lined green. |
| T11-04  | Label or remove the unexplained brown square in the starter village      | ✅     | PR #142 — removed the orphan `paintRect([2, 7, 4, 2], "d")` in `scripts/map-authoring/specs/riverside_home.ts`. Main road and mentor plaza kept; village reads cleanly. |
| T11-05  | Bring HUD chrome onto gameplay surfaces                                   | ✅     | PR #140 — new goal widget top-right on every gameplay frame. Pure builder `src/config/hud-goal.ts`, `poki-hud-goal.ce` publisher, `HudGoal` React component, `hud.goal` config block. Phase-branched on `starter_chosen`; locked by `tests/build-time/hud-goal.test.ts`. |
| T11-06  | Wire New Game click to fire the starter ceremony                          | ✅     | PR #128 — `title-menu.ts startFreshGame` calls `runOpeningScene()` which chains into `runStarterCeremony()`. Locked by `tests/integration/opening-scene.test.ts`. |
| T11-07  | Ensure starter grant populates party to 1/6                               | ✅     | PR #128 — same chain. Integration test asserts `getParty()` returns length 1 and `starter_chosen` flag is set after the ceremony completes. |
| T11-08  | Dialog keyboard-advance (Enter/Space) alongside tap                       | ✅     | PR #132 — `DialogSurface` auto-focuses on mount/message change; document-level keydown fallback; hint label "tap or press Enter". Reframed from the original "movement doesn't work" — root cause was the dialog modal eating keyboard input. |
| T11-09  | Populate the pause-overlay right pane with a glance dashboard             | ✅     | PR #144 — new `glance` route becomes the default: four read-only rows (Party N/6 + lead, Clues N, Seen/Caught bestiary, phase-branched Next objective). `buildGlanceContent` lives in `src/modules/main/pause-menu.ts`. |
| T11-10  | Add diegetic first-play cue to jan Sewi                                   | ✅     | PR #134 — gold "!" via `setComponentsTop` + `Components.text` in `src/modules/main/event.ts`. Gated on `starter_chosen` flag; cleared in `onAction` after the ceremony. Locked by `tests/build-time/jan-sewi-first-play-cue.test.ts`. |
| T11-11  | Author the scripted opening scene                                         | ✅     | PR #126 — `src/modules/main/opening-scene.ts` with a pure `decideOpeningScene()` state machine. Five authored beats in `ui.json` under `opening_scene`; idempotent; NG+ clears the flag. Chained into `startFreshGame` so New Game always lands on the scripted intro. |

## Definition Of Done For V1

-   Local run/build/deploy gates pass.
-   Pages deployment and Android debug APK release artifact are proven from CI release flow.
-   The player can complete a fun beginning-to-end journey without docs.
-   The maps look coherent in visual-audit and golden-path screenshots.
-   Mobile/tap play is complete enough that every action is reachable without a keyboard.
-   Story, quests, clues, inventory, loot, and combat rewards form a complete loop.
-   Roadmap and current-state docs match verified reality.
