---
title: Rivers Reckoning v2 — Open-World Pivot PRD
created: 2026-04-24
version: 2.88
status: draft
priority: P0
timeframe: multi-sprint
---

# Rivers Reckoning v2 — Product Requirements

## Overview

Rivers Reckoning pivots from a finite 7-map creature-catching story to a **procedurally generated cozy open-world RPG** with JRPG combat and catching mechanics kept from v1. The game becomes infinite, seeded, persistent, and structurally self-generating from a grammar extracted from the v1 hand-crafted maps. Spec: `docs/DESIGN.md` v2.

## Priority: P0 — this is the new game

**Refactored in place on `main`.** The game does not need to stay working during the pivot; each phase deletes v1 code and adds v2 code. `v1.0.0-final` tag is already pushed as a historical snapshot only (not a rollback target, not a deployment branch). PRs land directly on `main` through feature branches; the current engine may fail to boot cleanly between Phase 1 (v1 teardown) and Phase 2 (world-gen wire-up), which is expected.

## Success Criteria (from DESIGN.md)

1. A new seed gives ≥1 hour of novel chunks before visual fatigue.
2. Every generated village has shop, inn, ≥4 NPCs, named buildings, and ≥1 challenge available.
3. Combat stays fun at levels 5, 25, and 50.
4. Save/resume round-trips chunk deltas.
5. Seeds are reproducible — same seed + same actions = same world.
6. iPhone Safari + Android debug APK both run end-to-end on a real device.
7. No softlocks. Faint → respawn at last inn with 10% gold tax.
8. Docs match reality; stale frontmatter dates are bugs.

## Out of Scope

- Dialog voice acting, localization.
- Multiplayer / co-op.
- Day/night cycle (post-v2).
- Seasonal / weather events (post-v2).
- In-game seed editor / sharing UI (post-v2).
- Porting any code path that assumed finite progression (green-dragon event, NG+, rematch, quest turn-in flags, badge derivation, proofs_all_four).

---

## Work Phases

### Phase 0 — Spec Lock (docs only, no code)

Before any code change, finalize the specs so tasks in later phases don't churn.

- **T100** Write `docs/WORLD_GENERATION.md` — chunk grid, biome archetypes + transitional edges, village archetypes + slot grammar, adjacency rules, biome-compass directional bias, deterministic pre-planting, first-chunk Guide constraint, village-density constraint, seed-name generator with semantic clustering, pause-menu world map.
- **T101** Write `docs/ECONOMY.md` — universal reward function signature, tier-band scaling formulas, party-strength weighting, loot table schema, XP curve (logarithmic), gold sinks (shops, inns), item slot schema (do creatures equip gear? does Rivers?).
- **T102** Write `docs/DIALOG_POOL.md` — role × context × mood × level-band schema, authoring format, deterministic-per-NPC subset selection, extraction plan for v1's 81 dossier NPCs into the tagged pool.
- **T103** Write `docs/QUESTS.md` v2 — the 10 challenge causes, effect kinds, parameterization rules, NPC challenge-offer lifecycle, resolve-once-then-degrade behavior. Replaces v1 `docs/QUESTS.md` content (archive v1 version to `docs/archive/`).
- **T104** Rewrite `docs/ROADMAP.md` — retire Phase 5-12 rows (finite content work); replace with v2 phase map derived from this PRD. All v1 task IDs (T51-T91) archived as "v1 complete."
- **T105** Archive `docs/STORY.md`, `docs/STORY_BEATS.md`, `docs/LORE.md`, `docs/JOURNEY.md` to `docs/archive/v1-story/` with frontmatter `status: archived` + one-line pointer forward.
- **T106** Update `CLAUDE.md` project section — point at v2 docs, kill stale v1 rules (e.g. "four region masters" is gone).
- **T107** Update `README.md` — v2 pitch for a reader stumbling into the repo.

### Phase 1 — Scaffolding + v1 teardown

In-place. Delete v1 runtime modules and scaffold the new module shape. Engine may not boot after this phase — acceptable until Phase 2.

