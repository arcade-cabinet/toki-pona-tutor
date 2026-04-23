---
title: Art Direction And Curation
updated: 2026-04-22
status: current
domain: product
---

# Art Direction And Curation

Rivers Reckoning is moving from a technically playable v0.2 slice toward a polished v1.0 game. The art bar is now higher than “uses the right tileset family”: every tile must earn its place in a cohesive 16-bit RPG identity.

## Current Decision

The visual strategy is **open pivot**. The shipped Fan-tasy assets remain the current baseline, but the newly supplied `pending/` packs are valid candidates. We should replace current tiles whenever a pending pack gives a more cohesive, readable, mobile-friendly result.

The manifest at `src/content/art/tilesets.json` is the curation boundary. Palette code should refer to curated IDs through `curatedTile(...)` for direct non-generated tiles. Generated atlases and generated derived tilesets may still own their output local IDs, but their source assets must be audited before promotion.

## Tile Roles

- `solid_fill`: opaque base terrain such as grass, dirt, snow, water, or floor.
- `transparent_overlay`: detail/encounter paint that can sit over base terrain without rectangular color seams.
- `multi_tile_object`: houses, large trees, cliffs, rocks, torches, bridges, walls, or any object that must be placed as a grouped footprint.
- `transition`: edge/shore/cliff/road bridge tiles that connect terrain families.
- `animated`: water, torches, doors, effects, or any tile with frame timing.
- `collision_blocker`: visually blocked terrain with matching Tiled collision semantics.
- `reject`: known bad tile; keep it documented so it is not rediscovered and reused.

## Known Rejections

- `fan_tasy.seasons.tall_grass.stubby_green_box`: visually reads as a rectangular green patch instead of an overlay.
- `fan_tasy.snow.tall_grass.green_snow_mismatch`: green rectangular grass does not belong on snow maps.

Future rejections should be added to the manifest with a concrete reason, not left as tribal knowledge.

## Bakeoff Process

1. Run `pnpm art:audit-pending` to inventory local pending archives without extracting them into the repo.
2. Generate contact sheets or sample maps in scratch space for the candidate packs.
3. Score each candidate at macro, meso, and micro levels:
   - Macro: does the pack support a coherent world identity across towns, routes, water, snow, cave, interiors, and endgame?
   - Meso: do terrain families have enough transitions, edges, blockers, objects, landmarks, and encounter markers?
   - Micro: do individual tiles have transparent backgrounds when needed, correct facing, readable collision intent, and compatible scale/outline/saturation?
4. Promote only approved/provisional tiles into `src/content/art/tilesets.json`.
5. Rebuild map palettes from curated IDs, regenerate maps, and verify screenshots.

## Acceptance Bar For V1 Maps

- Every map has a legible path language and at least three recognizable landmarks.
- NPCs, warps, shops, quest givers, and boss staging have enough breathing room for tap/mouse interaction.
- Encounter zones are visually obvious but biome-native.
- No actor stands on forest/tree/wall/blocked or encounter-overlay cells unless explicitly designed and tested.
- Multi-tile objects are placed as footprints, not pulled as isolated single tiles.
- Screenshots show no wrong-facing transitions, rectangular overlay artifacts, placeholder tiles, missing textures, or style-family clashes.
