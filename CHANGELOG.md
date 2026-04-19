---
title: Changelog
updated: 2026-04-19
status: current
---

# Changelog

All notable changes to poki soweli. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This branch (`spike/phaser-koota-revive`) descends from commit `0a582e0` — the pre-Godot tip. The Godot era between `1d924fe` (pivot) and `0edfe61` (feat/anchor-to-template) lives on `main` and is not represented here. Release-please releases `v0.1.0`…`v0.1.3` tagged on `main` cover the Godot build and do not apply to this branch.

## [Unreleased] — spike/phaser-koota-revive

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
