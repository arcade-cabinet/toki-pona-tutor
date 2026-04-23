---
title: Art Direction And Curation
updated: 2026-04-23
status: current
domain: product
---

# Art Direction And Curation

Rivers Reckoning is moving from a technically proven `v0.3.1` release toward a polished v1.0 game. The art bar is now higher than “uses the right tileset family”: every tile must earn its place in a cohesive 16-bit RPG identity.

## Current Decision

The visual strategy is **Fan-tasy family, full v1 stack**. The shipped Fan-tasy packs (core + seasons + snow + desert + fortress + indoor) cover the first five regions; the Fan-tasy packs already extracted under `pending/extracted/` (Castles and Fortresses, Desert Oasis, Medieval Interiors, Snow Adventures, Turning of the Seasons, Premium) close the remaining gaps. This is the lowest-risk, highest-cohesion choice because every candidate inside the Fan-tasy family shares outline weight, saturation band, and grid alignment.

Alternative families evaluated and **rejected for v1** (no exceptions — any single-tile promotion from a rejected pack is a post-v1 decision):

-   **Lonesome Forest** (SUMMER + WINTER + Extra Trees) — beautiful but the tree volumes and ground tone fight the existing Fan-tasy grass. Mixing would trigger the same cohesion break that sank the previous playthrough.
-   **Old Town** (Exteriors + Interiors) — the perspective is slightly higher than Fan-tasy's and the stone palette is cooler. Rejected for cohesion.
-   **Classic Dungeons** — duplicative with Fan-tasy Castles and Fortresses, with a slightly different lighting model. Fan-tasy wins on internal consistency.
-   **Natural Interior Tilesets** — covered by Fan-tasy Medieval Interiors in-family.

Adopting a non-Fan-tasy family remains allowed as a post-v1 visual refresh, tracked separately from this plan.

### V1 stack by region

| Region | Role | Primary pack |
| --- | --- | --- |
| `riverside_home` | home village, warm | Fan-tasy core + seasons |
| `greenwood_road` | first route, forest | Fan-tasy seasons |
| `highridge_pass` | mountain pass, shrine | Fan-tasy seasons + Fan-tasy Castles and Fortresses |
| `lakehaven` | lake village | Fan-tasy seasons + Fan-tasy Medieval Interiors |
| `frostvale` | snow village | Fan-tasy snow + Fan-tasy Medieval Interiors |
| `dreadpeak_cavern` | endgame cavern | Fan-tasy Castles and Fortresses (cave + shrine surfaces) |
| `rivergate_approach` | endgame river route + dragon encounter | Fan-tasy seasons + Fan-tasy Castles and Fortresses (gate architecture) |

Fan-tasy family packs not yet mapped to a specific region but approved for v1 as supporting inventory: **Desert Oasis**, **Snow Adventures**, **Turning of the Seasons**, **Premium**. These may be pulled from during promotion when the region-specific pack lacks a needed tile role, as long as the tile passes the micro audit.

The manifest at `src/content/art/tilesets.json` remains the curation boundary (`strategy: "fan_tasy_v1"`). Palette code should refer to curated IDs through `curatedTile(...)` for direct non-generated tiles. Generated atlases and generated derived tilesets may still own their output local IDs, but their source assets must be audited before promotion. Pending Fan-tasy packs carry `status: "approved_pending_promote"` until their tiles are imported into `public/assets/tilesets/` and referenced by a map spec.

## Tile Roles

-   `solid_fill`: opaque base terrain such as grass, dirt, snow, water, or floor.
-   `transparent_overlay`: detail/encounter paint that can sit over base terrain without rectangular color seams.
-   `multi_tile_object`: houses, large trees, cliffs, rocks, torches, bridges, walls, or any object that must be placed as a grouped footprint.
-   `transition`: edge/shore/cliff/road bridge tiles that connect terrain families.
-   `animated`: water, torches, doors, effects, or any tile with frame timing.
-   `collision_blocker`: visually blocked terrain with matching Tiled collision semantics.
-   `reject`: known bad tile; keep it documented so it is not rediscovered and reused.

## Known Rejections

-   `fan_tasy.seasons.tall_grass.stubby_green_box`: visually reads as a rectangular green patch instead of an overlay.
-   `fan_tasy.snow.tall_grass.green_snow_mismatch`: green rectangular grass does not belong on snow maps.

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

-   Every map has a legible path language and at least three recognizable landmarks.
-   NPCs, warps, shops, quest givers, and boss staging have enough breathing room for tap/mouse interaction.
-   Encounter zones are visually obvious but biome-native.
-   No actor stands on forest/tree/wall/blocked or encounter-overlay cells unless explicitly designed and tested.
-   Multi-tile objects are placed as footprints, not pulled as isolated single tiles.
-   Screenshots show no wrong-facing transitions, rectangular overlay artifacts, placeholder tiles, missing textures, or style-family clashes.
