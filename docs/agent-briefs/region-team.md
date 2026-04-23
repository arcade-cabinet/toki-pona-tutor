---
title: Region Team Brief
updated: 2026-04-22
status: current
domain: content
---

# Region Team Brief

Use this brief when authoring map specs, NPCs, dialog, quests, encounters, and clue rewards for a region.

## Goal

Each region should feel like an authored place with a clear route language, local problem, clue/reward loop, encounter identity, and mobile-friendly staging.

## Source Files

- Map specs: `scripts/map-authoring/specs/<map_id>.ts`
- Runtime maps: `src/content/gameplay/maps.json`
- Event payloads: `src/content/gameplay/events.json`
- Dialog: `src/content/spine/dialog/*.json`
- Quests: `src/content/gameplay/quests.json`
- Clues: `src/content/clues.json`

## Region Requirements

- At least five meaningful NPC/sign/event touchpoints for story maps.
- Walkable route language: roads, thresholds, blockers, landmarks, and encounter zones should be visually obvious.
- No actor, NPC, sign, shop, warp, or trigger placement on collision blockers or rejected tiles.
- Mobile tap space around important interactions.
- Encounter zones must be visibly marked by terrain that reads as encounter terrain.
- Biome transitions should use curated transition tiles where possible, not abrupt unrelated patches.

## Writing Rules

- Write natural English dialog.
- Prefer short beats with a clear purpose: navigation, character, clue, quest, warning, or payoff.
- Use clue IDs only as metadata/rewards; do not show raw IDs to players.
- Keep the tone brave, curious, and kid-friendly.

## Verification

```sh
pnpm author:build <map_id>
pnpm author:verify
pnpm build-spine
pnpm typecheck
pnpm test:unit
pnpm test:integration
```

If visuals changed, also run the visual audit and inspect screenshots.

## Review Checklist

- The map reads well at the current camera zoom.
- Terrain, overlays, blockers, and decorations are visually cohesive.
- NPCs are staged on sensible ground tiles.
- Quest and clue rewards match the region's story.
- The next-route gate is understandable without reading docs.
