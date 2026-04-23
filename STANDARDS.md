---
title: Rivers Reckoning — Standards
updated: 2026-04-23
status: current
---

# Standards for Rivers Reckoning

Non-negotiables for code, content, and asset work on this repo. If a PR violates these, the PR is wrong — not the standards.

## Process

### Docs → Tests → Code

Strict dependency chain. Docs describe what the game must be. Tests describe what the code must do. Code satisfies both.

-   A feature starts with a doc change. If no doc answers "what should this do," write the doc section before anything else.
-   Tests reference doc acceptance criteria by phrase or section, visible from the test.
-   When a test fails, judge it against the doc, never against the code. If a test contradicts the doc, the test is wrong.
-   When the doc changes, tests update before code does.

### Autonomy

-   Always use pull requests. Never push to main.
-   Conventional Commits (`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `perf:` / `test:` / `ci:` / `build:`).
-   Squash-merge PRs.
-   Address every review comment before merge. Wait for CI green. Never `--admin`.
-   Commit + push before any destructive change so there's always a fallback.

## Identity

### No copyrighted references

Never reference trademarked properties in docs, code, comments, commit messages, or asset names. The genre is "creature-catching RPG." Wild captures use capture pods.

This is a kid's game in a public repo. Copyrighted references create legal exposure and undermine the game's original identity.

### Tonal consistency

The previous playthrough's biggest bug was **inconsistent playing pieces** — Kenney flat-palette sprites next to painterly Lonesome Forest next to Old Town's isometric-ish look. This is outlawed now.

-   **Tilesets**: the Fan-tasy family (`public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/`) is the sole tileset source. Never mix in a tileset from outside this family.
-   **Bosses** live in `public/assets/bosses/` and must be animated (idle + walk + attack + death states minimum).
-   **Wild creatures** live in `public/assets/creatures/` and are static sprites (no rigs needed; they appear in combat as still idle frames).
-   **Player** is the Fan-tasy Main Character. Never substitute another sprite for the player.

The green dragon is reserved for the endgame set-piece — it's the only creature with a dedicated defeat animation. Never use it for mid-game encounters.

### Audience

Kids. Kid-friendly wording. "Dread knight" > "death knight." Fierce-but-friendly tone. English is functional, vivid, and short in combat.

## Content

### Native-English narrative

Rivers Reckoning is now authored directly in English. Do not reintroduce translation, corpus validation, or language-learning mechanics. Use `src/content/clues.json` for curated investigation clues.

### Content authoring boundaries

-   **Authors edit only** `src/content/spine/<kind>/<id>.json`.
-   **Never edit** `src/content/generated/world.json` — it's compiled output.
-   **Schema changes** require a schema update (`src/content/schema/`) and a build-spine re-run.

### Map authoring — specs, not hand-edited XML

Maps are **build artifacts**. The only source of truth is a spec file under `scripts/map-authoring/specs/<id>.ts` (default-exporting a `MapSpec`). From that spec the toolchain emits:

-   `src/tiled/<id>.tmx` — the runtime artifact consumed by RPG.js v5's `tiledMapFolderPlugin`
-   `public/assets/maps/<id>.tmj` — the JSON archive (human-readable, diffable, used by the image renderer)
-   `public/assets/maps/<id>.preview.png` — a composited PNG for visual review

Workflow:

```sh
pnpm author:build <id>      # spec → .tmj + .tmx for one map
pnpm author:all --all       # validate + build + render every spec
pnpm author:verify          # enforcement gate (runs in validate + CI)
```

**Hand-edited `.tmx`/`.tmj` is forbidden.** `pnpm author:verify` runs as part of `pnpm validate` (and therefore `pnpm prebuild`) and fails if:

-   any `src/tiled/<id>.tmx` has no corresponding spec
-   any spec has no emitted `.tmx`
-   any `public/assets/maps/<id>.tmj` has no corresponding spec
-   any spec has no emitted `.tmj`
-   any emitted `.tmx` or `.tmj` drifts from what its spec would produce now (i.e. someone hand-edited the artifact, or forgot to rebuild after editing the spec)

If a contributor needs to change map geometry, NPC placement, encounter tables, warps, etc., they edit the spec and rebuild. The spec is source; `.tmx`/`.tmj` are compiled output. Tileset `.tsx` files remain hand-authored (they belong to the Fan-tasy asset pack, not to our codebase).

Tileset `.tsx`/`.tmx` paths are POSIX-normalized at emit time so CI and macOS/Linux/Windows authors all produce byte-identical output.

## Code

### TypeScript strict

All game code is TypeScript strict. No `any` escape hatches without a `// intentional:` comment.

### File size is a signal, not a cap

300 LOC is a soft signal to pause and ask if the file is doing too much. A 400-line config table, generated schema, or single-responsibility module is fine; a 250-line file secretly owning three subsystems is not. Hooks may warn, never block.

### No dead code

-   No stubs, TODOs, or `pass` bodies. They're bugs.
-   No defensive checks for scenarios that can't happen. Trust internal code. Only validate at system boundaries (user input, external APIs).
-   No backwards-compatibility shims when you can just change the code.
-   No comments explaining WHAT the code does (well-named identifiers do that). Only comment WHY when the reason is non-obvious.

### Tests describe behavior, not implementation

E2E tests go through the real game in Playwright. Unit tests are for pure logic (combat math, type matchups, save migration, docs/config guards). Integration tests use `@rpgjs/testing` to exercise the real RPG.js engine in-process.

Do not mock the content pipeline in tests — run against a real compiled `generated/world.json`.

When feature scope crosses layers, add or update checks in this order: docs acceptance text first, integration tests second, E2E tests third, and narrow unit coverage last for pure formulas or config guards that fell out of the feature.

## Asset contract

Every sprite in the game comes from one of these:

| Category                            | Source                   | Path                                                                 |
| ----------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Tilesets                            | Fan-tasy family          | `public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/` |
| Player                              | Fan-tasy Main Character  | `public/assets/player/`                                              |
| Bosses (animated)                   | Various                  | `public/assets/bosses/`                                              |
| Creatures (static wild)             | Creature Extended        | `public/assets/creatures/`                                           |
| NPCs                                | Citizens-Guards-Warriors | `public/assets/npcs/`                                                |
| Combatants (rivals, region masters) | warriors_rogues_mages    | `public/assets/combatants/`                                          |
| Effects                             | warriors_rogues_mages    | `public/assets/effects/`                                             |

See `docs/SPRITE_CURATION.md` for curation rules, with runtime catalog details in
`docs/NPC_SPRITES.md`, `docs/COMBATANT_SPRITES.md`, and
`docs/EFFECT_SPRITES.md`.

## CI and release

-   Every PR runs validation, typecheck, unit coverage, integration, smoke E2E, Pages build, and debug APK artifact jobs. Failing any gate blocks merge.
-   Release-please tags semver; `release.yml` builds versioned web/debug APK workflow artifacts, and `cd.yml` consumes the completed release run to attach release assets and deploy Pages. The remote chain is proven on `v0.3.1`; keep it proven as workflows evolve.
-   Never force-push to main. Never bypass CI.

## When you see a violation

Fix it in the same pass. Don't merge it forward. Update this file if a new class of violation turns out to be common.
