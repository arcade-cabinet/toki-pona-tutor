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
still carry toki-pona tokens (`jan_sewi`, `soweli_kili`, `poki_lili`, etc.).
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
| `jan_sewi`               | Selby        | The starter mentor. Already in the opening scene.  |
| `jan_pona_tomo`          | Piper        | Starter-village ambient; keeps the "P-" alliteration. |
| `jan_telo_well`          | Wren         | Well-keeper; "water" connotation.                  |
| `jan_poki_tomo`          | Oren         | Kid at the starter village.                        |
| `jan_kili_tomo`          | Fig          | Fruit/snack NPC; Fig fits orchard work.            |
| `jan_kala_lake`          | Loren        | Lakehaven mentor; delivery endpoint for Lost Hiker quest. |
| `jan_kala_lili`          | Lily         | Small-fish girl at rivergate approach.             |
| `jan_moku_pona`          | TBD          | Lakehaven grill cook.                              |
| `jan_kala_suli`          | TBD          | Lakehaven master.                                  |
| `jan_olin_telo`          | TBD          | Lakehaven quiet NPC.                               |
| `jan_suno_telo`          | TBD          | Lakehaven sunset NPC.                              |
| `jan_nasin_sewi`         | TBD          | Highridge hiker trail guide.                       |
| `jan_kiwen`              | Boulder      | Mountain shrine NPC.                               |
| `jan_kiwen_suli`         | Graym        | Cave dweller.                                      |
| `jan_palisa_nasin`       | Briar        | Greenwood ranger.                                  |
| `jan_kasi`               | Hollis       | Frostvale gardener.                                |
| `jan_kasi_nasin`         | TBD          | Greenwood grass-keeper.                            |
| `jan_lukin_nasin`        | TBD          | Greenwood watchman.                                |
| `jan_poki_nasin`         | TBD          | Greenwood pack-runner.                             |
| `jan_pimeja_suli`        | TBD          | Torch-path NPC.                                    |
| `jan_anpa`               | TBD          | Watchwoman.                                        |
| `jan_pi_kon`             | TBD          | Meditation NPC.                                    |
| `jan_pi_nasin`           | TBD          | Trail-asking NPC.                                  |
| `jan_waso_sewi`          | TBD          | Sky-watcher.                                       |
| `jan_suno_lete`          | TBD          | Frostvale light NPC.                               |
| `jan_sike_telo`          | TBD          | Lake-plaza NPC.                                    |
| `jan_poki_lete`          | TBD          | Frostvale pack-cold NPC.                           |

### Region masters + rival

| Internal ID              | English Name | Notes                                              |
| ------------------------ | ------------ | -------------------------------------------------- |
| `jan_ike`                | Rook         | The rival. Short, game-piece name.                 |
| `jan_lete`               | Frost        | Frostvale region master.                           |
| `jan_suli`               | Cliff        | Dreadpeak-region master.                           |
| `jan_wawa`               | Tarrin       | Rivergate strong-warrior master.                   |
| `jan_telo`               | Marin        | Lakehaven master.                                  |
| `jan_moku`               | TBD          | Shopkeeper.                                        |

### Species (43 total — English names already ship)

Player display names (`name.en`) are already English. Internal IDs
still toki-pona. New naming should preserve thematic fit; sample:

| Internal ID              | English Name (ship)  | Proposed new ID     |
| ------------------------ | -------------------- | ------------------- |
| `akesi_linja`            | Vine Adder           | `vine_adder`        |
| `akesi_seli`             | Ember Adder          | `ember_adder`       |
| `akesi_sewi`             | Green Dragon         | `green_dragon`      |
| `akesi_suli`             | Marshjaw             | `marshjaw`          |
| `kala_tomo`              | Reedfrog             | `reedfrog`          |
| `kala_telo`              | Bluefin              | `bluefin`           |
| `kala_luka`              | Riverfin             | `riverfin`          |
| `kala_uta`               | Snapper              | `snapper`           |
| `kon_moli`               | Ashcat               | `ashcat`            |
| `waso_lete`              | Snowbird             | `snowbird`          |
| `soweli_kiwen`           | Pebbleback           | `pebbleback`        |
| `jan_ike_lili`           | Bramble Imp          | `bramble_imp`       |
| `jan_moli`               | Bog Wisp             | `bog_wisp`          |
| `jan_wawa_suli`          | Mountain Bear        | `mountain_bear`     |
| …                        | …                    | …                   |

(Full 43-species table generated by the refactor script — see §Script.)

### Items

| Internal ID     | English Name (ship)  | Proposed new ID     |
| --------------- | -------------------- | ------------------- |
| `poki_lili`     | Capture Pod          | `capture_pod`       |
| `poki_wawa`     | Heavy Capture Pod    | `heavy_capture_pod` |
| `kili`          | Orchard Fruit        | `orchard_fruit`     |
| `ma`            | Trail Token          | `trail_token`       |
| `telo_pona`     | Spring Tonic         | `spring_tonic`      |

### Moves (17 total)

| Internal ID     | Ship name / Proposed ID                    |
| --------------- | ------------------------------------------ |
| `lete_lili`     | TBD → `frost_nip`                          |
| `lete_suli`     | TBD → `frost_crash`                        |
| `lete_sewi`     | TBD → `frost_soar`                         |
| `lete_wawa`     | TBD → `frost_surge`                        |
| `kasi_lili`     | TBD → `leaf_jab`                           |
| `kasi_wawa`     | TBD → `leaf_storm`                         |
| `kiwen_wawa`    | TBD → `stone_slam`                         |
| `kon_wawa`      | TBD → `gust_strike`                        |
| `seli_lili`     | TBD → `ember_nip`                          |
| `seli_wawa`     | TBD → `flame_strike`                       |
| `telo_lili`     | TBD → `splash`                             |
| `telo_suli`     | TBD → `wave_slam`                          |
| `telo_wawa`     | TBD → `tidal_strike`                       |
| `telo_pini`     | TBD → `tide_ward`                          |
| `utala_lili`    | TBD → `quick_jab` (already well-used — 80 refs) |

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
