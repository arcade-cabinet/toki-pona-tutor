---
title: Rivers Reckoning 1.0 — Task Batch
updated: 2026-04-23
status: active
domain: planning
version: 2.88
timeframe: multi-sprint
stop_on_failure: false
auto_commit: true
---

# Feature: Rivers Reckoning 1.0

**Created:** 2026-04-23
**Priority:** P0 (release-defining)
**Source plan:** `/Users/jbogaty/.claude/plans/review-docs-get-aligned-nested-moler.md`
**Verified baseline:** main at `6c63925`, release `v0.3.1` shipped, `pnpm validate/typecheck/test:unit (811)/test:integration (17)/build/GITHUB_PAGES=true build` all green locally.

## Overview

Take Rivers Reckoning from current verified `v0.3.1` to a polished `v1.0.0`. The pivot from the old toki-pona language-learning game to native-English creature-catching RPG is complete; the React/Radix/Motion HUD is already landed on main; seven maps are playable end-to-end with a starter ceremony, capture loop, four region masters, a green-dragon finale, save/continue, and credits.

What remains is product depth and release proof: rebase and land the one remaining feature PR, sweep docs drift, verify every asset loads under the Pages base, write a story bible and build out quest chains, choose a final art direction and recompose maps to match, author an audio identity pass, prove the Android release-attached APK on a physical device, prove iOS Safari on simulator + device, then walk `docs/LAUNCH_READINESS.md` and tag 1.0.

## Already Done (not tracked as tasks, recorded for context)

- Local main fast-forwarded from `023418e` → `6c63925`.
- Stale worktrees (6) pruned from missing `toki-pona-tutor/.worktrees/`.
- 10 merged/redundant local branches deleted.
- React 19 + Radix UI + Motion + `src/ui/` already on main (the HUD extraction planned as §3.C is already complete).
- Local gates green: validate, typecheck, test:unit, test:integration, build, GITHUB_PAGES=true build.

## Out of Scope

- Signed Android release APK/AAB automation (post-v1).
- Native iOS app packaging/signing (post-v1).
- App Store / Play Store submission metadata (post-v1).
- Consolidating the separate `/Users/jbogaty/src/arcade-cabinet/rivers-of-reckoning` Angular/Ionic repo (unrelated; raise to user separately).
- Remote-branch pruning (`origin/content/region-*`, `origin/feat/*`, `origin/pivot/godot`) — these are history pointers, leave in place unless the user requests cleanup.

## Tasks

Each task below has: priority (P1 highest), dependencies, files, verification command or artifact, and acceptance criteria. Ordered by dependency, not priority.

### T1 [P1] — Rebase PR #81 (`codex/stabilize-run-release-docs`) onto origin/main

- **Dependencies:** none
- **Files touched:** `docs/STATE.md`, `docs/ROADMAP.md`, `public/assets/maps/*.tmj`, `public/assets/maps/*.preview.png`, `src/tiled/*.tmx`, and whatever else conflicts.
- **Approach:**
  1. `gh pr checkout 81`
  2. `git rebase origin/main` — expect conflicts in docs/STATE.md, docs/ROADMAP.md, and map artifacts.
  3. For any `public/assets/maps/*.tmj` or `src/tiled/*.tmx` conflict: `git checkout --theirs` the artifact (or delete), then regenerate via `pnpm author:all --all`.
  4. Re-run gates.
  5. `git push --force-with-lease`
  6. Let CI pass; merge via squash.
- **Verification:** `pnpm validate && pnpm typecheck && pnpm test:unit && pnpm test:integration && pnpm build && GITHUB_PAGES=true pnpm build && pnpm author:verify`
- **Acceptance:**
  - [ ] PR #81 merged into main via squash.
  - [ ] No regenerated map drift (author:verify clean).
  - [ ] All prior gates still green.

### T2 [P1] — Merge PR #80 (pnpm/action-setup 5→6)

- **Dependencies:** T1 (so it rebases on a stable main)
- **Files touched:** `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/workflows/cd.yml` (wherever `pnpm/action-setup@` is referenced).
- **Approach:** Review the dependabot diff; if it only bumps `pnpm/action-setup` SHA, let automerge run. Otherwise rebase, re-run CI.
- **Verification:** CI on PR #80 passes; post-merge main CI still passes.
- **Acceptance:**
  - [ ] PR #80 merged.
  - [ ] Main CI green at next commit.

### T3 [P1] — Bump `release-please-action` for Node 24 compatibility

