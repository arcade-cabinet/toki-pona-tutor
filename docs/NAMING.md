---
title: Naming Refactor Plan
updated: 2026-04-23
status: draft
domain: product
---

# Naming Refactor Plan — toki-pona → English

## Why

The Rivers Reckoning pivot (v0.3.1) shipped as a native-English game, but
the internal IDs — species, moves, items, NPCs, quests, map layers —
still carry toki-pona tokens (`selby`, `applepup`, `capture_pod`, etc.).
Player-visible English display names cover the experience, but:

1. Debug contexts (quest flags, developer tools, save inspector) expose
   the old tokens to anyone who looks under the hood.
2. The codebase reads as a translation artifact rather than a
   native-English product.
3. New contributors see two parallel languages and struggle to reason
   about the content model.

This doc is the **authoritative mapping table** for a staged rename.
Rows in **TBD** still need names; rows with both columns filled are
locked and ready for the coordinated refactor PR.

## Status

- ✅ **Player-visible prose**: `Selby` and `Loren at the lake` land in
  HUD goal / pause glance / quest dialog as of 2026-04-23.
- ⬜ **Internal IDs**: 235 files touch toki-pona tokens (422 instances
  in `src/content/generated/world.json`). Awaits save-migration plan;
  see ROADMAP row T1-05.
- ⬜ **File renames**: 97 spine JSON files need renaming. Blocked on
  the ID rename being ready.

## Canonical name mapping

### NPCs (starter village + mentor network)

| Internal ID              | English Name | Notes                                              |
| ------------------------ | ------------ | -------------------------------------------------- |
| `selby`               | Selby        | The starter mentor. Already in the opening scene.  |
| `piper`          | Piper        | Starter-village ambient; keeps the "P-" alliteration. |
| `wren`          | Wren         | Well-keeper; "water" connotation.                  |
| `oren`          | Oren         | Kid at the starter village.                        |
| `fig`          | Fig          | Fruit/snack NPC; Fig fits orchard work.            |
| `loren`          | Loren        | Lakehaven mentor; delivery endpoint for Lost Hiker quest. |
| `lily`          | Lily         | Small-fish girl at rivergate approach.             |
| `grill`          | TBD          | Lakehaven grill cook.                              |
| `cormorant`          | TBD          | Lakehaven master.                                  |
| `myra`          | TBD          | Lakehaven quiet NPC.                               |
| `sola`          | TBD          | Lakehaven sunset NPC.                              |
| `marsha`         | TBD          | Highridge hiker trail guide.                       |
| `boulder`              | Boulder      | Mountain shrine NPC.                               |
| `graym`         | Graym        | Cave dweller.                                      |
| `briar`       | Briar        | Greenwood ranger.                                  |
| `hollis`               | Hollis       | Frostvale gardener.                                |
| `thorn`         | TBD          | Greenwood grass-keeper.                            |
| `lark`        | TBD          | Greenwood watchman.                                |
| `pack`         | TBD          | Greenwood pack-runner.                             |
| `ember`        | TBD          | Torch-path NPC.                                    |
| `corvin`               | TBD          | Watchwoman.                                        |
| `meadow`             | TBD          | Meditation NPC.                                    |
| `rowan`           | TBD          | Trail-asking NPC.                                  |
| `kestrel`          | TBD          | Sky-watcher.                                       |
| `luma`          | TBD          | Frostvale light NPC.                               |
| `tarn`          | TBD          | Lake-plaza NPC.                                    |
| `brindle`          | TBD          | Frostvale pack-cold NPC.                           |

### Region masters + rival

| Internal ID              | English Name | Notes                                              |
| ------------------------ | ------------ | -------------------------------------------------- |
| `rook`                | Rook         | The rival. Short, game-piece name.                 |
| `frost`               | Frost        | Frostvale region master.                           |
| `cliff`               | Cliff        | Dreadpeak-region master.                           |
| `tarrin`               | Tarrin       | Rivergate strong-warrior master.                   |
| `marin`               | Marin        | Lakehaven master.                                  |
| `shopkeep`               | TBD          | Shopkeeper.                                        |

### Species (43 total — English names already ship)

Player display names (`name.en`) are already English. Internal IDs
still toki-pona. New naming should preserve thematic fit; sample:

