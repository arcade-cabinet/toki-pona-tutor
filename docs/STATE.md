---
title: Current State
updated: 2026-04-19
status: current
domain: context
---

# Where we are — 2026-04-19

**Mid-revive.** The Godot engine experiment on `main` created more problems than it solved; this branch (`spike/phaser-koota-revive`) is a clean revive of the pre-Godot Phaser + Koota stack from commit `0a582e0`, modernized with:

- A unified **Fan-tasy tileset family** (6 biome packs with Tiled `.tmx`/`.tsx` support) replacing the old Kenney/Lonesome-Forest/Old-Town patchwork that drove tonal inconsistency.
- **Tiled adopted as the map authoring format** (no more JSON tile arrays, no more region schema).
- **Scaffolding ported from `remarkablegames/phaser-rpg`** (Phaser 3 template modernized to Phaser 4 + Solid + TS strict).
- **Boss vs. creature tiering** by animation depth — green dragon reserved as final boss.

## Just landed in this PR

### Doc standard compliance (complete)

- `CLAUDE.md`, `AGENTS.md` — agent entry points
- `STANDARDS.md` — code/content/asset/process non-negotiables
- `CHANGELOG.md` — Keep-a-Changelog, rooted at `0a582e0`
- `README.md` — frontmatter + rewrite
- `docs/DESIGN.md` — product vision
- `docs/LORE.md` — 7 regions + 17 species + named NPCs, canonical
- `docs/DEPLOYMENT.md` — honest stub
- `docs/ARCHITECTURE.md` — rewritten for Fan-tasy + Tiled + journey

### Asset unification (complete)

- 6 Fan-tasy biome packs unpacked under `public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/`
- Per-pack PDFs moved to `docs/tilesets/`
- Character/boss/creature/NPC tiering under `public/assets/{player,bosses,creatures,npcs,combatants,effects}/`
- `public/assets/CREDITS.md` consolidated licenses
- Original archives preserved in `pending/`

### Copyrighted-reference scrub (complete)

- 7 source files + 4 docs scrubbed of trademark references
- Corpus data files (upstream CC BY 2.0) intentionally untouched

## In flight (this PR continues)

### L0 — Architecture + state docs ✅ (this commit)

Rewrite `docs/ARCHITECTURE.md` and `docs/STATE.md` for the post-leapfrog architecture.

### L1 — Foundation

Port `Boot.ts` / `Main.ts` / `Menu.ts` / `Player.ts` / `constants/*` from `remarkablegames/phaser-rpg` to Phaser 4 + Solid + pnpm. Build one test map (`public/assets/maps/ma_tomo_lili.tmj`) from Fan-tasy's Village Bridge sample. Delete `src/game/tiles.ts`, `src/game/content/tile-keys.ts`, `src/game/scenes/RegionScene.ts`. Player walks around.

### L2 — Test harness

Vitest browser mode + Playwright (chromium). `tests/harness/` primitives + `window.__toki_harness__` inspector. First test: foundation — boot, map renders, player walks.

### L3 — Journey manifest

Zod schema for `journey.ts`. Write `src/content/spine/journey.json` materializing the 7-region arc from `docs/LORE.md`. Write `docs/JOURNEY.md` as the prose/creative-writing pass. Delete `src/content/schema/region.ts` + tile arrays from `src/content/spine/regions/*.json`.

### L4 — Interaction layer

Tiled `Objects` layer — spawn point + signs + NPCs as markers. Port selector-body pattern from reference. Port Typewriter from `phaser-jsx` to Solid.

### L5 — Dialog + NPCs + starter ceremony

Per-NPC dialog JSON under `src/content/spine/dialog/`. jan Sewi starter ceremony: three-choice starter, party populated at L5, 3×`poki_lili` granted, `starter_chosen` flag set.

### L6 — Warps + multi-map

Second map (`nasin_wan`). Warp object-layer markers.

### L7 — Encounters + combat

`Encounters` object layer with weighted species tables. Combat engine + overlay wired to new scene.

### L8 — Rival + gym

jan Ike set-piece at `nasin_wan`. jan Telo gym at `ma_telo` unlocked by catch count.

### L9 — Final docs

`docs/ROADMAP.md` / `SLICE_CHECK.md` / `TESTING.md` / `ASSET_PIPELINE.md` — all describing what's actually built.

### L10 — Polish + PR

Full test suite green. CHANGELOG update. PR against `main`.

## Locked design decisions

- **Creature-catching RPG.** Party of up to 6. Catch wild with **poki** (net). Five types: seli/telo/kasi/lete/wawa. Seven regions. Set-piece jan-lawa fights gate region boundaries. No player stats.
- **Green dragon is the final boss.** Only creature with a dedicated death animation. Never appears mid-game.
- **Fan-tasy is the only tileset family.** No mixing. Tonal consistency is the headline feature.
- **Tiled is the map authoring format.** Region layout + triggers + NPCs + warps live in `.tmx` object layers. JSON is for content (species, moves, dialog), not layout.
- **Docs > tests > code.** Strict dependency chain; tests never chase code.
- **No copyrighted references.** Never Pokemon/Pokedex/Pokeball. "lipu soweli" for the catalog, "poki" for the net, "jan lawa" for region masters. See `STANDARDS.md`.
- **Kid audience.** Dread knight, not death knight. Fierce but friendly. No permadeath.

## Context for the next session

If you land here mid-batch:

1. Read the task-batch state: `cat .claude/state/task-batch/batch-phaser-revive.json`
2. Read the PR-in-progress: `git log --oneline -10` on `spike/phaser-koota-revive`
3. The reference repo lives at `~/src/reference-codebases/phaser-rpg` — do not modify it.
4. Current tasks tracked via TaskList with IDs #15-#25.
5. The memory at `~/.claude/projects/-Users-jbogaty-src-arcade-cabinet-toki-pona-tutor/memory/` has the non-obvious rules.

## Godot-era context (off-branch reference)

Not on this branch. On `main` between commits `1d924fe`..`0edfe61` there's a parallel Godot 4 implementation. It has working CI/release-please/dependabot/Maestro E2E infrastructure that may be worth porting later but is out of scope for this PR. The Godot port's assets + tilemap work is archived under `pending/extracted/` (pre-extracted by the Godot attempt).
