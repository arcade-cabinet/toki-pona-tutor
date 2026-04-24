---
title: Roadmap
updated: 2026-04-24
status: current
domain: planning
---

# Roadmap — Rivers Reckoning v2

This file tracks phase-level status and the stable task IDs for the v2 pivot. For the product spec see `docs/DESIGN.md`; for the PRD see `docs/plans/rivers-reckoning-v2.prq.md`. For per-phase detail and acceptance criteria see the PRD.

## Pivot summary

Rivers Reckoning pivoted at `v1.0.0-final` (tag on `main`) from a finite seven-beat story to a procedurally generated cozy open-world RPG. v1 remains shipped at its final tag; v2 lives on the `v2-main` long-lived feature branch until it's release-ready.

v1 phases (1-12) covered in the previous roadmap are **archived** — see `docs/archive/v1-story/` for the retired story docs, and the v1 task backlog (T1 through T91) is preserved in git history under tag `v1.0.0-final`.

## v2 phase status

| Phase | Name | Status | PRD task IDs | Blocker |
|---|---|---|---|---|
| 0 | Spec lock | **in progress** | T100-T107 | - |
| 1 | Scaffolding on `v2-main` | pending | T108-T111 | Phase 0 |
| 2 | World generator core | pending | T112-T120 | Phase 1 |
| 3 | Chunk persistence | pending | T121-T124 | Phase 2 |
| 4 | Economy + scaling | pending | T125-T132 | Phase 2 |
| 5 | Items + gear | pending | T133-T137 | Phase 4 |
| 6 | Dialog pool | pending | T138-T143 | Phase 2 |
| 7 | Challenge templates | pending | T144-T149 | Phase 6 |
| 8 | UI + UX | pending | T150-T156 | Phases 2, 6, 7 |
| 9 | Integration + cleanup | pending | T157-T163 | Phases 3-8 |
| 10 | Release | pending | T164-T168 | Phase 9 |

## Phase 0 — Spec lock (current)

All docs-only. Nothing in this phase touches code.

| Task | Description | Status |
|---|---|---|
| T100 | `docs/WORLD_GENERATION.md` | done (113d050) |
| T101 | `docs/ECONOMY.md` | done (58e475e) |
| T102 | `docs/DIALOG_POOL.md` | done (b0ce6c8) |
| T103 | `docs/QUESTS.md` v2 | done (02a13cd) |
| T104 | `docs/ROADMAP.md` rewrite | **in progress** |
| T105 | Archive v1 story docs | done |
| T106 | `CLAUDE.md` update for v2 | pending |
| T107 | `README.md` v2 pitch | pending |

Acceptance: all 8 tasks committed on `docs/v2-phase-0-spec-lock` branch. Reviewed and merged to `main`. v1 docs archived, v2 docs live.

## Phase 1 — Scaffolding

| Task | Description | Notes |
|---|---|---|
| T108 | Create `v2-main` branch from `main` | long-lived feature branch |
| T109 | `src/content/v2/` directory + JSON schemas | empty skeletons |
| T110 | `src/modules/v2/` stub modules | world-generator, chunk-store, reward-function, dialog-pool, challenge-template, rumor-resolver |
| T111 | Tag v1 as `v1.0.0-final` on `main` | preserves v1 deployment |

Acceptance: `v2-main` branch exists, skeletons committed, v1 tag in place.

## Phase 2 — World generator core

| Task | Description |
|---|---|
| T112 | Seed infrastructure (deterministic PRNG, seed display) |
| T113 | Chunk coordinate system + deterministic type assignment |
| T114 | Biome compass per seed |
| T115 | Outdoor chunk generator |
| T116 | Village chunk generator (slot-fill grammar) |
| T117 | Indoor chunk generator |
| T118 | Transitional edge chunks |
| T119 | First-chunk Guide constraint |
| T120 | Village-density constraint + sweep test |

Acceptance: `pnpm dev` boots into a seeded world; player walks between generated chunks; chunk types visibly vary; biome compass visible on pause-menu map.

## Phase 3 — Chunk persistence

| Task | Description |
|---|---|
| T121 | SQLite chunk-delta schema |
| T122 | Chunk-store module (load + persist-delta) |
| T123 | Save/resume integration with v1 save-strategy |
| T124 | Bestiary persistence (unchanged from v1) |

Acceptance: save, close tab, reopen, continue → same spot, same party, same deltas.

## Phase 4 — Economy + scaling