- **T108** Delete v1 runtime progression modules: `src/modules/main/green-dragon.ts`, `new-game-plus.ts`, `rematch.ts`, `quest-runtime.ts`, `quest.ts`, `quest-npc.ts`, `badge-derivation.ts`, `journey-beat.ts` (if present). Delete their unit tests. Update any remaining import sites to fail-closed or stub.
- **T109** Restructure `src/content/` — retain `spine/species/`, `spine/moves/`, `spine/items/` (pure data, carries forward); delete `spine/dialog/`, `spine/journey.json`; move `regions/` dossier NPCs to `legacy/v1-npcs/` if useful as dialog-pool seed corpus, else delete; delete `gameplay/quests.json`, `gameplay/events.json` (quest turn-ins), `gameplay/progression.json` (badge config).
- **T110** Scaffold new module skeletons: `src/modules/world-generator.ts`, `src/modules/chunk-store.ts`, `src/modules/reward-function.ts`, `src/modules/dialog-pool.ts`, `src/modules/challenge-template.ts`, `src/modules/rumor-resolver.ts`. All stubs with typed signatures + `throw new Error('unimplemented')` bodies. No `v2/` subdirectory — the whole codebase is v2 after this phase.
- **T111** `v1.0.0-final` tag — **already pushed**. No further work.

### Phase 2 — World Generator Core

- **T112** Seed infrastructure: deterministic PRNG with `seedrandom` or `alea`. Seed parseable from string OR number OR generated at New Game. Seed display in pause menu.
- **T113** Chunk coordinate system + deterministic type assignment: given `(seed, x, y)` → `chunk_type` (outdoor-biome / village-archetype / cave / shrine / etc.). Pure function; no state.
- **T114** Biome compass per seed: direction-bias vectors for each biome archetype, seeded. Function: `(seed, x, y) → biome_weights`.
- **T115** Outdoor chunk generator: given a `chunk_type` + `(x, y)` + seed, produce a runtime chunk with tile grid, collision layer, encounter zones, NPC spawn points. Use v1's `scripts/map-authoring/` grammar as the palette.
- **T116** Village chunk generator: slot-fill grammar (shop / inn / elder-house / residents) per village archetype. Building placement + door warps + interior chunk linkage.
- **T117** Indoor chunk generator: shop interior, inn interior, house interior, cave interior, shrine interior archetypes. Simpler grammar than outdoor.
- **T118** Transitional edge chunks: forest→plain, forest→snow, plain→coast, etc. Chosen automatically when adjacent chunk types would otherwise clash.
- **T119** First-chunk constraint: on a fresh save, generate the starting chunk as a Guide-hostable type with a Guide NPC placed at a known spawn. Plug the starter ceremony in.
- **T120** Village-density constraint: chunk-type assignment (T113) must guarantee a village within Chebyshev distance ≤3 from any point. Validated by a build-time sweep test.

### Phase 3 — Chunk Persistence

- **T121** SQLite schema for chunk deltas: `chunk(id, x, y, seed, visited_at, delta_json)` + tables for NPC state, challenge state, chest state, catch state.
- **T122** Chunk-store module: `loadChunk(x, y)` reads base + applies deltas. `persistDelta(x, y, delta)` appends. Deltas flush on chunk exit + on save-game.
- **T123** Save/resume integration: hook into v1's `src/platform/persistence/save-strategy.ts`. New seed on New Game; resume restores seed + chunk deltas.
- **T124** Bestiary persistence unchanged from v1 (already works).

### Phase 4 — Economy + Scaling

- **T125** Universal reward function: `reward(player_level, source_modifier, tier_multiplier) → { gold, maybe_item }`. Used by wild defeat, catch, chest, challenge resolve, rare find.
- **T126** Party-strength calc per DESIGN.md: `0.3 × mean(filled) + 0.7 × max(filled)`. Used in encounter level formula.
- **T127** Encounter level formula: `clamp(chunk_tier × 5 + party_strength ± 2, 1, 99)`. Wired into the v1 encounter roll.
- **T128** Drop-level formula + loot table lookup. Items + gear scaled by drop_level.
- **T129** XP curve rewrite: `xp_needed(n) = base × log2(n+1) × scale`. Tune base/scale so level 1→5 takes ~30 encounters and level 50→55 takes ~200.
- **T130** Shop pricing formula: prices scale with `chunk_tier` and `player_level` so far-out shops sell stronger items at proportional prices.
- **T131** Inn heal pricing: flat % of party_strength × tier_multiplier.
- **T132** Faint penalty: 10% gold tax, respawn at last inn or Guide chunk. No bestiary/party loss.

### Phase 5 — Items + Gear

- **T133** Item schema expansion: beyond v1's capture pods + fruit, add consumable potions, equippable gear (if gear is in scope), rare materials. Spec in ECONOMY.md.
- **T134** Gear equip system (iff decided in T101): slot per party member, stat modifiers, swap from inventory.
- **T135** Loot table: ~100 distinct items spanning level 1-99 in log-scaled bands. Weighted table definitions keyed by source type.
- **T136** Shop inventories: each village archetype defines a shop template that samples the loot table by local tier. 5-8 items in stock at any time.
- **T137** Chest placement in chunks: outdoor chunks have 0-1 chests, indoor chunks have 0-2, rare chunks have 2-4. Contents roll from the loot table on first open, persist in chunk delta.