- **Dependencies:** none (parallel-safe with T1)
- **Files touched:** `.github/workflows/release.yml` (pin to a Node-24-ready `release-please-action` SHA) and possibly `.node-version` if needed to unblock local work on Node 24.
- **Context:** `docs/PRODUCTION.md` flags the upstream Node 20 deprecation before GitHub's forced Node 24 switch.
- **Verification:** `pnpm workflow:check` passes; a test release-please run (dry-run via PR) succeeds.
- **Acceptance:**
  - [ ] release-please-action pinned to a Node-24-compatible SHA.
  - [ ] Workflow lint (`pnpm workflow:check`) clean.
  - [ ] Next release-please PR opens and merges without Node-version warnings.

### T4 [P1] — Docs drift sweep

- **Dependencies:** T1
- **Files touched:** any player-facing file containing residual `poki soweli`, `toki pona`, `Tatoeba`, `jan lawa`, `validate-tp`, `corpus/`, or old map IDs (`ma_tomo_lili`, `nena_sewi`, `ma_telo`, `ma_lete`, `nena_suli`, `nasin_pi_telo`, `nasin_wan`).
- **Approach:**
  1. `rg -l -i '(poki soweli|toki pona|tatoeba|jan lawa|validate-tp|ma_tomo_lili|nena_sewi|ma_telo|ma_lete|nena_suli|nasin_pi_telo|nasin_wan)' -g '!*.lock' -g '!node_modules' -g '!dist' -g '!.git'`
  2. Classify each hit: (a) intentional save-compat / Pages slug / history note → annotate in `docs/STATE.md`'s "Current Limits"; (b) player-facing leak → fix.
  3. Verify `docs/UI_OVERLAY_PIVOT.md` reflects current state (the UI landed, no longer an archival spike).
- **Verification:** `rg` list reduced to only intentional hits; `docs/STATE.md` "Current Limits" captures every remaining residual.
- **Acceptance:**
  - [ ] No player-facing docs, UI strings, or code comments reference the old direction.
  - [ ] Intentional residuals (Pages slug, save-compat names) are documented in `docs/STATE.md`.
  - [ ] `docs/UI_OVERLAY_PIVOT.md` updated or deleted if the landed state supersedes it.

### T5 [P1] — Asset load verification under Pages base

- **Dependencies:** T1, T4
- **Files touched:** report written to `docs/visual-audit/1.0-asset-load-report.md`; fixes in map specs + `src/content/gameplay/*.json` + `public/` as needed.
- **Approach:**
  1. `GITHUB_PAGES=true pnpm build && pnpm preview` (note the host+port).
  2. In Chrome DevTools MCP: `navigate_page`, `list_network_requests`, `list_console_messages`.
  3. Walk all seven maps (`riverside_home`, `greenwood_road`, `highridge_pass`, `lakehaven`, `frostvale`, `dreadpeak_cavern`, `rivergate_approach`) + starter ceremony + one wild encounter + every pause route + one set-piece combat.
  4. Record every 404, every console error, every missing portrait/spritesheet/font/wasm.
  5. For each: trace to the source spec/config, fix, regenerate if it's a map artifact.
- **Verification:** Second pass of the same walk produces zero 404s and zero console errors in the report.
- **Acceptance:**
  - [ ] `docs/visual-audit/1.0-asset-load-report.md` exists with before/after evidence.
  - [ ] Zero 404s, zero console errors on the final pass.
  - [ ] All fixes land via PR with `pnpm author:verify` clean.

### T6 [P2] — Story bible (`docs/STORY.md`)

- **Dependencies:** T1 (so roadmap/state are stable)
- **Files touched:** `docs/STORY.md` (new).
- **Scope:**
  - Rivers's background + motivation.
  - The four region-master arcs: who they are, what they guard, what Rivers learns from each.
  - The green-dragon mystery: setup, clues (mapped to `src/content/clues.json`), mid-game hints, final reveal.
  - Recurring NPCs across regions (rivals, mentors, shopkeepers, quest-giver) with cross-region payoffs.
  - The post-clear loop (one choice: NG+, rematches, collection-complete reward, or after-credits free-exploration).
- **Verification:** A writer unfamiliar with the codebase can read `docs/STORY.md` and know what every quest is supposed to do.
- **Acceptance:**
  - [ ] `docs/STORY.md` exists, frontmatter standard-compliant.
  - [ ] Each of the 7 maps has ≥ 1 paragraph of narrative purpose.
  - [ ] Each region master has ≥ 1 paragraph of arc + payoff.
  - [ ] Green-dragon reveal is plotted beat-by-beat against existing `src/content/clues.json` rows.
  - [ ] Post-clear loop choice is named and justified.

