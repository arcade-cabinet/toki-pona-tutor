---
title: poki soweli
updated: 2026-04-19
status: current
---

# poki soweli

![43 species](https://img.shields.io/badge/species-43-86a856)
![7 regions](https://img.shields.io/badge/regions-7-a7c472)
![7 gyms](https://img.shields.io/badge/jan%20lawa-7-e5a42c)
![TP corpus-gated](https://img.shields.io/badge/toki%20pona-corpus--gated-5b94a6)
![RPG.js v5](https://img.shields.io/badge/engine-RPG.js%20v5-c23b22)

A monster-catching RPG whose world is named in toki pona — a blend of Final Fantasy dark-fantasy aesthetic with Pokémon-style catch-and-train mechanics. Players walk between villages, catch monsters with a **poki** (net), build a party of six, and beat seven **jan lawa** (region masters) to progress. Vocabulary lands diegetically — the player never translates; the language just saturates the world.

> 🏗️ Current branch: `feat/rpgjs-v5-pivot` — the RPG.js v5 beta pivot. See `docs/STATE.md` for what just landed.

## Run it

```sh
pnpm install
pnpm build-spine      # compile content JSON → generated/world.json
pnpm dev              # vite dev server at http://localhost:5173/poki-soweli/
```

For the build pipeline, validation, and other commands, see `CLAUDE.md`.

## What makes it interesting

- **No translation UI.** The player never sees an English gloss. Over a playthrough they pick up ~120 TP words simply by playing.
- **Every line of user-facing TP is corpus-verified.** `src/content/corpus/tatoeba.json` is a vendored 37,666-pair CC BY 2.0 FR Tatoeba corpus. Authors write English; the build pipeline round-trips every line through the corpus to produce canonical TP. Hand-authored TP is banned; `pnpm validate-tp` gates every PR.
- **Single coherent art direction** using the Fan-tasy tileset family (6 biome packs) plus tier-by-animation creature sorting. See `docs/ASSET_PIPELINE.md`.
- **Docs > tests > code order.** Docs describe what the game must be; tests describe what the code must do; code satisfies both. See `STANDARDS.md`.

## Structure

| Path | What it is |
|---|---|
| `src/game/` | Phaser scenes, Solid overlays, Koota ECS, combat engine |
| `src/content/spine/` | Hand-authored content JSON (species, moves, regions, items, dialog) |
| `src/content/generated/` | Compiled `world.json` (committed for reproducibility) |
| `src/content/corpus/` | Vendored Tatoeba TP↔EN corpus |
| `src/content/schema/` | Zod schemas — source of truth for content shape |
| `public/assets/` | Fan-tasy tilesets, player, bosses, creatures, NPCs, combatants, effects |
| `docs/` | `ARCHITECTURE`, `DESIGN`, `ROADMAP`, `LORE`, `SLICE_CHECK`, `TESTING`, `ASSET_PIPELINE`, `STATE`, `AGENT_TEAMS`, `WRITING_RULES` |
| `tests/` | Vitest browser harness + deterministic playbook replayer |

## Contributing

- Read `CLAUDE.md` and `AGENTS.md`.
- Work on a feature branch, open a PR against `main`. Never push to main.
- CI must be green before merge; address every review comment.
- Conventional Commits (`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `perf:` / `test:` / `ci:` / `build:`).
- Squash-merge.

## License

Code — see `LICENSE`. Content — `src/content/corpus/tatoeba.json` is CC BY 2.0 FR (see `src/content/corpus/LICENSE.md`). Purchased asset pack licenses — see `public/assets/CREDITS.md` and original archives in `pending/`.