### Phase 6 — Dialog Pool

- **T138** Dialog-pool schema: `pool[role][context][mood][level_band] → [lines]`. Authoring format is a TypeScript record or JSON with frontmatter-style tagging.
- **T139** Extract v1's 81 dossier NPC beats into the pool. Tag each beat with role/context/mood/level-band. Preserve good lines; drop lines tied to specific v1 NPCs (rival reveals, badge mentions).
- **T140** Author ~2800 new lines to reach the ~3000 target: 15 roles × 4 level bands × ~50 lines each, minus whatever v1 seeded. Split into authoring sub-tasks by role.
- **T141** Deterministic-per-NPC subset selection: given `(seed, chunk, npc_id)`, pick a stable subset of lines from the pool so the same NPC says consistent things across revisits.
- **T142** NPC name generator: `adjective + noun` first-name pool. ~60 adjectives × ~80 nouns = ~4800 unique names. Clustered semantically (warm-texture adjectives for villagers, stern-texture for guards, etc.).
- **T143** Rumor system: rumor template pool + directional resolver. Given a rumor template and the seed's chunk grid, find a matching unvisited chunk within a reasonable radius and emit the rumor with correct direction + distance.

### Phase 7 — Challenge Templates

- **T144** Challenge template schema: `{ cause_kind, effect_kind, parameters_schema, challenge_line_pool, resolve_line_pool, reward_modifier }`.
- **T145** Author the 10 cause templates from DESIGN.md §Optional challenges with 3-5 effect variants each = ~40 base templates.
- **T146** Parameterization at gen-time: species-in-chunk sampling, biome-feature sampling, named-NPC sampling, item sampling. Produce a valid challenge instance per NPC per chunk on realization.
- **T147** Challenge offer UI: NPC dialog surfaces the challenge as an opt-in (accept / decline / defer). Accepted challenges go into a journal UI.
- **T148** Challenge resolve detection: runtime watches for the response condition (catch X, defeat Y, deliver Z). On resolve, NPC dialog switches to thanks line, reward function fires, challenge marked resolved in chunk delta.
- **T149** Post-resolve degradation: over in-game time, resolved NPC's thanks line decays to ambient flavor (retaining memory but not repeating).

### Phase 8 — UI + UX

- **T150** Pause-menu world map: renders visited chunks colored by biome, named with chunk seed-name, silhouettes nearby unvisited rare chunks, shows player position.
- **T151** Chunk name surfacing in-game: top-of-screen chunk name overlay on entry, fades after 2s. Mirrors Zelda/BOTW discovery beat.
- **T152** Rumor journal: pause-menu tab listing active rumors with direction + distance hints.
- **T153** Challenge journal: pause-menu tab listing active challenges with source NPC + progress indicator.
- **T154** Seed display on pause menu: shows current seed string so players can share / note / restart.
- **T155** Bestiary rework: remove "completion %" nag (no dex panic). Show count + recent encounters instead.
- **T156** New Game flow: seed picker (random button + manual entry field + preset "famous seeds" list for demos).

### Phase 9 — Integration + test cleanup

Most v1 teardown happened in Phase 1. Phase 9 wraps tests that survived and adds v2 test coverage.

- **T157** Wire world-generator into `src/standalone.ts` dev entry — replaces v1 tiled-map folder registration with the chunk-realize pipeline.
- **T158** Delete any remaining v1-only tests (surface check after Phase 2-8 work).
- **T159** Delete v1 integration tests (journey-golden-path, dossier-npc-runtime).
- **T160** Delete v1 build-time tests tied to retired content (dossier-*, events-dialog-ids, etc.).
- **T161** (retired — subsumed by T159/T160.)
- **T162** Add v2 build-time tests: chunk-type determinism, village-density sweep, biome-compass consistency, loot-table log-scaling, dialog-pool role coverage.
- **T163** Add v2 integration tests: fresh-save spawns Guide, challenge accept→resolve→reward round-trips, chunk-delta save/resume, faint→respawn.

### Phase 10 — Release

- **T164** Update `ci.yml` / `release.yml` / `cd.yml` if needed (mostly unchanged — still a vite bundle).
- **T165** Tag `v2.0.0-alpha.1` on `main`. Deploy Pages.
- **T166** Playtest on iPhone Safari + Android debug APK. Fix surfaced blockers.
- **T167** Iterate alpha → beta → v2.0.0 (tags on `main`).
- **T168** Tag `v2.0.0` on `main`. v1 remains accessible via `v1.0.0-final` tag.