### T7 [P2] — Quest chain content buildout

- **Dependencies:** T6
- **Files touched:** `src/content/spine/quests/*.json` (or wherever the canonical quest source lives per current architecture), `src/content/schema/quest.ts` (extend if needed), `src/content/generated/world.json` (regenerated).
- **Scope:**
  - ≥ 2 side quests per region (7 regions × 2 = ≥ 14 new quests).
  - Each region has ≥ 1 quest that cross-references at least one other region (drives exploration back-and-forth).
  - Each new quest validated by Zod schema.
- **Verification:** `pnpm validate && pnpm build-spine && pnpm test:unit && pnpm test:integration`. Manual playtest of ≥ 3 side quests end-to-end.
- **Acceptance:**
  - [ ] ≥ 14 new quest JSON files, all schema-valid.
  - [ ] ≥ 7 of them cross-region.
  - [ ] Integration test that loads quest content and asserts chain resolution passes.
  - [ ] 3 playtested quests verified with screenshots in `docs/visual-audit/`.

### T8 [P2] — Combat + economy tuning pass

- **Dependencies:** T7 (so playtest has real content to tune against)
- **Files touched:** `src/content/gameplay/combat.json`, `src/content/gameplay/shops.json`, `src/content/gameplay/starters.json`, `src/content/spine/species/*.json` (xp_yield), `src/content/spine/moves/*.json`.
- **Approach:**
  1. Fresh-start-to-credits playthrough on mobile 3 times. Log: encounter frequency, catch success rate, XP per encounter, HP/damage feel, shop affordability, time-to-first-capture, time-to-first-gym-clear.
  2. Adjust JSON numbers (not formulas). Commit incrementally with playthrough evidence.
  3. Expand move variety: each of the 5 types gets ≥ 3 moves at different levels.
  4. Wire visible type-effectiveness feedback in combat HUD (flash / color / label).
- **Verification:** Three clean playthroughs with playtest notes in `docs/visual-audit/1.0-combat-playtest.md`; each major tune is a separate commit.
- **Acceptance:**
  - [ ] ≥ 3 clean end-to-end playthroughs logged.
  - [ ] Each type has ≥ 3 moves in `src/content/spine/moves/`.
  - [ ] Type-effectiveness flashes on hit (visible in `docs/visual-audit/` screenshots).
  - [ ] No "feels grindy" note remains unaddressed.

### T9 [P2] — Art direction bakeoff + final visual stack

- **Dependencies:** T1 (stable main)
- **Files touched:** `docs/ART_DIRECTION.md`, `pending/` archive decisions, `public/assets/tilesets/` curated set, `src/content/art/tilesets.json`.
- **Approach:**
  1. Walk `pending/` archives: Grand Forests, Lonesome Forest Summer/Winter, Old Town, Dungeons, Fan-tasy Interiors/Castles/Snow/Desert, Natural Interior, World Map Tiles.
  2. Extract contact sheets (one 4-8 tile sample per pack rendered onto a reference map) into `docs/ART_DIRECTION.md`.
  3. Decision row: one overworld pack + one interior pack, with rationale and named rejects.
  4. Move accepted packs from `pending/` into the proper `public/assets/tilesets/*/` structure; archive rejects out of the repo (user NAS or outside `rivers-reckoning/`).
- **Verification:** `docs/ART_DIRECTION.md` has contact-sheet evidence for every pack evaluated; `src/content/art/tilesets.json` lists only packs that survived the bakeoff.
- **Acceptance:**
  - [ ] Final overworld pack chosen with evidence.
  - [ ] Final interior pack chosen with evidence.
  - [ ] `pending/` no longer contains multi-gigabyte unextracted archives (moved or archived out of repo).
  - [ ] Map authoring palette updated to reflect accepted packs only.

### T10 [P2] — Map recomposition for v1 polish

- **Dependencies:** T9
- **Files touched:** `scripts/map-authoring/specs/<id>.ts` (all 7), regenerated `src/tiled/*.tmx` + `public/assets/maps/*.tmj` + `public/assets/maps/*.preview.png`.
- **Scope:** For each of the 7 maps, rebuild the spec with: landmarks (named features), route language (readable paths), varied biome transitions, tap-friendly spacing (no 1-tile corridors), removed sparse/proof-only areas.
- **Verification:** `pnpm author:all --all` clean. `pnpm test:unit` map-preview-regression tests pass. Visual-audit screenshot diff shows every map visibly improved; `docs/screenshots/visual-audit/` carries before/after pairs.
- **Acceptance:**
  - [ ] All 7 specs touched; all artifacts regenerated.
  - [ ] `pnpm author:verify` clean.
  - [ ] `docs/VISUAL_REVIEW.md` walkthrough notes each map's improvements.
  - [ ] No map has a known "too sparse" or "overlay visible" issue remaining.

