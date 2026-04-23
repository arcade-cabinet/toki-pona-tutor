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
| 2     | English Content    | Replace product-facing language mechanics with clues/story |   3 |   1 |   1 |
| 3     | Art Direction      | Choose and enforce a cohesive v1 visual stack              |   1 |   2 |   3 |
| 4     | Map Rebuild        | Recompose maps for density, transitions, and tap space     |   1 |   2 |   5 |
| 5     | Journey            | Expand the complete beginning-to-end game                  |   1 |   1 |   3 |
| 6     | Combat And Economy | Tune repeated play for fun and fairness                    |   2 |   2 |   2 |
| 7     | Mobile UX          | Make tap/mouse the complete control surface                |   2 |   3 |   1 |
| 8     | Release Proof      | Prove Pages, release artifacts, and debug APKs             |   5 |   0 |   1 |
| 9     | Docs And QA        | Keep docs honest and acceptance artifacts reviewable       |   3 |   0 |   1 |
| 10    | V1 Polish          | Finish audio, post-clear loop, and final product QA        |   1 |   1 |   3 |

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
| T2-05 | Write final v1 quest/NPC/story bible                                       | ⬜     | Needed before major quest expansion.                                                                     |

## Phase 3: Art Direction

| ID    | Task                                                             | Status | Notes                                                                                    |
| ----- | ---------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| T3-01 | Add curated art manifest and reject-list boundary                | ✅     | Map palette code can reference curated tile IDs.                                         |
| T3-02 | Audit current tiles for visual cohesion and transparent overlays | 🟡     | Known bad rectangular overlays are rejected; full pack-wide classification remains open. |
| T3-03 | Evaluate pending asset archives in bakeoff form                  | 🟡     | Pending pack inventory exists; final v1 visual stack is not chosen.                      |
| T3-04 | Choose primary overworld identity                                | ⬜     | Must be evidence-backed by contact sheets/sample maps.                                   |
| T3-05 | Choose compatible interior/cave identity                         | ⬜     | Do not mix styles opportunistically.                                                     |
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
| T5-02 | Convert current arc into a richer investigation structure | 🟡     | The premise is set, but quest chains and recurring NPC arcs need writing. |
| T5-03 | Add regional quest chains with cross-region payoff        | ⬜     | Requires story bible first.                                               |
| T5-04 | Add optional catches/rewards/side paths                   | ⬜     | Should support fun replay, not grind.                                     |
| T5-05 | Add post-clear loop                                       | ⬜     | Needed for v1 completion.                                                 |

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

## Definition Of Done For V1

-   Local run/build/deploy gates pass.
-   Pages deployment and Android debug APK release artifact are proven from CI release flow.
-   The player can complete a fun beginning-to-end journey without docs.
-   The maps look coherent in visual-audit and golden-path screenshots.
-   Mobile/tap play is complete enough that every action is reachable without a keyboard.
-   Story, quests, clues, inventory, loot, and combat rewards form a complete loop.
-   Roadmap and current-state docs match verified reality.