---

## Dependencies

- Phase 0 (spec lock) blocks everything.
- Phase 1 (scaffolding) blocks Phase 2+.
- Phase 2 (world-gen core) blocks Phases 3, 4, 6, 7, 8.
- Phase 3 (chunk persistence) can proceed in parallel with Phase 4 once Phase 2 is live.
- Phase 4 (economy) blocks Phase 5 (items — loot table needs reward function).
- Phase 6 (dialog pool) blocks Phase 7 (challenges — templates reference dialog pool).
- Phase 8 (UI) depends on Phase 2 + 6 + 7 (needs world + dialog + challenges to surface).
- Phase 9 (integration/cleanup) requires everything above live on main.
- Phase 10 (release) is terminal.

## Acceptance Criteria per Phase

**Phase 0**: All 8 docs (WORLD_GENERATION, ECONOMY, DIALOG_POOL, QUESTS, ROADMAP, archive pointers, CLAUDE.md, README.md) committed on a docs-only branch. Reviewed and merged.

**Phase 1**: `main` branch exists. Empty skeleton committed with JSON schemas. `v1.0.0-final` tag on main.

**Phase 2**: `pnpm dev` boots into a seeded world. Player can walk between generated chunks. Chunk types visibly vary. Biome compass visible on pause-menu map.

**Phase 3**: Save game, close tab, reopen, continue — player lands in the same spot with the same party, same chunk deltas intact.

**Phase 4**: Combat numbers feel fair at levels 5, 25, 50. Shop prices scale. Inn heals cost. Faint respawns correctly.

**Phase 5**: Loot table populated. Chests appear in chunks. Shops sell varied inventory. Dropped gear modifies stats (if gear-equip is in scope).

**Phase 6**: NPCs in same village say different things. Rumor system points at real chunks. Level-banded dialog shifts as player levels up.

**Phase 7**: Challenge accept→resolve→reward round-trip works. 10 cause kinds all instantiate at least once per seed. Resolved NPCs degrade correctly.

**Phase 8**: Pause-menu map renders correctly. Rumor + challenge journals work. Seed displayed.

**Phase 9**: v1 content gone. Build clean. All retired tests removed. New v2 tests pass.

**Phase 10**: `v2.0.0` tagged. Pages deployed. Playtested on real devices.

## Risks

1. **Content load underestimate.** 3000 dialog lines is a lot. May need to cut to 1500 with heavier combinatorial variation to ship faster.
2. **Proc-gen looks bad on phone.** Tile permutations look fine in desktop preview but feel samey on 400px mobile screens. Mitigation: chunk-appearance variation skewed toward mobile-legible diffs (major color/silhouette, not micro-texture).
3. **Performance.** SQLite chunk-store on mobile Safari may stutter. Mitigation: profile early; fallback to IndexedDB if SQLite is rough.
4. **Determinism bugs.** Any hidden RNG not seeded produces seed-inconsistent worlds. Mitigation: centralize all RNG through the seeded generator; lint against `Math.random` calls outside the generator.
5. **Scope creep.** "While we're pivoting, let's also add day/night." No. Post-v2 explicitly.
6. **Playtest surface.** A procedural game needs more playtest hours than a finite one to find edge cases. Budget real-device playtest time in Phase 10.

## Technical Notes

- New code lives in flat `src/modules/` and `src/content/` paths (no `v2/` prefix). v1 modules are deleted in Phase 1 rather than preserved alongside.
- Determinism sanctity: a single `createRng(seed)` factory is the ONLY RNG entry point for world-gen. Tests enforce this.
- Dialog pool authoring can parallelize — spin a content agent for each role's line pool once the schema is locked.
- Map-authoring pipeline (`scripts/map-authoring/`) retires in Phase 9. Its learnings inform the world-generator's grammar but the spec files themselves become reference-only.

## Sequencing Note

Phases 0 (spec lock) and 1 (scaffolding) are user-facing decisions + structural setup — 1-2 weeks wall-clock. Phases 2-9 are the bulk of v2 engineering. Phase 10 is release polish. No phase individually is a weekend; the PRD assumes months of iterative work.

---

## Related

- `docs/DESIGN.md` — product vision (source of truth).
- `docs/ROADMAP.md` — phase-level status (to be rewritten).
- `docs/archive/v1-story/*` — preserved v1 creative docs for reference.
- `.claude/state/task-batch/` — task-batch state if a batch runs against this PRD.