### T11 [P3] — Audio identity pass

- **Dependencies:** T1 (stable main)
- **Files touched:** `public/audio/bgm/*.ogg` (new), `public/audio/sfx/*.ogg` (new), `src/content/gameplay/audio.json`, `docs/AUDIO.md` (new).
- **Scope:**
  - BGM: 7 biome themes (riverside, greenwood, highridge, lakehaven, frostvale, dreadpeak, rivergate) + boss theme + title + credits = 10 BGM tracks.
  - SFX: ≥ 12 wired — step, tall-grass rustle, encounter chime, capture success, capture fail, damage hit, critical hit, faint, level-up, menu open, menu close, shop buy, quest accept.
  - Every asset has explicit license (CC0, CC-BY, commissioned, or original) documented in `docs/AUDIO.md`.
- **Verification:** Fresh playthrough exercises every BGM + every SFX at least once. `grep`-able franchise references (names, track titles) all absent.
- **Acceptance:**
  - [ ] 10 BGM tracks in `public/audio/bgm/`, all wired.
  - [ ] ≥ 12 SFX in `public/audio/sfx/`, all wired.
  - [ ] `docs/AUDIO.md` lists every asset with license and source.
  - [ ] No franchise-derived names or filenames.

### T12 [P3] — iOS Safari Pages smoke (Maestro)

- **Dependencies:** T1, T5 (Pages base assets verified first)
- **Files touched:** `.maestro/ios/pages-safari-smoke.yaml` (exists — may need tweaks), `docs/RELEASE_QA.md` (evidence row).
- **Approach:**
  1. Boot iOS simulator (e.g. iPhone 15).
  2. Deploy Pages (or run against latest deployed).
  3. `pnpm maestro:ios`.
  4. Repeat once on a physical iOS device if available.
- **Verification:** Maestro output green; screenshot set saved to `docs/visual-audit/ios/`.
- **Acceptance:**
  - [ ] iOS simulator smoke passes, screenshots captured.
  - [ ] At least one physical iOS device smoke passes, OR the device gap is explicitly documented as a post-v1 scope item.

### T13 [P3] — Physical Android debug APK QA

- **Dependencies:** T1, T11 (audio is on-device evidence)
- **Files touched:** `docs/RELEASE_QA.md` (evidence row), `docs/LAUNCH_READINESS.md` (Android row ticked).
- **Approach:**
  1. Use the release-attached APK from the next `release.yml` run (NOT a local rebuild).
  2. Install on one physical Android device.
  3. Walk the full `docs/LAUNCH_READINESS.md` mobile checklist.
  4. Record any failure in `docs/RELEASE_QA.md` with screenshot + device/OS version.
- **Verification:** `docs/RELEASE_QA.md` carries a signed-off Android device run.
- **Acceptance:**
  - [ ] Physical Android device installs the release-attached APK.
  - [ ] Full LAUNCH_READINESS mobile checklist ticked or each gap documented.
  - [ ] Portrait + landscape both usable, OR portrait locked for v1 with justification in `docs/UX.md`.

### T14 [P3] — Post-clear loop implementation

- **Dependencies:** T6 (story bible names the choice), T8 (combat is tuned)
- **Files touched:** depends on chosen loop — likely `src/content/gameplay/progression.json`, `src/modules/main/`, and one of (`new-game-plus.ts`, `rematches.ts`, `collection-reward.ts`, `free-exploration.ts`).
- **Scope:** Exactly one of:
  - **NG+:** reset progress, keep party level or apply scaling.
  - **Rematches:** region masters rematchable with stronger parties.
  - **Collection completion reward:** catching all 17 species unlocks a final room/encounter/cosmetic.
  - **Free exploration:** credits roll but world stays open; side quests remain live.
- **Verification:** Integration test + manual playthrough: beat the dragon, trigger the loop, verify the loop does what the story bible promised.
- **Acceptance:**
  - [ ] One post-clear loop shipped and playable.
  - [ ] Integration test proves it.
  - [ ] `docs/STORY.md` and `docs/DESIGN.md` updated.

### T15 [P1] — Launch readiness walkthrough + 1.0 tag

