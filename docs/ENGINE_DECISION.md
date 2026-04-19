---
title: Engine Decision — Pivot to Godot 4
updated: 2026-04-19
status: accepted
domain: context
---

# ADR: Pivot Toki Town to Godot 4

## 1. Decision

Toki Town pivots from the current Vite + React + SolidJS + Phaser 4 + Koota web stack to a **Godot 4.6 native project, pure GDScript end-to-end**. The new project merges two real, working references we already own: structure, testing harness, mobile-export preset, and CI/CD come from `/Users/jbogaty/src/arcade-cabinet/ashworth-manor/`; the 2D tile-based RPG architecture (overworld, turn-based combat, dialogue, gameboard/pathfinder, encounter triggers) comes from `/Users/jbogaty/src/reference-codebases/godot-open-rpg/` (GDQuest's MIT-licensed Godot 4 Open RPG demo).

**The Node toolchain is retired in full.** `scripts/build-spine.mjs`, `validate-tp.mjs`, `fetch-tatoeba-corpus.mjs`, and the Zod schemas are ported to GDScript tool scripts under `res://tools/` that run both in the Godot editor and headless in CI via `godot --headless --script`. One language, one runtime, one toolchain. The authoring surface for teammates is unchanged — they still edit JSON in `content/spine/*.json` — but every validator, builder, and consumer of that JSON is now GDScript. The output is `.tres` files natively produced by `ResourceSaver.save()`, not hand-composed text.

**The Tatoeba corpus is also retired as a vendored artifact.** The 37k-pair `tatoeba.json` (multiple megabytes, bloating the repo) becomes a **live API call** to `tatoeba.org` via `HTTPRequest`. GDScript does HTTP natively — we hit Tatoeba's search API per new EN line at authoring / CI time, cache hits in a small `res://content/corpus/cache.json` keyed by normalized EN, and only re-query on cache miss. The cache is tiny (only what our game actually uses), commits cleanly, and warms itself as authors write. No bzip2 fetch step, no TSV parsing, no vendored multi-megabyte blob.

All load-bearing authored content — the 45 spine JSONs across 7 regions, 17 species, 17 moves, and 4 items, the writing-rules complexity scorer, and the agent-teams authoring workflow — survives. The spine JSONs move to `res://content/spine/`. The Zod schemas become GDScript `class_name Resource` definitions with `@export` annotations, and validation happens in the tool scripts.

## 2. Context — why leave the web stack

The current repo layers four separate runtimes (React shell, Solid overlays, Phaser scene, Koota ECS) and is beginning to cost more than it delivers. Concrete pain points, observed in the last two weeks of work:

- **Floating overlay debris.** `src/game/solid-ui/CombatOverlay.tsx` is already 649 LOC (largest file in the repo) and still does not own its own layout. The mount/unmount dance in `src/game/solid-ui/mountDialog.tsx` and the overlay z-layering between Solid and Phaser keeps regressing. Screenshots (`combat-test.png`, `dialog-test.png`, `dialog-try2.png`, `fit-adventure.png` at repo root) document the same chrome/scaling bugs being re-discovered.
- **Scaling-chrome friction.** The Phaser canvas, the React shell, the Solid overlays, and the browser chrome each have their own opinion about `resize`, safe-areas, and device-pixel-ratio. The `fit-mode.png` / `resize-mode-fix.png` / `mobile-adventure.png` screenshots are evidence that "make the game the right size on a phone" has been re-attempted at least five times.
- **Mobile story is duct tape.** `capacitor.config.ts` + `@capacitor/*` 8.x wraps the web build into an Android WebView. That works, but the native export presets, signing keys, and APK attestation story is something we'd build ourselves from scratch. Ashworth Manor already has a working Android debug APK export configured end-to-end (`export_presets.cfg:1-82` defines `com.arcadecabinet.ashworthmanor` targeting arm64-v8a + x86_64 with immersive mode).
- **Testing story.** 47 TS/TSX files, 5077 LOC, zero runtime tests. The only validators are Node CLIs (`scripts/validate-tp.mjs`, `scripts/validate-challenges.mjs`). We have no "is combat still solvable?" test, no "does the tilemap load?" test, no "does the dialog trigger fire?" test. Ashworth Manor's declaration + E2E suite (`test/generated/test_declarations.gd`, `test/e2e/test_full_playthrough.gd`, 4 more) runs headless in CI in under 2 minutes and blocks merges.
- **Fighting the tool.** Phaser 4 is still in alpha; its React-integration patterns are unstable. Koota is 0.6.6 and has no ecosystem beyond us. Every integration point (Phaser↔Solid, Solid↔React, Koota↔Phaser) is bespoke and re-invented.

Conversely, Godot 4.6 gives us one runtime, one editor, a real scene tree, first-class 2D tilemaps with baked colliders, A* pathfinding as a built-in class, `.tres` resources as a first-class data format, a working mobile export pipeline, and a mature testing addon (gdUnit4).

## 3. What ashworth-manor contributes

Ashworth Manor is **our** Godot project — a 3D PSX horror exploration game. We do not lift gameplay code from it (it's 3D first-person, Toki Town is 2D top-down RPG). We lift its **operating skeleton**. From a deep read of the repo:

- **Project structure conventions.** `project.godot:26-32` autoload pattern, `scripts/` flat layout for singletons, `scenes/` for `.tscn` entry points, `resources/` / `declarations/` for `.tres` data, `assets/` for media, `addons/` for gd-plug addons (`plug.gd:1-30` shows the pattern). `CLAUDE.md:29-87` documents the file layout contract. We mirror this in `toki-pona-tutor/godot/`.
- **Declaration-first authoring.** `AGENTS.md:34-56` and `declarations/` demonstrate that rooms are declared as `.tres` resources, not hand-authored `.tscn` scenes. This is directly compatible with our existing "content authors edit JSON, engine reads compiled output" model.
- **gdUnit4 testing.** `addons/gdUnit4/` is wired in. The ashworth convention is a hybrid: declaration-validation suites (`test/generated/test_declarations.gd:1-60` — loads `main.tscn`, runs assertions, prints PASS/FAIL counts, exits 0/1) run in headless CI; gdUnit4 proper handles richer unit tests (`test/unit/route_program_test.gd`); Maestro flows (`test/maestro/`) drive Android builds.
- **CI / release / CD triple.** `.github/workflows/ci.yml:1-91` runs six headless test suites on every PR using `barichello/godot-ci:4.6.2`. `.github/workflows/release.yml:1-79` uses `googleapis/release-please-action@v4` (`release-type: simple`, package name matches repo) to cut versioned releases, then exports Linux / Windows / HTML5 / Android artifacts and uploads them to the GitHub release. `.github/workflows/cd.yml:1-43` re-validates on every push to main as belt-and-suspenders. This is the `ci → release → cd` order our root `~/.claude/CLAUDE.md` mandates.
- **Mobile export preset.** `export_presets.cfg:1-82` — a working Android preset with `arm64-v8a=true`, immersive mode, signed debug APK output to `build/android/`, and extra command-line args for the Maestro E2E helper. We copy this preset and rename the package to `com.arcadecabinet.tokitown`.
- **Non-negotiable principles.** `CLAUDE.md:17-22` codifies three "critical rules" patterns: (1) docs → tests → code ordering, (2) every scene must be "alive" (no empty containers), (3) all text lives in data files not hardcoded strings. We adopt the same three rules for Toki Town, with Zod-validated spine JSON playing the `.dialogue` role.
- **gd-plug addon management.** `plug.gd:1-30` declarative addon list; `addons/` gets populated by `gd-plug install`. We keep this pattern but swap the addon set.

## 4. What godot-open-rpg contributes

GDQuest's Open RPG is MIT-licensed (`LICENSE:1-21`). Assets are CC0 Kenney Tiny Town (`CREDITS.md:43-46`) — exactly the art direction we've been using. It is written in GDScript 4, Godot 4.5+. We fork it as a starting template and replace its content. Lift-able subsystems:

- **Main scene + autoloads.** `project.godot:18-28` defines 9 autoloads: `Camera`, `CombatEvents`, `FieldEvents`, `Gameboard`, `GamepieceRegistry`, `Music`, `Player`, `Transition`, `Dialogic`. `src/main.tscn` is the root — too large to read in full (103k tokens) but its role is the scene switch between Field (overworld) and Combat.
- **Gameboard + pathfinder.** `src/field/gameboard/gameboard.gd:1-196` is a generic square-grid gameboard with A* pathfinder; it registers `GameboardLayer`s (TileMapLayer children tagged with a group) and handles door-blocking, gamepiece-occupied cells, and dynamic clearing. This is **exactly** our "tilemap with walkable + solid + encounter layers" model. Copy verbatim; retag our tile keys to the Kenney Tiny Town tileset.
- **Gamepieces + controllers.** `src/field/gamepieces/gamepiece.gd` + `gamepiece.tscn` + `controllers/player_controller.gd` + `controllers/path_loop_ai_controller.gd`. Grid-snapped movement, player input, and NPC patrol AI. Copy verbatim.
- **Combat loop.** `src/combat/combat.gd:26-246` is a complete turn-based JRPG combat driver: `setup(arena) → next_round → _select_next_player_action → _play_next_action → _on_combat_finished`. Two-phase rounds (all AI pick actions first, then each player battler picks via `UICombat`, then actors execute in speed order). Signal-based; clean; emits `CombatEvents.combat_initiated`, `combat_finished`. Copy verbatim.
- **Battlers.** `src/combat/battlers/battler.gd:1-217` — a Battler has `BattlerStats`, `Array[BattlerAction]`, `BattlerAnim`, optional `CombatAI`, `is_player`, `cached_action`, `turn_finished`, `health_depleted`. `battler_roster.gd`, `battler_stats.gd`, `battler_anim.gd` round out the file set. This maps 1:1 to our `species` + `move` schemas. Copy, then author `BattlerStats` / `BattlerAction` `.tres` files from our spine JSON.
- **Actions.** `src/combat/actions/battler_action_{attack,heal,modify_stats,projectile}.gd` — five action variants. Maps to our `move.effect` enum (`flinch`, `heal_self_25`, `raise_attack`, `lower_defense`, `poison`, `none`). Our schema's five effects are a strict subset of what these scripts express. Copy + implement `poison` + `flinch` via `battler_action_modify_stats` derivatives.
- **Field events bus.** `src/field/field_events.gd` — signals `combat_triggered`, `input_paused`, `cell_highlighted`, `interaction_started`, etc. This is the glue between overworld (tile step → encounter roll → `combat_triggered.emit(arena_scene)`) and combat. Copy verbatim.
- **Dialogic integration.** `project.godot:30-114` wires the Dialogic addon (`addons/dialogic/`). NPC dialog lives in `.dch` (character) and `.dtl` (timeline) files — `overworld/maps/town/` has 9 character timelines + 6 encounter timelines. We keep Dialogic as the runtime engine but **author timelines generated from our spine JSON** rather than hand-authoring.
- **Turn-based combat UI.** `src/combat/ui/` — action menu, battler entry widgets, cursors, effect labels, theme. All reusable.
- **Kenney Tiny Town tileset.** `overworld/maps/tilesets/town_tilemap.png` + `dungeon_tilemap.png` + `kenney_terrain.tres`. Already matches our current art direction.

**What collides with our ambitions.** We author declaratively from Zod/JSON and generate content; open-rpg authors via the Godot editor. Bridging this is the single largest engineering task of the pivot — see Section 6.

## 5. What Toki Town keeps

Nothing authored is thrown away. What survives:

- **Spine JSONs.** 45 files total across `src/content/spine/`: 7 regions (`ma_lete.json`, `ma_telo.json`, `ma_tomo_lili.json`, `nasin_pi_telo.json`, `nasin_wan.json`, `nena_sewi.json`, `nena_suli.json`), 17 species, 17 moves, 4 items, 1 `world.json`. Move to `godot/content/spine/`. Unchanged — JSON is JSON, Godot reads it natively with `JSON.parse_string`.
- **Writing rules + complexity scorer.** `docs/WRITING_RULES.md` — the rules document itself is language-agnostic and unchanged. The scorer that was in `scripts/validate-tp.mjs` (~80 LOC of JS) is rewritten as `res://tools/complexity_scorer.gd` (~80 LOC of GDScript). Same axes, same thresholds, same output format.
- **Tatoeba corpus — mode changes.** The 37k-pair vendored JSON (CC BY 2.0 FR) is **dropped from the repo**. Validation hits `tatoeba.org`'s search API via GDScript `HTTPRequest` at author/CI time. Hits are cached in `res://content/corpus/cache.json` (tiny — only what our lines use). On author time: in-editor tool populates the cache as they type. In CI: headless Godot replays the cache; only NEW EN lines hit the network.
- **Agent authoring workflow.** `docs/AGENT_TEAMS.md` worktree prologue, wave pattern, merge checklist, escalation protocol. Unchanged. Briefs in `docs/agent-briefs/region-team.md` and `docs/agent-briefs/species-team.md` get their "engine integration" sections rewritten to reference Godot scenes instead of Phaser scenes; **content file paths are identical**.
- **Architecture docs.** `docs/ARCHITECTURE.md`, `docs/STATE.md` get rewritten sections on tech stack and engine sketch. Game-design content (types, encounter mechanic, catch mechanic, progression gates) is unchanged.
- **Dictionary + challenges.** `src/content/dictionary.json` (32KB, useful TP dictionary data) and `src/content/challenges.json` migrate to `res://content/` unchanged.

What is **rewritten in GDScript**, not deleted:

- **Schema definitions.** `src/content/schema/*.ts` (11 TS files, Zod) → `res://schema/*.gd` (11 GDScript `class_name Resource` definitions with `@export` fields). Same shape, native Godot types. The `koota-gen.ts` bridge is dropped entirely (no Koota).
- **Build pipeline.** `scripts/build-spine.mjs` → `res://tools/build_spine.gd`. Reads JSON, validates against schema resources, emits `.tres` via `ResourceSaver.save()`. Runs in-editor on save or headless via `godot --headless --script res://tools/build_spine.gd`. `scripts/validate-tp.mjs` → `res://tools/validate_tp.gd` (complexity scorer + Tatoeba API call + cache).
- **Ancillary scripts.** `fetch-tatoeba-corpus.mjs` is **deleted outright** (no more vendored corpus). `fetch-dictionary.mjs` → `res://tools/fetch_dictionary.gd` if we still want it. `validate-challenges.mjs` → `res://tools/validate_challenges.gd`. `translate-dialog.mjs` → `res://tools/translate_dialog.gd`. `worktree-janitor.mjs` stays as the only retained shell/Node script (it manages git, not content).

## 6. Migration plan

Four weeks, clear deliverables per week. **The repo becomes a Godot project at its root** — no `godot/` subdirectory, no Node `scripts/`, no dual-language split. One language, one root, one toolchain.

### Week 1 — Bootstrap + delete + GDScript pipeline scaffold

- Fork `godot-open-rpg` into the repo root (replacing the `src/` web tree). Keep `LICENSE` + `CREDITS.md` as MIT attribution to GDQuest.
- Lift ashworth-manor's `.github/workflows/{ci,release,cd}.yml` retargeted at the Godot project root.
- Lift ashworth-manor's `export_presets.cfg`, rename package to `com.arcadecabinet.tokitown`.
- Lift ashworth-manor's `plug.gd` pattern; addons day 1 = `gdUnit4` + `Dialogic` (inherited from open-rpg).
- **Delete web stack in one commit**: `src/`, `dist/`, `scripts/`, `vite.config.ts`, `capacitor.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `pnpm-workspace.yaml`, `package.json`, `package-lock.json`, `index.html`, `public/`, `.tatoeba-cache/`, `*.png` screenshots at repo root. The Node `scripts/` directory is gone — not moved.
- **Move only JSON content**: `src/content/spine/` → `res://content/spine/`, `src/content/dictionary.json` → `res://content/dictionary.json`, `src/content/challenges.json` → `res://content/challenges.json`. No Zod, no TypeScript.
- Write 11 GDScript schema resources under `res://schema/` — `region.gd`, `species.gd`, `move.gd`, `item.gd`, `npc.gd`, `dialog.gd`, `translatable.gd`, `types.gd`, `world.gd`, `warp.gd`, `sign.gd`. Each is `class_name Resource` with `@export` fields.
- Placeholder gdUnit4 test that loads `main.tscn` and asserts autoloads exist.
- **Deliverable:** repo opens in Godot 4.6.2 as a root project. CI passes (one placeholder gdUnit4 test). Release-please creates v0.1.0 tag. Android APK exports. Node toolchain fully gone.

### Week 2 — GDScript pipeline + Tatoeba API + region 1 playable

Week 2 is the real content-side work. **No Node scripts at all.**

- **`res://tools/validate_tp.gd`** — porthole replacement for `validate-tp.mjs`.
  - Walks `res://content/spine/**/*.json` via `DirAccess`.
  - For each multi-word EN line: (a) run the complexity scorer inline (ports of the same axes from WRITING_RULES.md); (b) if rank > 40, fail with named axes; (c) if rank OK, check `res://content/corpus/cache.json` for a hit; (d) on cache miss, `HTTPRequest` to Tatoeba's search API (`https://tatoeba.org/eng/api_v0/search?from=eng&to=tok&query=...`), record result, append to cache; (e) if the API returns no TP pair, fail.
  - Runs in-editor via a `tool` annotation (menu: Project → Tools → Validate TP) and headlessly via `godot --headless --script res://tools/validate_tp.gd`.
  - Cache is committed to the repo. Only new lines hit the network.
- **`res://tools/build_spine.gd`** — porthole replacement for `build-spine.mjs`.
  - Reads each JSON, constructs a `RegionResource` / `SpeciesResource` / `MoveResource` / `ItemResource` instance, populates its `@export` fields, calls `ResourceSaver.save(resource, "res://content/generated/%s.tres" % id)`. `.tres` output is **committed** (small, diff-friendly, Godot import cache hates regeneration on every boot).
  - Emits one `world.tres` as a `WorldResource` with the region graph + start region.
  - Runs in-editor (tool menu entry) AND in CI via `--headless --script`.
- **`res://tools/complexity_scorer.gd`** — ~80 LOC of pure GDScript. The axes, thresholds, and output format from `WRITING_RULES.md`. Used by `validate_tp.gd`.
- **Tile key map**: `res://content/tile_keys.tres` — Kenney Tiny Town frame indices bound to our tile keys (`grass`, `tall_grass`, `path`, `tree`, `sign`, `water_deep`, etc.). Authored by hand once; never touched again.
- **Region loader**: `res://engine/region_loader.gd` reads `RegionResource.tres`, paints the `TileMapLayer`, spawns NPCs as `Gamepiece` nodes, arms warp tiles, registers the encounter table.
- **Port `nasin_wan`** (first route, 32×10, already authored). Walk it. Step into tall grass → encounter roll → transition to `combat.tscn`. Combat runs against a static test battler.
- **Deliverable:** player loads `nasin_wan.tres`, walks, grass encounters fire, combat loads. Node toolchain is gone and not missed. Tatoeba API validated live. Android APK installable and playable.

### Week 3 — Combat + dialogue + save

- Wire move effects: `flinch`, `heal_self_25`, `raise_attack`, `lower_defense`, `poison` map to `battler_action_modify_stats.gd` and `battler_action_heal.gd` derivatives. Each of our 17 moves gets a working implementation.
- Wire type matchups: extend `src/combat/elements.gd` with `seli / telo / kasi / lete / wawa` (the existing enum is replaced).
- Port catch mechanic: `BattlerAction` subclass `PokiThrow`, success = `(1 - enemy.hp/enemy.hp_max)^2 * species.catch_rate * poki.power + 0.15`. On success, add to party roster.
- Dialog: extend `res://tools/build_spine.gd` to also emit Dialogic `.dtl` timelines from each region's `dialog[]` array. Or — simpler path — a tiny `DialogResource` we read ourselves via a custom `DialogOverlay.tscn`. Decide week 3 day 1.
- Save/load using `ResourceSaver.save` + `ResourceLoader.load` to `user://save.tres`; encrypt on release per ashworth's `save/encryption_on_exports_only` pattern.
- gdUnit4 test suites:
  - `test/unit/test_type_matchups.gd` — the 5-type matrix.
  - `test/unit/test_catch_mechanic.gd` — at full HP vs fainting HP.
  - `test/unit/test_encounter_roll.gd` — weighted roll distribution.
  - `test/unit/test_complexity_scorer.gd` — known bad lines fail with named axes.
  - `test/unit/test_tp_cache.gd` — known good lines hit cache; known bad fail without network.
  - `test/e2e/test_region_load.gd` — every region `.tres` loads, every NPC has a dialogue target, every warp resolves.
  - `test/e2e/test_first_route.gd` — scripted walk of `nasin_wan` with encounter + win + continue.
- **Deliverable:** combat resolves correctly, NPCs talk, save/load round-trips, 7 gdUnit4 suites green in CI.

### Week 4 — Remaining regions, CI green, mobile build

- Port remaining 6 regions into runtime (spine JSON already authored for all 7 — just run `build_spine.gd`).
- Port items: `poki`, `poki_lili`, `poki_wawa`, `telo_pona`, `kili`.
- Set-piece `jan lawa` fights per region (data already in spine).
- Polish combat UI (reuse `src/combat/ui/ui_combat.tscn`). Swap open-rpg's theme for our amber/emerald palette.
- Port Pokedex screen (new; not in open-rpg). Reads `SpeciesResource` + player's `seen_ids[]` + `caught_ids[]`.
- Audio: lift ashworth's per-scene ambient loop pattern (`audio_manager.gd`). Kenney RPG Audio already in open-rpg `assets/`.
- Deep CI: gdUnit4 matrix across unit + integration + headless region-walkthrough. Release workflow cuts Android AAB (gradle), HTML5, Linux, macOS, Windows.
- **Deliverable:** seven regions playable end-to-end. CI green. Android AAB signed and uploaded. Playable demo at `https://jbogaty.github.io/toki-pona-tutor/`.

## 7. What we lose

Concrete, counted. Files deleted in Week 1, one commit, easy revert:

| Area | Files | LOC |
|------|-------|-----|
| React/Solid components (`src/components/`, `src/game/solid-ui/`) | 16 `.tsx` | ~3100 |
| Phaser scene + mount (`src/game/scenes/`, `src/game/PhaserGame.tsx`, `SolidMount.tsx`) | 4 `.ts`/`.tsx` | ~250 |
| Koota ECS (`src/game/ecs/`) | 3 `.ts` | ~300 |
| Combat engine (`src/game/combat/engine.ts`) | 1 | ~200 |
| GameBus, tiles, config (`src/game/`) | 3 | ~200 |
| Hooks, lib, top-level (`src/hooks/`, `src/lib/`, `main.tsx`, `App.tsx`) | 7 | ~600 |
| Web tooling: `vite.config.ts`, `capacitor.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `package.json`, `package-lock.json` | 8 | ~200 |
| Zod schemas + koota bridge (`src/content/schema/*.ts`) — rewritten as GDScript, not moved | 11 | ~400 |
| Node build/validate scripts (`scripts/*.mjs`) — rewritten as GDScript, not moved | 7 | ~800 |
| Vendored Tatoeba corpus blob (`src/content/corpus/tatoeba.json`, `.tatoeba-cache/`) — replaced by live API + tiny cache | — | 37k pairs, ~multi-MB |
| Screenshot debris at repo root | ~30 `.png` | — |
| **Total deleted** | **~50 files + tooling + 30 PNGs + corpus blob** | **~6050 LOC** |

Package.json dependencies fully gone: `react`, `react-dom`, `solid-js`, `phaser`, `koota`, `howler`, `canvas-confetti`, `seedrandom`, `lucide-react`, `@capacitor/*`, `vite`, `tailwind`, `zod`, and the full `node_modules/`. The `package.json` itself is deleted — the repo stops being a Node project.

What's kept (and sometimes re-shaped):

- **JSON content (unchanged)**: 45 spine JSONs + `dictionary.json` + `challenges.json` — direct move to `res://content/`.
- **Docs (lightly edited)**: `WRITING_RULES.md`, `AGENT_TEAMS.md`, agent briefs, `ARCHITECTURE.md`, `STATE.md`, `ENGINE_DECISION.md` (this file). Engine integration sections rewritten.
- **CI/CD patterns (replaced)**: the `ci → release → cd` triple pattern survives; the actual YAML comes from ashworth-manor.
- **New in GDScript (~300 LOC estimated)**: `tools/build_spine.gd` (~100), `tools/validate_tp.gd` (~120), `tools/complexity_scorer.gd` (~80), 11 schema resources (~200 combined), region_loader (~150). All told, the GDScript pipeline is smaller than the Node one it replaces.

The 4 in-work TSX components we rebuild as Godot scenes: `CombatOverlay` (649 LOC → combat/ui from open-rpg, already built), `DialogOverlay` (237 LOC → Dialogic or custom `.tscn`), `PartyPanel` (163 LOC → new `.tscn`), `ResultsScreen` (175 LOC → `.tscn`). Functionality survives; implementation is replaced.

## 8. Open questions

- **Repo layout.** Godot at the repo ROOT, not a subdirectory. The `toki-pona-tutor` repo becomes a Godot project top-to-bottom. `content/` and `docs/` live at root inside Godot's `res://` as `res://content/` and `res://docs/`.
- **Are `.tres` files committed?** Yes. They are diff-friendly text and avoid re-import storms on fresh clones. The `res://content/spine/*.json` stays as the authoring source of truth; `res://content/generated/*.tres` is re-emitted by `build_spine.gd` on edit.
- **How do we port dialog?** Two paths: (a) `build_spine.gd` emits Dialogic `.dtl` timelines from each region's `dialog[]` array; (b) a lightweight custom `DialogResource` + `DialogOverlay.tscn` we own. Decide day 1 of week 3 — if Dialogic on 4.6 is smooth, path (a); otherwise (b).
- **Kenney tileset coverage.** Our 7 biomes include ice (`ma_lete`), water (`ma_telo`), sky peaks (`nena_sewi`, `nena_suli`). Tiny Town is town + grass; Tiny Dungeon is interior. Supplementary Kenney packs for ice/water/sky are CC0; audit and merge in week 2.
- **Agent-teams workflow.** Unchanged. Teammates edit JSON in `res://content/spine/` via git worktrees. The orchestrator handles engine integration. Same division as today.
- **Web export as first-class deliverable?** Godot HTML5 is ~30MB. Decide in week 2 whether web demo is shipped or the mobile-first experience is the primary deliverable.

## 9. Risks

1. **Tatoeba API rate limits / availability.** Live API calls from CI mean a network outage or rate-limit ban blocks the build. Mitigations: (a) cache is authoritative and committed — CI only hits the API for NEW lines added in this PR; (b) cache hits are always used first; (c) if the API is down, CI warns but doesn't fail for lines already cached; (d) a `--offline` flag skips the API check entirely and trusts the cache. Budget 1 day in week 2 to get this right.
2. **Tatoeba API shape is not a frozen contract.** If they change the endpoint or response format, our validator breaks. Mitigations: pin the endpoint version (`api_v0` is explicit), wrap calls in `res://tools/tatoeba_client.gd` with clear error handling, version the cache format so stale caches are rebuilt on client change.
3. **Open-rpg uses GL Compatibility renderer** (`project.godot:209-211`, `rendering_method="gl_compatibility"`) for broad device support. Ashworth uses Forward+ (3D horror). For 2D mobile, GL Compatibility is correct — ship open-rpg's setting.
4. **Dialogic version drift.** Open-rpg targets Godot 4.5. We want 4.6.2 (ashworth's CI image). Verify Dialogic runs clean on 4.6 in week 1 day 1; fall back to 4.5 or pick path (b) for dialog if not.
5. **GDScript tool scripts + CI.** Running GDScript headlessly (`godot --headless --script res://tools/validate_tp.gd`) requires Godot to fully boot the project for autoloads and imports. First-time CI boot can be 30+ seconds. Cache `.godot/` between runs. Ashworth already does this — steal their cache keys.
6. **Single-commit deletion of the web stack is hard to undo.** Keep week 1 PR as one clean deletion commit. Revert is one click if we need to roll back.

---

**Report back to orchestrator.**

**Confidence:** high. Both reference projects are complete, working, and on disk. The merge is additive: ashworth's skeleton + open-rpg's RPG fits cleanly over our existing content. Nothing authored is lost. Retiring the Node toolchain collapses most of the migration risk — no cross-language serialization, no bzip2 corpus fetch, no vendored multi-MB JSON blob. One language, one runtime, one repo.

**Migration-week count:** 4 weeks to full port. Week 1 is the bootstrap + deletion; week 2 is the GDScript pipeline + first playable region; weeks 3–4 are content-shaped and parallelizable with agent teams.
