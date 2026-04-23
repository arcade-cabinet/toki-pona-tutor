---
title: Species Team Brief
updated: 2026-04-22
status: current
domain: content
---

# Species Team Brief

Use this brief when authoring or revising creature species JSON under `src/content/spine/species/`.

## Goal

Create catchable monsters that fit Rivers Reckoning's kid-friendly fantasy investigation. Each species should have a clear silhouette, type role, encounter purpose, and readable English description.

## Source Files

- Species JSON: `src/content/spine/species/<id>.json`
- Schema: `src/content/schema/species.ts`
- Generated output: `src/content/generated/world.json`
- Clues: `src/content/clues.json`

## Rules

- Author user-facing names and descriptions directly in English.
- Keep descriptions short, vivid, and useful for a bestiary reread.
- Every species must be catchable somewhere unless intentionally future-scoped in `docs/ROADMAP.md`.
- Use existing internal type IDs: `seli`, `telo`, `kasi`, `lete`, `wawa`.
- Do not add trademarked comparisons or franchise-specific language.
- Do not introduce new sprite sheets without following `docs/SPRITE_CURATION.md`.

## Verification

```sh
pnpm build-spine
pnpm typecheck
pnpm test:unit
pnpm test:integration
```

If a species changes map distribution, also run:

```sh
pnpm author:verify
```

## Review Checklist

- Name and description read naturally in English.
- Type, moves, XP yield, catch difficulty, item drop, and sprite metadata validate.
- Encounter placement matches the map's biome and progression band.
- Bestiary copy does not expose raw implementation detail.
