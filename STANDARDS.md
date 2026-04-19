---
title: poki soweli — Standards
updated: 2026-04-19
status: current
---

# Standards for poki soweli

Non-negotiables for code, content, and asset work on this repo. If a PR violates these, the PR is wrong — not the standards.

## Process

### Docs → Tests → Code

Strict dependency chain. Docs describe what the game must be. Tests describe what the code must do. Code satisfies both.

- A feature starts with a doc change. If no doc answers "what should this do," write the doc section before anything else.
- Tests reference doc acceptance criteria by phrase or section, visible from the test.
- When a test fails, judge it against the doc, never against the code. If a test contradicts the doc, the test is wrong.
- When the doc changes, tests update before code does.

### Autonomy

- Always use pull requests. Never push to main.
- Conventional Commits (`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `perf:` / `test:` / `ci:` / `build:`).
- Squash-merge PRs.
- Address every review comment before merge. Wait for CI green. Never `--admin`.
- Commit + push before any destructive change so there's always a fallback.

## Identity

### No copyrighted references

Never reference trademarked properties (Pokemon, Pokedex, Pokeball, etc.) in docs, code, comments, commit messages, or asset names. The genre is "creature-catching RPG." The in-game catalog is "lipu soweli." Wild captures use a "poki" (net).

This is a kid's game in a public repo. Copyrighted references create legal exposure and undermine the game's original identity.

### Tonal consistency

The previous playthrough's biggest bug was **inconsistent playing pieces** — Kenney flat-palette sprites next to painterly Lonesome Forest next to Old Town's isometric-ish look. This is outlawed now.

- **Tilesets**: the Fan-tasy family (`public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/`) is the sole tileset source. Never mix in a tileset from outside this family.
- **Bosses** live in `public/assets/bosses/` and must be animated (idle + walk + attack + death states minimum).
- **Wild creatures** live in `public/assets/creatures/` and are static sprites (no rigs needed; they appear in combat as still idle frames).
- **Player** is the Fan-tasy Main Character. Never substitute another sprite for the player.

The green dragon is reserved as the final boss — it's the only creature with a dedicated death animation. Never use it for mid-game encounters.

### Audience

Kids. Kid-friendly wording. "Dread knight" > "death knight." Fierce-but-friendly tone. Combat log uses TP creature names; English is functional and short.

## Content

### No hand-authored toki pona

Every user-facing TP string must round-trip through the Tatoeba corpus (`src/content/corpus/tatoeba.json`, 37,666 CC BY 2.0 FR sentence pairs). Authors edit EN; the build pipeline resolves canonical TP.

If `pnpm validate-tp` rejects a line:
- Rewrite the EN, never invent TP.
- See `docs/WRITING_RULES.md` for the complexity rules EN must satisfy.
- Single-word dictionary words (`kili`, `soweli`, `moku`) are exempt.

### Content authoring boundaries

- **Authors edit only** `src/content/spine/<kind>/<id>.json`.
- **Never edit** `src/content/generated/world.json` — it's compiled output.
- **Never edit** `src/content/corpus/tatoeba.json` — it's vendored upstream data.
- **Schema changes** require a schema update (`src/content/schema/`) and a build-spine re-run.

### Region authoring (new this PR)

Regions are authored in **Tiled** (the `.tmx` map editor), not as JSON tile arrays. Tile layout lives in `<region>.tmx`; region logic (NPCs, warps, encounter tables) lives either in Tiled object layers or in `<id>.logic.json` alongside.

Tiled `.tsx`/`.tmx` files use relative paths (`../../Art/...`, `../Tilesets/...`). When reorganizing assets, preserve each tileset pack's internal `Art/` + `Tiled/` layout.

## Code

### TypeScript strict

All game code is TypeScript strict. No `any` escape hatches without a `// intentional:` comment.

### File size is a signal, not a cap

300 LOC is a soft signal to pause and ask if the file is doing too much. A 400-line config table, generated schema, or single-responsibility module is fine; a 250-line file secretly owning three subsystems is not. Hooks may warn, never block.

### No dead code

- No stubs, TODOs, or `pass` bodies. They're bugs.
- No defensive checks for scenarios that can't happen. Trust internal code. Only validate at system boundaries (user input, external APIs).
- No backwards-compatibility shims when you can just change the code.
- No comments explaining WHAT the code does (well-named identifiers do that). Only comment WHY when the reason is non-obvious.

### Tests describe behavior, not implementation

E2E tests go through the real game via the Vitest browser harness. Unit tests are for pure logic (combat math, type matchups, save migration). Integration tests exercise slices of the content pipeline.

Do not mock the content pipeline in tests — run against a real compiled `generated/world.json`.

## Asset contract

Every sprite in the game comes from one of these:

| Category | Source | Path |
|---|---|---|
| Tilesets | Fan-tasy family | `public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/` |
| Player | Fan-tasy Main Character | `public/assets/player/` |
| Bosses (animated) | Various | `public/assets/bosses/` |
| Creatures (static wild) | Creature Extended | `public/assets/creatures/` |
| NPCs | Citizens-Guards-Warriors | `public/assets/npcs/` |
| Combatants (rivals, jan lawa) | warriors_rogues_mages | `public/assets/combatants/` |
| Effects | warriors_rogues_mages | `public/assets/effects/` |

See `docs/ASSET_PIPELINE.md` for loader conventions and frame-size discovery rules.

## CI and release

- Every PR runs `pnpm validate && pnpm typecheck && pnpm test`. Failing any gate blocks merge.
- Release-please tags semver; artifact builds go via `release.yml`; deploys via `cd.yml` (wiring deferred from this PR).
- Never force-push to main. Never bypass CI.

## When you see a violation

Fix it in the same pass. Don't merge it forward. Update this file if a new class of violation turns out to be common.
