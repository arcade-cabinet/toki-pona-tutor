---
title: Current State
updated: 2026-04-19
status: current
domain: context
---

# Where we are

**2026-04-19 — post-pivot, content pipeline + first region live.**

Toki Town is a Godot 4.6 native project. The old Vite/React/SolidJS/Phaser/Koota web stack was retired entirely — see `docs/ENGINE_DECISION.md`. All tooling is GDScript; all content is committed JSON → compiled `.tres` Resources.

## What works today

- **Project boots.** `make run` opens the editor; press Play, the scene loads.
- **Content pipeline.** `make validate` and `make build` run the full authoring flow in pure GDScript:
  - `tools/complexity_scorer.gd` — writing-rules scorer (rank 0-100, ceiling 40)
  - `tools/tatoeba_client.gd` — live HTTPClient to Tatoeba, results cached in `content/corpus/cache.json` (33,830 keys seeded from the old 37k-pair vendored blob; network only for new lines)
  - `tools/validate_tp.gd` — walks `content/spine/`, runs scorer + cache/API, exits 0/1
  - `tools/build_spine.gd` — emits .tres Resources per region/species/move/item, plus a top-level `content/generated/world.tres`
- **Content bank.** 7 regions, 17 species, 17 moves, 4 items authored in JSON. 123 multi-word translatable lines validated canonical.
- **Brand identity.** Warm/cute amber + emerald + parchment palette in `theme/toki_theme.tres`, Google Fonts (Nunito body / Fredoka display / JetBrains Mono / nasin-nanpa for sitelen-pona), rounded UI chrome. No Kenney pixel fonts.
- **First playable region.** Boot the project and the main scene hydrates `ma_tomo_lili` (20×14 starter village) from `world.tres`:
  - Painted tile grid from the region layers
  - 3 NPCs with dungeon-atlas sprites + TP name labels (jan Sewi, jan Pona, jan Telo)
  - 2 signs at authored tile positions
  - Player gamepiece spawned at region.spawn with the open-rpg generic character gfx + player controller — player walks with WASD / arrow keys
  - Camera follows the player

## What's not wired yet (known next steps)

- **NPC interaction**: pressing space near an NPC doesn't open dialog yet. Need an `NpcInteraction` Area2D + input handler that reads `region.dialog[]` for the matching npc and activates the dialog overlay.
- **Dialog overlay**: Dialogic ships with open-rpg but throws a runtime warning on Godot 4.6 (`subsystem_text` Dictionary vs String). Decide: (a) patch Dialogic for 4.6, or (b) write a lightweight `DialogOverlay.tscn` that reads our `DialogResource`.
- **Encounter trigger**: stepping onto a `tall_grass` tile doesn't roll yet. Need a tile-step watcher that consults `region.encounters[]`.
- **Combat handoff**: encounter roll → `combat.tscn` with the chosen species as wild combatant. open-rpg's Battler system is in-tree; needs binding to our `SpeciesResource`.
- **Save / load**: addons/save_system/ is in-tree but not wired to party / flags / current_region.
- **Region transitions**: warps defined in spine but not activated; stepping on a warp tile should transition to the target region.

## Addons in-tree (vetted, gd-plug-manifest mirrored)

- `gdUnit4` — testing
- `godot_mcp` — WebSocket editor control for agents
- `gd-plug` + `gd-plug-ui` — addon manifest
- `save_system`, `quest_system`, `gloot` — RPG infra replacements for dict-based state
- `dialogic` — from open-rpg (pending 4.6 compatibility decision)
- `dialogue_manager` — alternative to Dialogic
- `AdaptiSound`, `phantom_camera`, `limboai` — reserved (music layering, boss cams, battler AI trees)
- `godot_material_footsteps`, `shaky_camera_3d` — less likely needed for 2D; retained for completeness

## Build + test

```bash
make validate   # writing rules + Tatoeba cache (offline)
make build      # emit .tres from spine JSON
make run        # open editor
make test       # gdUnit4 headless (no tests yet)
```

CI runs `ci.yml` on PR: import + parse check + validate + build. `release.yml` cuts release-please tags on main and exports Linux/Windows/HTML5/Android.

## Pivot branch

All work lives on `pivot/godot`. 8 commits so far:

1. `docs: ADR — pivot Toki Town to Godot 4, pure GDScript`
2. `chore: delete web stack, move content to repo root`
3. `chore(pivot): lift godot-open-rpg as engine base`
4. `chore(pivot): bootstrap Godot project — open-rpg base + ashworth skeleton`
5. `feat(brand): Toki Town warm/cute identity + Google Fonts + mobile renderer`
6. `feat(pipeline): pure GDScript content pipeline — Tatoeba API + scorer + builder`
7. `feat(engine): first playable region — RegionBuilder hydrates ma_tomo_lili`
8. `feat(engine): NPCs + signs render with sprites; player gamepiece spawns`

Merge to main when the next slice (interaction + encounter + combat handoff) lands — at that point the demo is self-evident.
