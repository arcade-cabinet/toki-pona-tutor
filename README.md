---
title: poki soweli
updated: 2026-04-19
status: current
---

# poki soweli

A creature-catching RPG whose world is named in toki pona — a small constructed language with ~120 words. Players walk between villages, catch creatures in tall grass with a **poki** (net), build a party of six, and beat seven **jan lawa** (region masters) to progress. Vocabulary lands diegetically — the player never translates; the language just saturates the world.

> 🧪 This branch (`spike/phaser-koota-revive`) is a revival of the pre-Godot Phaser+Koota stack. The main branch is on a Godot engine that proved more fighting than it was worth. See `docs/STATE.md` for context.

## Run it

```sh
pnpm install
pnpm build-spine      # compile content JSON → generated/world.json
pnpm dev              # vite dev server at http://localhost:5173/toki-pona-tutor/
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