| Internal ID              | English Name (ship)  | Proposed new ID     |
| ------------------------ | -------------------- | ------------------- |
| `vine_adder`            | Vine Adder           | `vine_adder`        |
| `ember_adder`             | Ember Adder          | `ember_adder`       |
| `green_dragon`             | Green Dragon         | `green_dragon`      |
| `marshjaw`             | Marshjaw             | `marshjaw`          |
| `reedfrog`              | Reedfrog             | `reedfrog`          |
| `bluefin`              | Bluefin              | `bluefin`           |
| `riverfin`              | Riverfin             | `riverfin`          |
| `snapper`               | Snapper              | `snapper`           |
| `ashcat`               | Ashcat               | `ashcat`            |
| `snowbird`              | Snowbird             | `snowbird`          |
| `pebbleback`           | Pebbleback           | `pebbleback`        |
| `bramble_imp`           | Bramble Imp          | `bramble_imp`       |
| `bog_wisp`               | Bog Wisp             | `bog_wisp`          |
| `mountain_bear`          | Mountain Bear        | `mountain_bear`     |
| …                        | …                    | …                   |

(Full 43-species table generated by the refactor script — see §Script.)

### Items

| Internal ID     | English Name (ship)  | Proposed new ID     |
| --------------- | -------------------- | ------------------- |
| `capture_pod`     | Capture Pod          | `capture_pod`       |
| `heavy_capture_pod`     | Heavy Capture Pod    | `heavy_capture_pod` |
| `orchard_fruit`          | Orchard Fruit        | `orchard_fruit`     |
| `trail_token`            | Trail Token          | `trail_token`       |
| `spring_tonic`     | Spring Tonic         | `spring_tonic`      |

### Moves (17 total)

| Internal ID     | Ship name / Proposed ID                    |
| --------------- | ------------------------------------------ |
| `frost_nip`     | TBD → `frost_nip`                          |
| `frost_crash`     | TBD → `frost_crash`                        |
| `frost_soar`     | TBD → `frost_soar`                         |
| `frost_surge`     | TBD → `frost_surge`                        |
| `leaf_jab`     | TBD → `leaf_jab`                           |
| `leaf_storm`     | TBD → `leaf_storm`                         |
| `stone_slam`    | TBD → `stone_slam`                         |
| `gust_strike`      | TBD → `gust_strike`                        |
| `ember_nip`     | TBD → `ember_nip`                          |
| `flame_strike`     | TBD → `flame_strike`                       |
| `splash`     | TBD → `splash`                             |
| `wave_slam`     | TBD → `wave_slam`                          |
| `tidal_strike`     | TBD → `tidal_strike`                       |
| `tide_ward`     | TBD → `tide_ward`                          |
| `quick_jab`    | TBD → `quick_jab` (already well-used — 80 refs) |

## Refactor phases

### Phase A (shipped) — player-visible prose
- `docs/screenshots/visual-audit/1.0-onboarding/` captures confirm the
  HUD/pause/dialog prose is all English.

### Phase B (proposed) — full ID rename
1. Freeze the mapping above (fill every TBD).
2. Write `scripts/rename-toki-pona.mjs` that:
   - Reads the mapping table.
   - Renames spine files (species/moves/dialog/items).
   - Rewrites every JSON `id` field + every cross-reference.
   - Rewrites events.json / quests.json / ui.json / visuals.json IDs.
   - Updates test fixtures and docs references.
3. Write a save-migration hook in `src/platform/persistence/` that
   reads old IDs and rewrites them to new IDs on load.
4. Land as a single coordinated PR. Run the full test matrix +
   integration + onboarding capture to verify no regressions.
5. Follow with T1-05 shim removal release.

### Phase C (proposed) — internal code references
Once data is renamed, sweep source code comments, doc prose, changelog
historical references, and code-internal string constants. This is
cleanup, not correctness-critical.

## Acceptance

- Every ID the player can see in debug or save tools is English.
- Grep for `jan_`, `soweli_`, `kala_`, `poki_`, etc. in `src/content/`
  and `src/modules/` returns zero hits.
- Saves from v0.13.x load correctly post-migration and the player
  sees their creatures under the new English names.
