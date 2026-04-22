---
title: Changelog
updated: 2026-04-20
status: current
---

# Changelog

All notable changes to poki soweli. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This branch (`feat/rpgjs-v5-pivot`) descends from commit `0a582e0` — the pre-Godot tip. The Godot era between `1d924fe` (pivot) and `0edfe61` (feat/anchor-to-template) lives on `main` and is not represented here. Release-please releases `v0.1.0`…`v0.1.3` tagged on `main` cover the Godot build and do not apply to this branch.

## [0.2.1](https://github.com/arcade-cabinet/poki-soweli/compare/v0.2.0...v0.2.1) (2026-04-20)


### Fixed

* **cd:** trigger on release:published instead of push:main ([#78](https://github.com/arcade-cabinet/poki-soweli/issues/78)) ([b006861](https://github.com/arcade-cabinet/poki-soweli/commit/b00686123c7a66f0c679c1f4ed2061046e0d7869))

## [0.2.0](https://github.com/arcade-cabinet/poki-soweli/compare/v0.1.0...v0.2.0) (2026-04-20)


### Added

* **assets:** unify on Fan-tasy tileset family + tier creatures by animation ([2f10983](https://github.com/arcade-cabinet/poki-soweli/commit/2f109831c85e467917c1c4019b4479b0541fb35e))
* build-time TP translator via vendored Tatoeba corpus ([#17](https://github.com/arcade-cabinet/poki-soweli/issues/17)) ([0d81c7b](https://github.com/arcade-cabinet/poki-soweli/commit/0d81c7b27444892109e997a10408609744c6b206))
* **combat:** species-driven creature combat + catch mechanic + auto-starter ([#27](https://github.com/arcade-cabinet/poki-soweli/issues/27)) ([e0a1c3c](https://github.com/arcade-cabinet/poki-soweli/commit/e0a1c3cba1b4057dd55375573a5e71a41cd384be))
* **content:** region 1 + region 2 spine — starter village, first route, 8 species, 10 moves, 4 items ([#25](https://github.com/arcade-cabinet/poki-soweli/issues/25)) ([7719b6d](https://github.com/arcade-cabinet/poki-soweli/commit/7719b6ddcd649f3fdbb61b9cc17c4dea3e1ce398))
* **content:** region 3 nena sewi — mountain pass + jan Wawa gym ([#29](https://github.com/arcade-cabinet/poki-soweli/issues/29)) ([103f3a5](https://github.com/arcade-cabinet/poki-soweli/commit/103f3a519a4f8b9bac2ad607d88d821fe4c1699c))
* **content:** region 4 ma telo — lake village ([#31](https://github.com/arcade-cabinet/poki-soweli/issues/31)) ([6d9f380](https://github.com/arcade-cabinet/poki-soweli/commit/6d9f380cc0534b2a5416a243ca7f2dd54c5c5680))
* **content:** region 5 ma lete — cold land with jan Lete gym ([#35](https://github.com/arcade-cabinet/poki-soweli/issues/35)) ([c72cbb8](https://github.com/arcade-cabinet/poki-soweli/commit/c72cbb814255da268f584fa7470985c19666ec3d))
* **content:** region 6 nena suli — great peak with jan Suli gym ([c85ca6e](https://github.com/arcade-cabinet/poki-soweli/commit/c85ca6e6aebde9d1ac1d1a44ff1c27fc24b7c541))
* **content:** region 7 nasin pi telo — riverside fishing route ([#38](https://github.com/arcade-cabinet/poki-soweli/issues/38)) ([dc91d1d](https://github.com/arcade-cabinet/poki-soweli/commit/dc91d1db87523faa47c45da051200b53b19a87ba))
* declarative content pipeline — Zod schemas + Tatoeba build step + agent-teams playbook ([#23](https://github.com/arcade-cabinet/poki-soweli/issues/23)) ([d2ed647](https://github.com/arcade-cabinet/poki-soweli/commit/d2ed647663e46e435f4d0608417b2688796e37b6))
* **engine:** rewire scenes to consume generated/world.json, delete procgen ([#26](https://github.com/arcade-cabinet/poki-soweli/issues/26)) ([a29f6b7](https://github.com/arcade-cabinet/poki-soweli/commit/a29f6b73c462443cdd03bbae61d4df37ffd0218d))
* **engine:** water tile key + per-creature XP persistence ([#36](https://github.com/arcade-cabinet/poki-soweli/issues/36)) ([906ad5c](https://github.com/arcade-cabinet/poki-soweli/commit/906ad5c9bab791c8c850cad58462738b8232c4b6))
* high-res Animal Pack portraits in combat + honest sprite naming + TP dialog cleanup ([#16](https://github.com/arcade-cabinet/poki-soweli/issues/16)) ([b1fc02a](https://github.com/arcade-cabinet/poki-soweli/commit/b1fc02a3475be33faaab3b11cb148468e59bedbd))
* initial Vite + React Toki Pona tutor with GH Pages deploy ([#1](https://github.com/arcade-cabinet/poki-soweli/issues/1)) ([5307c52](https://github.com/arcade-cabinet/poki-soweli/commit/5307c52df3243d1a96f9e368c69f5167bf354161))
* make the tutorial diegetic — jan Sewi is a real NPC, not an overlay ([#21](https://github.com/arcade-cabinet/poki-soweli/issues/21)) ([d753b21](https://github.com/arcade-cabinet/poki-soweli/commit/d753b21d6b836fdfa6a6a6587f0c5421dc49de07))
* opening tutorial — jan Sewi + 5 dialog beats that teach the game ([#19](https://github.com/arcade-cabinet/poki-soweli/issues/19)) ([2f8c9f6](https://github.com/arcade-cabinet/poki-soweli/commit/2f8c9f684b04faacf9a669cad44c135e0415cf6f))
* pivot to RPG.js v5 beta + Capacitor persistence ([#66](https://github.com/arcade-cabinet/poki-soweli/issues/66)) ([a95fcc2](https://github.com/arcade-cabinet/poki-soweli/commit/a95fcc23d9b267e85d22873e91f3ebb71cc9c9fc))
* creature-catching combat + narrative-coherent quest arc + akesi anchor encounter ([#14](https://github.com/arcade-cabinet/poki-soweli/issues/14)) ([8521b1c](https://github.com/arcade-cabinet/poki-soweli/commit/8521b1cabd421b6588eae3751a07a83df7b4700e))
* real game feel — hearts, XP, level-ups, confetti, CC0 BGM, challenge validation ([#7](https://github.com/arcade-cabinet/poki-soweli/issues/7)) ([9029d91](https://github.com/arcade-cabinet/poki-soweli/commit/9029d91dffe72c5089498ddba3cfb27b4394dc0f))
* seed drives biome + grammar exploit fix + akesi sprite + narrative greeting ([#15](https://github.com/arcade-cabinet/poki-soweli/issues/15)) ([04d3daf](https://github.com/arcade-cabinet/poki-soweli/commit/04d3daf820f21f5099020d5bb1fddadb7a3019a2))
* sitelen pona hieroglyphs + parchment dialog + desktop bezel kill + HUD ([#12](https://github.com/arcade-cabinet/poki-soweli/issues/12)) ([cd34449](https://github.com/arcade-cabinet/poki-soweli/commit/cd3444939fe1ed4b1ffd8ff562674a4417e06a12))
* **starter:** diegetic ceremony via jan Sewi dialog ([#39](https://github.com/arcade-cabinet/poki-soweli/issues/39)) ([0a582e0](https://github.com/arcade-cabinet/poki-soweli/commit/0a582e0d76ad3ded649c7aec54dafc75b6739245))
* sunset arcade — Kenney mascot, Kenney fonts, Kenney BGM/SFX, combo bursts, screen shake ([#8](https://github.com/arcade-cabinet/poki-soweli/issues/8)) ([c38a820](https://github.com/arcade-cabinet/poki-soweli/commit/c38a820d9ead1afed6b310a2f03c1ea553459bf4))
* Toki Pona seed system — shuffle-and-begin New Game modal ([#13](https://github.com/arcade-cabinet/poki-soweli/issues/13)) ([0878488](https://github.com/arcade-cabinet/poki-soweli/commit/0878488ae8198d2c616ffc2c3bc2d0d4d29dbd96))
* Toki Town — Phaser RPG + Solid dialog + Koota ECS foundation ([#9](https://github.com/arcade-cabinet/poki-soweli/issues/9)) ([19a9084](https://github.com/arcade-cabinet/poki-soweli/commit/19a90847e8a2980f5890e089cded91e83c5962b0))
* **ux:** lock HUD architecture + Playwright E2E + @rpgjs/testing integration ([#76](https://github.com/arcade-cabinet/poki-soweli/issues/76)) ([b6a3f56](https://github.com/arcade-cabinet/poki-soweli/commit/b6a3f56da8e3a244f75d02fc02a1cafa40b48334))


### Fixed

* add missing 'awen' word so challenge 7 is winnable ([#4](https://github.com/arcade-cabinet/poki-soweli/issues/4)) ([e49cf3e](https://github.com/arcade-cabinet/poki-soweli/commit/e49cf3ec82ebc82128eba6fa9ef221f254b1df9f))
* coherent Toki Town village with labeled Tiny Town + Tiny Dungeon tiles ([#10](https://github.com/arcade-cabinet/poki-soweli/issues/10)) ([8ba18c2](https://github.com/arcade-cabinet/poki-soweli/commit/8ba18c27cdd9506f731c92050ec7846af16e3092))
* combat freeze + drop sentence-casting + FF-style polish ([#18](https://github.com/arcade-cabinet/poki-soweli/issues/18)) ([9fd7c06](https://github.com/arcade-cabinet/poki-soweli/commit/9fd7c0643703d780eff3ba1233238187df5ae9bd))
* correct tilesheet spacing + quest loop + toast + desktop aspect ([#11](https://github.com/arcade-cabinet/poki-soweli/issues/11)) ([7890100](https://github.com/arcade-cabinet/poki-soweli/commit/7890100c688475ee109aa4e74c3dc00d406424f3))
* feedback card intercepts Check Answer button clicks ([#5](https://github.com/arcade-cabinet/poki-soweli/issues/5)) ([a2798ea](https://github.com/arcade-cabinet/poki-soweli/commit/a2798ea18a021c534c85b7582aeb0a59f9c9b953))
* foldable white-canvas — debounce Phaser resize, recover GL context loss ([#20](https://github.com/arcade-cabinet/poki-soweli/issues/20)) ([c76c158](https://github.com/arcade-cabinet/poki-soweli/commit/c76c158038b8a90425512ae7e538d35a4e88ea81))
* WASD sitelen render + adventure audio + TP validator ([#22](https://github.com/arcade-cabinet/poki-soweli/issues/22)) ([e2c2529](https://github.com/arcade-cabinet/poki-soweli/commit/e2c25292a58ad4b53a372dc4031dda88a5b9ca47))


### Changed

* modularize into TS components, vendor linku dictionary, fix responsive layout ([#6](https://github.com/arcade-cabinet/poki-soweli/issues/6)) ([70aeddd](https://github.com/arcade-cabinet/poki-soweli/commit/70aedddffb4b5a9893a67d04882597048d54673d))


### Documentation

* add CLAUDE/AGENTS/STANDARDS/README/CHANGELOG + DESIGN/LORE/DEPLOYMENT + scrub copyrighted refs ([392e367](https://github.com/arcade-cabinet/poki-soweli/commit/392e367f14016200e78b44f0ed011a24d986f2b4))
* **build-time:** Stage 0 map-authoring toolchain spec ([4bfdc65](https://github.com/arcade-cabinet/poki-soweli/commit/4bfdc6507ef78c7f790f8fdeace67d33704fce0a))
* **L0:** rewrite ARCHITECTURE + STATE for journey model ([2e66128](https://github.com/arcade-cabinet/poki-soweli/commit/2e66128cfdebc97ac161b4c3fdefb62b83402b76))
* **writing:** add WRITING_RULES.md + complexity scorer in validate-tp ([#34](https://github.com/arcade-cabinet/poki-soweli/issues/34)) ([980ea09](https://github.com/arcade-cabinet/poki-soweli/commit/980ea09aa290e2009d8d4c3b0ebc0cc2de55be2d))

## [Unreleased] — feat/rpgjs-v5-pivot

### Added — pivot to RPG.js v5 beta + full journey arc

- **Engine pivot.** Retired the in-progress Phaser 4 + Solid + Koota stack (PRs #64 + #65) in favour of **RPG.js v5 beta** — Vite plugin, Vitest, agnostic save, built-in GUI, `@rpgjs/action-battle`, `@rpgjs/tiledmap`. The remaining L4-L8 layer work collapses into configuration of the module's existing primitives instead of hand-rolled scenes.
- **Capacitor persistence layer.** `@capacitor/preferences` for small KV, `@capacitor-community/sqlite` (sql.js + jeep-sqlite on web, UserDefaults / SharedPreferences on native) for structured data. **localStorage is forbidden in feature code** — the wrappers hold the only shim.
- **Map-authoring as build artifact.** Maps are emitted from TypeScript specs via `pnpm author:build`. Both `src/tiled/<id>.tmx` (runtime) and `public/assets/maps/<id>.tmj` (archive) regenerate from one source. `pnpm author:verify` runs in `pnpm validate` + CI and fails on any hand-edited or drifted .tmx.
- **Full 7-beat journey playable end-to-end:** ma_tomo_lili → nasin_wan → nena_sewi → ma_telo → ma_lete → nena_suli → nasin_pi_telo (green dragon final boss, gated on all four region badges).
- **Wild-encounter capture** via `onInShape` on Tiled Encounter zones. Weighted species roll, level band, catch-vs-flee choice, `catch_rate` roll, adds to `party_roster` (6-slot cap). No HP-reduction step — kid-friendly.
- **Mastered-words tokenizer.** Every TP dialog line is tokenized against the 131-word dictionary; each appearance bumps a per-word sightings counter. Pause-menu vocabulary screen (escape key) lists mastered words with definitions.
- **Game-over loop.** `onDead` respawns at the last village at full HP with party preserved (no permadeath).
- **Shared factories.** `GymLeader`, `AmbientNpc`, `Warp`, `GreenDragon`, `runStarterCeremony` — each future beat is a ~30-line server.ts entry.
- **Green dragon final-boss polish.** Dedicated `green_dragon_death` spritesheet + defeat animation swap via `setGraphic` on boss-dead signal. Only creature with death animation (per design lore).
- **Multi-phase BattleAi for gym leaders.** `gym-leader.ts` factory accepts optional `phase2` descriptor; 250ms HP poller triggers `runPhaseTransition` when a threshold crosses. Surfaces a difficulty arc for late-game gyms without handwriting AI.
- **Pause-menu inventory screen.** `onInput('inventory')` opens badges + journey beat + party roster paginated via showText. Complements the existing vocabulary pause screen.
- **Integration tests via `@rpgjs/testing`.** The hand-rolled `tests/e2e/` harness (Vitest browser + Playwright + custom boot poller) was replaced with the library RPG.js itself ships for this. `tests/integration/boot.test.ts` proves the real engine boots in-process (standalone mode, same module graph as `src/standalone.ts`), the player lands on `ma_tomo_lili` at `(128, 128)`. One vitest config with two projects (`unit`, `integration`); `@vitest/browser` and `@vitest/browser-playwright` retired. Documented in `docs/TESTING.md` alongside the E2E-first policy — every new feature ships with an integration test before any unit test.
- **CI workflow trifecta.** Consolidated around the global standard: `ci.yml` (PR gate — validate + APK), `release.yml` (on release-please tag — web bundle + release APK attached to GH Release), `cd.yml` (on push to main — Pages deploy from latest release). `release-please-config.json` + `.release-please-manifest.json` drive Conventional Commits → tags. `dependabot-automerge.yml` auto-merges minor/patch bumps.
- **Capacitor Android CI.** Debug APK built on every PR, uploaded as a 14-day retention artifact for sideload testing. Explicit least-privilege `permissions: contents: read`.
- **PR #66 review-sweep.** 53 CodeRabbit + Copilot comments resolved in 9 commits across two waves (37 comments in the first wave, 16 in the second).
- **Comprehensive ROADMAP.** Single backlog covering Phase 1-10 plus macro/micro — every task has a stable `T<phase>-<n>` ID, a ✅/🟡/⬜ status mark, and a line of context. Supersedes the split between the old phased table and the append-as-you-go tail. See `docs/ROADMAP.md`.
- **TESTING.md.** Four-layer test strategy (content pipeline → type surface → unit pure-logic → integration real-engine) with the **E2E-first policy** front-and-center: integration tests with the real engine carry the weight; unit tests are reserved for pure-logic/math/formulas. Codifies the docs > tests > code dependency chain. Template + fixture-API reference included.
- **Phase 2 combat-polish pure modules.** `victory-sequence.ts` (T2-07 — XP → LevelUp → MoveLearned orchestration), `party-order.ts` (T2-12 — promote / reorder with move-semantics), `hp-bar.ts` (T2-02 — threshold classes + TP labels `wawa`/`pakala`/`moli`). Each ships with 16–28 unit tests; runtime animation binding still queued (see ROADMAP).
- **Phase 3 menus.** `settings-screen.ts` (T3-06 — full pause-menu settings using BRAND.md §Chrome patterns; cycles text speed 0/24/48/96 cps + volumes 0/30/60/100 + high-contrast toggle + sitelen overlay). Warp factory learns an optional `loadingLabel` (T3-07 partial).
- **Phase 4 content tracking.** `bestiary.ts` (T4-14 — pure seen/caught state machine with earliest-timestamp preservation for NG+ migration edge cases; `listByTier` drives the grid UI).
- **Phase 5 audio + input.** `audio.ts` (T5-01/T5-02 — `bgmForContext({mapId, inCombat, timePhase})`, combat override precedence, 12-member `BgmId` union). `sfx.ts` (T5-04 — 12 SFX events with balanced base volumes, `effectiveSfxVolume(event, bus)` clamps to `[0,1]`). `virtual-dpad.ts` (T5-06 — dead zone + diagonal-snap-to-larger-axis + tap detection).
- **Phase 7 replay-value pure modules.** `rematch.ts` (T7-01 — Hall of Masters rematch cooldown + scaled XP/level + cycling drop table). `status-effect.ts` (T7-04 — `seli`/`telo`/`lete` with `telo` boosts `lete` damage, `lete` skips turn). `daycare.ts` (T7-05 — type inheritance + stat averaging). `treasure-chest.ts` (T7-06 — weighted loot + dual gating). `ambient-events.ts` (T7-07 — day/night + per-biome weather). `quest.ts` (T7-08 — 4 goal kinds). `new-game-plus.ts` (T7-10 — save-derivation rules). Every module is pure; runtime wiring is deferred to the runtime-UI streams.
- **Phase 8 language layer.** `sentence-log.ts` (T8-01 — `lipu nasin` SQLite-backed sentence log with search + recents windowing). `sitelen-glyph.ts` (T8-03 — UCSUR codepoint → emoji fallback → plain-word tiering). `micro-game.ts` (T8-05 — LCG-seeded `wan sitelen` pick-the-sentence mechanic). `dictionary-export.ts` (T8-06 — text dot-histogram + 400×600 SVG card).
- **Phase 9 coverage gate.** T9-04 — Vitest coverage gate wired into CI: 95% lines / 95% functions / 90% branches / 95% statements on a scoped include list of pure-logic modules. `v8` provider; `lcov` + `json-summary` artifact on every PR. Dual-threshold ratchet pattern mirroring T6-13's bundle-size budget.
- **CI/CD hardening.** T6-13 web bundle size audit with dual-tier budget (40 MB hard / 10 MB target). T6-16 commitlint gate on PR title + commits. CI job split — `unit` → `build` + `integration` (parallel) → `android-debug-apk`. Integration job runs in-process (no Playwright in CI).
- **BRAND system.** `docs/BRAND.md` formalises the palette (11 ink/wood/parchment/type-accent tokens), typography (Inter body + Cinzel heading + Fairfax glyph), 8-point spacing grid, panel rhythm, motion tokens (honors `prefers-reduced-motion`), 8 prioritised UI principles, chrome patterns (dialog / pause / HUD / toast). `src/styles/brand.css` implements it via CSS custom properties + `@rpgjs/ui-css` token overrides; `.poki-high-contrast` body class doubles borders + flattens gradients. `src/styles/brand-preferences.ts` + `src/styles/boot.ts` wire the preferences → body-class application; settings screen is the first surface rendering the theme. Tests in the unit project.
- **Content guards.** `assertContentWorld()` (commit `e37ece4`) — runtime guard on `world.json` shape so stale/diverged builds throw a loud startup error instead of silently failing at call-sites.
- **Integration-test infrastructure.** `vitest.config.ts` — single config with `test.projects: [unit, integration]`. `happy-dom` + `@rpgjs/testing/dist/setup.js` + `vitest-webgl-canvas-mock` give the integration project a DOM + canvas mock; `fileParallelism: false` avoids RPG.js singleton stomping. Scripts: `pnpm test` (both), `pnpm test:unit`, `pnpm test:integration`, `pnpm test:coverage`.

### Changed

- `capacitor.config.ts` rebranded from `app.tokitown.game` / "Toki Town" to `com.pokisoweli.game` / "poki soweli".
- `docs/STATE.md`, `docs/DEPLOYMENT.md`, `docs/COMBAT.md` promoted from stub/draft to current.
- `scripts/build-spine.mjs` now emits collected dialog nodes into `world.json` (previously dropped). Cross-validates `world.start_region_id`. Enforces green-dragon-only-in-final-beat rule.
- `pnpm validate` now runs `validate-challenges && validate-tp && author:verify`.
- **`vite.config.ts` base path corrected** from the pre-rename `/toki-pona-tutor/` to `/poki-soweli/` (with `process.env.CAPACITOR === 'true' ? '/' : '/poki-soweli/'` switch mirroring the grailguard pattern). The old base caused every map-asset request to 404 in production builds.
- `docs/STATE.md` rewritten as a current-snapshot orient-yourself document; commit-trail narrative removed (use `git log`).
- `docs/TESTING.md` rewritten around the E2E-first policy and the two-project vitest config.

### Removed

- All Phaser-era source: `src/game/`, `src/components/`, `src/main.tsx`, `src/App.tsx`, `src/hooks/`, `src/lib/`, region schema + spine files.
- Koota schema leftovers (`src/content/schema/koota-gen.ts` + barrel export).
- `scripts/map-authoring/specs/hello_map.ts` (toolchain smoke test, superseded).
- Hand-rolled `tests/e2e/` harness (Vitest browser + Playwright + `tests/e2e/harness/`). Replaced by `tests/integration/` using `@rpgjs/testing`.
- `@vitest/browser` + `@vitest/browser-playwright` devDependencies.
- `vitest.config.build-time.ts` + `vitest.config.e2e.ts` — consolidated into a single `vitest.config.ts` with `test.projects`.
- `tsconfig.e2e.json` — no longer needed.
- `docs/build-time/E2E_HARNESS.md` — hand-rolled harness no longer exists.

## [Pre-pivot — spike/phaser-koota-revive] — historical, kept for context

### Added

- **Fan-tasy tileset family adopted as sole tileset source.** 6 biome packs (`core`, `seasons`, `snow`, `desert`, `fortress`, `indoor`) under `public/assets/tilesets/` with Tiled `.tmx`/`.tsx` sidecars intact. Sample maps (Village Bridge, Farm Shore, Mage Tower) usable as starting points for region authoring.
- **Asset tiering by animation depth.** `public/assets/bosses/` (animated: green-dragon, dread-knight, slime, fire-skull, zombie-burster) vs `public/assets/creatures/` (static wild-encounter sprites). Green dragon designated as final boss — only creature with a dedicated death animation.
- **Player sprite upgrade.** Fan-tasy Main Character (idle / walk / slash) replaces the Kenney Tiny Dungeon villager-yellow frame.
- **Consolidated CREDITS.md** under `public/assets/` with per-pack provenance.
- **Per-pack tileset PDFs** moved to `docs/tilesets/`.
- **CLAUDE.md** at repo root — agent entry point with project identity, critical rules, commands, structure.
- **AGENTS.md** — extended operating protocols for content-pipeline and asset-pipeline contracts.
- **STANDARDS.md** — code, content, and asset non-negotiables.

### Changed

- **Copyrighted-property references scrubbed** from docs, source comments, and schema descriptions. Game is now described as "creature-catching RPG"; in-game catalog is "lipu soweli." Only the vendored Tatoeba corpus (which is upstream CC BY 2.0 data) retains any such references.
- **`README.md`** gains YAML frontmatter for doc-standard compliance.

### Removed

- Previous Kenney / Lonesome Forest / Old Town / Natural Interior / Classic Dungeons tileset patchwork, along with the handwritten water-overlay workaround.
- `assets/purchased/` vendor-organized staging directory — superseded by in-game-role organization under `public/assets/`.

## Pre-spike — history on `main` before branching

This branch forked from commit `0a582e0 feat(starter): diegetic ceremony via jan Sewi dialog (#39)`.

Key milestones on `main` prior to the fork (most relevant):

- `0a582e0` — Diegetic starter ceremony via jan Sewi dialog
- `dc91d1d` — Region 7 (nasin pi telo) riverside fishing route
- `c85ca6e` — Region 6 (nena suli) great peak + jan Suli gym
- `906ad5c` — Water tile key + per-creature XP persistence
- `c72cbb8` — Region 5 (ma lete) cold land + jan Lete gym
- `6d9f380` — Region 4 (ma telo) lake village
- `103f3a5` — Region 3 (nena sewi) mountain pass + jan Wawa gym
- `e0a1c3c` — Species-driven combat + catch mechanic + auto-starter
- `a29f6b7` — Engine rewire to consume `generated/world.json`; procgen deleted
- `7719b6d` — Regions 1 + 2 spine (starter village, first route, 8 species, 10 moves, 4 items)
- `d2ed647` — Declarative content pipeline (Zod schemas + Tatoeba build step)
- `0d81c7b` — Build-time TP translator via vendored Tatoeba corpus
- `2f8c9f6` — Opening tutorial (jan Sewi)
- `19a9084` — Toki Town — Phaser RPG + Solid dialog + Koota ECS foundation

Godot-era commits (`main` from `1d924fe` through `0edfe61`) are intentionally absent — this spike picks up the Phaser+Koota direction from before that pivot.