| Task | Description |
|---|---|
| T125 | Universal reward function |
| T126 | Party-strength calc |
| T127 | Encounter level formula |
| T128 | Drop-level formula + loot table lookup |
| T129 | XP curve rewrite (log-scaled) |
| T130 | Shop pricing formula |
| T131 | Inn heal pricing |
| T132 | Faint penalty (10% gold tax, respawn) |

Acceptance: combat feels fair at levels 5, 25, 50; prices scale; inn heals; faint respawns.

## Phase 5 — Items + gear

| Task | Description |
|---|---|
| T133 | Item schema expansion (potions, gear, materials, rare) |
| T134 | Gear equip system (1 slot per party creature) |
| T135 | Loot table (~100 items, tier-banded) |
| T136 | Shop inventories (template + template-sampled) |
| T137 | Chest placement in chunks |

Acceptance: loot populated; chests appear; shops varied; gear modifies stats.

## Phase 6 — Dialog pool

| Task | Description |
|---|---|
| T138 | Dialog pool schema + authoring format |
| T139 | Extract v1 dossier beats into the pool |
| T140 | Author ~2800 new lines (sub-tasks per role) |
| T141 | Deterministic-per-NPC subset selection |
| T142 | NPC name generator (adjective + noun pools) |
| T143 | Rumor system + directional resolver |

Acceptance: NPCs in same village say different things; rumors point at real chunks; level-banded dialog shifts on level-up.

## Phase 7 — Challenge templates

| Task | Description |
|---|---|
| T144 | Challenge template schema |
| T145 | Author the 10 cause × 3-5 effect variants |
| T146 | Parameterization at chunk realization |
| T147 | Challenge offer UI |
| T148 | Challenge resolve detection |
| T149 | Post-resolve degradation |

Acceptance: accept → resolve → reward round-trips for all 10 causes; resolved NPCs degrade correctly.

## Phase 8 — UI + UX

| Task | Description |
|---|---|
| T150 | Pause-menu world map |
| T151 | Chunk name surfacing in-game |
| T152 | Rumor journal |
| T153 | Challenge journal |
| T154 | Seed display on pause menu |
| T155 | Bestiary rework (no completion % nag) |
| T156 | New Game flow (seed picker) |

Acceptance: map renders; journals work; seed displayed; new-game flow complete.

## Phase 9 — Integration + cleanup

| Task | Description |
|---|---|
| T157 | Wire v2 world-generator into dev entry |
| T158 | Retire v1 content paths (green-dragon, NG+, rematch, journey, quests) |
| T159 | Retire v1 content files (regions/, tiled/, assets/maps/) |
| T160 | Retire v1 build-time tests tied to retired content |
| T161 | Retire v1 integration tests (journey-golden-path, dossier-npc-runtime) |
| T162 | Add v2 build-time tests |
| T163 | Add v2 integration tests |

Acceptance: v1 content gone; build clean; retired tests removed; v2 tests pass.

## Phase 10 — Release

| Task | Description |
|---|---|
| T164 | Update CI/release/CD workflows if needed |
| T165 | Tag `v2.0.0-alpha.1` from `v2-main` |
| T166 | Playtest on iPhone Safari + Android debug APK |
| T167 | Iterate alpha → beta → v2.0.0 |
| T168 | Merge `v2-main` → `main` on `v2.0.0` tag |

Acceptance: `v2.0.0` tagged, Pages deployed, playtested on real devices, merged to main.

## What changed from v1

v1's Phases 1-12 tracked: runtime stability → gate parity → maps → combat → story density → quest chains → mobile QA → audio → launch readiness. All completed or retired — see `v1.0.0-final` tag for the final state.

v2 starts fresh. The 10 phases above are the only authoritative work until v2.0.0 ships.

## Task ID convention

v1 tasks: `T1` through `T91`. **Closed.** Preserved in git history.

v2 tasks: `T100+`. Increment as new work is added; never reuse v1 IDs.

## How to contribute

Pick an unblocked task from the current phase. Read the relevant spec doc (linked from PRD). Open a PR to `v2-main` with the task ID in the title (e.g. `feat(v2): T115 outdoor chunk generator`). Merge after CI green.

## Related

- `docs/plans/rivers-reckoning-v2.prq.md` — canonical PRD with full task detail.
- `docs/DESIGN.md` — product spec.
- `docs/WORLD_GENERATION.md`, `docs/ECONOMY.md`, `docs/DIALOG_POOL.md`, `docs/QUESTS.md` — system specs.
- `docs/archive/v1-story/` — retired v1 creative docs (reference only).