- **Dependencies:** T1–T14 all done or explicitly scoped out.
- **Files touched:** `docs/STATE.md`, `docs/PRODUCTION.md`, `docs/ROADMAP.md`, `docs/LAUNCH_READINESS.md`, `CHANGELOG.md` (via release-please), git tag `v1.0.0`.
- **Approach:**
  1. Walk every checkbox in `docs/LAUNCH_READINESS.md`; either tick with linked evidence or strike with scoped-out rationale.
  2. Fresh-start-to-credits playthrough recorded (screenshots in `docs/visual-audit/1.0-playthrough/`).
  3. Save/continue round-trip verified from the release-attached web + APK artifacts (not local rebuilds).
  4. Update STATE/PRODUCTION/ROADMAP to reflect verified 1.0 truth.
  5. Let release-please open the 1.0 PR; merge; tag emits.
- **Verification:** `gh release view v1.0.0` shows both web tarball and debug APK assets; Pages serves 1.0 build; LAUNCH_READINESS all ticked.
- **Acceptance:**
  - [ ] Every LAUNCH_READINESS row ticked or explicitly scoped out.
  - [ ] `v1.0.0` tagged, release published, assets attached.
  - [ ] Pages live at 1.0.
  - [ ] STATE/PRODUCTION/ROADMAP match verified 1.0 reality.
  - [ ] No open "current-state lie" in any doc.

## Dependencies Graph

```
T1 (rebase PR#81) ──┬── T2 (PR#80 merge)
                    │
                    ├── T4 (docs drift sweep) ── T5 (asset load verify) ──┐
                    │                                                      │
                    ├── T6 (story bible) ── T7 (quest chains) ── T8 ──────┤
                    │                                             │        │
                    ├── T9 (art bakeoff) ── T10 (map recompose) ──┤       ├── T14 (post-clear)
                    │                                                      │
                    ├── T11 (audio) ──────────────────────────────────────┤
                    │                                                      │
                    ├── T12 (iOS smoke) ──────────────────────────────────┤
                    │                                                      │
                    └── T13 (Android device) ─────────────────────────────┤
                                                                           │
T3 (release-please Node 24) ─────────────────────────────────────────────┤
                                                                           │
                                                                           └── T15 (1.0 tag)
```

## Risks

- **Node 24 local vs Node 22 repo pin:** local runs succeed with engine warnings. If CI enforces strict Node 22, bump `.node-version` is part of T3.
- **PR #81 rebase scope:** 21 commits, map artifacts expected to conflict. Plan is to regenerate via `pnpm author:all --all`, not hand-resolve. If the spec changes conflict, hand-merge the spec then regenerate.
- **Story bible (T6) is creative:** "done" is defined by evidence (a writer can read it and know what every quest does). This is a judgment call, not a pass/fail test.
- **Art bakeoff (T9) lives on the user's decision:** once contact sheets are produced, the final pack choice is the user's, not the agent's. The task produces evidence, not unilateral decision.
- **Device access (T12, T13):** physical device availability blocks completion. If no physical device is available, the gap is explicitly documented as post-v1 scope and noted in `docs/PRODUCTION.md`.

## Technical Notes

- **Maps are build artifacts.** Every map change must go through `scripts/map-authoring/specs/*.ts` → `pnpm author:build <id>` (or `pnpm author:all --all`). Never edit emitted `.tmx`, `.tmj`, or preview PNG directly.
- **Persistence wrappers only.** No direct `localStorage` or `IndexedDB` in feature code. Use `src/platform/persistence/preferences.ts` (small KV) or `src/platform/persistence/database.ts` (SQLite).
- **Always use PRs.** Every task that touches `main` goes through a PR; never push direct.
- **Docs > tests > code.** Update docs first when scope changes.
- **No franchise references.** Never reference Pokemon/Pokedex/Pokeball/Final Fantasy/etc. in code, comments, docs, or asset names.

## Execution Contract

- **stop_on_failure:** false (continue remaining tasks on any single failure)
- **auto_commit:** true (each task produces at least one commit)
- **PR-per-task:** default yes; small mechanical tasks (T2, T3) can batch into a single PR if strictly sequential.
- **Review posture:** every PR runs CI; merge only when CI green.

## Related

- `/task-batch docs/plans/rivers-reckoning-1.0.prq.md` — execute this batch.
- `/Users/jbogaty/.claude/plans/review-docs-get-aligned-nested-moler.md` — source plan with full context.
- `docs/ROADMAP.md` — project-native task tracker with stable T<phase>-<n> IDs.
- `docs/LAUNCH_READINESS.md` — manual readiness checklist (canonical).
- `docs/PRODUCTION.md` — pillar-level remaining work.
