---
title: Audio
updated: 2026-04-23
status: current
domain: product
---

# Audio

Rivers Reckoning's audio target: every biome has a distinct mood, every combat surface has a clear resolution beat, every SFX communicates a game-state change in under 400ms. Runtime wiring is done; final asset identity is the v1 gap.

This doc is:
- The **catalog contract** (what slots exist, what each one communicates)
- The **licensing policy** (only CC0 / CC-BY / commissioned / original; never franchise-derived)
- The **v1 gap analysis** (which slots are placeholders today and need a real asset)

Runtime authoritative source is `src/content/gameplay/audio.json`. The schema lives in `src/content/gameplay/schema.ts`. Never add an audio slot here without also adding it to the JSON; never add an entry to the JSON without a license line in this doc.

## BGM Catalog

| Slot | Purpose | Current status | Notes |
| --- | --- | --- | --- |
| `bgm_village` | Riverside Home, Lakehaven, any home/town overworld | **placeholder** | Dedicated track needed. Warm, pastoral, 2-3 min loop. |
| `bgm_forest` | Greenwood Road | **placeholder** | Dedicated track needed. Light mystery, walking tempo. |
| `bgm_mountain` | Highridge Pass | **Kenney `bgm-lesson`** | Replace with a mountain/shrine track. Slightly solemn, open. |
| `bgm_water` | Lakehaven water surfaces + Rivergate approach water beats | **alias to `bgm_village`** | Dedicated track needed. Reflective, water-cue lead. |
| `bgm_snow` | Frostvale | **Kenney `bgm-gameover`** (reused) | Replace. Cold, hushed, wonder-over-threat. |
| `bgm_battle` | Default combat track | **Kenney `bgm-menu`** | Replace. Propulsive but not grim. |
| `bgm_gym` | Region-master fights (Highridge / Lakehaven / Frostvale / Dreadpeak) | **Kenney `bgm-lesson`** (reused) | Replace. Distinct from `bgm_battle`; earned-stakes feel. |
| `bgm_boss` | Final route combat (green dragon fight) | **Kenney `bgm-gameover`** (reused) | Replace. Climactic; only plays on the Rivergate combat. |
| `bgm_lesson` | Dialog-heavy non-combat beats | **Kenney `bgm-lesson`** | Can remain Kenney for v1 if we credit. Post-v1 replace. |
| `bgm_victory` | Capture success + region-master clear sting | **Kenney `bgm-victory`** | Works. Keep for v1. |
| `bgm_gameover` | Faint / loss screen | **Kenney `bgm-gameover`** | Works. Keep for v1. |
| `bgm_menu` | Title + pause | **Kenney `bgm-menu`** | Works. Keep for v1. |

Target count for v1: **10 distinct tracks** split as:

- **5 biome overworld tracks** (village, forest, mountain, water, snow) — these are the five values in `mapMusicTrackSchema` and `highridge_pass`/`rivergate_approach` both map to `bgm_mountain` + `bgm_water`/biome respectively; there is not a 1:1 region→track relationship.
- **3 combat tracks** (default battle, gym, boss)
- **2 menu/sting tracks** (menu/title, victory) — gameover can reuse menu for v1; lesson can reuse battle.

This matches the `bgm_files` keys in `src/content/gameplay/audio.json`. Credits page can reuse `bgm_menu` for v1.

## SFX Catalog

| Slot | Trigger | Current status | Notes |
| --- | --- | --- | --- |
| `sfx_menu_open` | pause / inventory open | **`rpg/sfx/dialog-open`** | Works. |
| `sfx_menu_tick` | menu focus change | **`sfx/click`** | Works. |
| `sfx_menu_confirm` | menu confirm | **`sfx/confirm`** | Works. |
| `sfx_footstep` | player movement | **`rpg/sfx/footstep`** | Works. |
| `sfx_warp` | map transition | **`sfx/drop`** | Replace. Warp needs a distinct rising-tone cue. |
| `sfx_encounter_appear` | tall-grass encounter start | **`sfx/error`** *(!)* | **Replace urgently** — error tone is wrong emotional cue for an encounter. |
| `sfx_hit` | damage applied | **`sfx/drop`** | Replace. Needs a soft + hard variant eventually; single slot OK for v1. |
| `sfx_catch_throw` | capture pod throw | **`sfx/drop`** | Replace. Needs a "whoosh" feel. |
| `sfx_catch_success` | capture success | **`rpg/sfx/pickup`** | Works for v1; post-v1 replace with a bespoke celebratory cue. |
| `sfx_catch_fail` | capture fail | **`sfx/error`** | Acceptable — the error sound's disappointment is on-brand here. |
| `sfx_level_up` | companion level-up | **`sfx/confirm`** | Replace. Needs a dedicated "rising chime" cue. |
| `sfx_faint` | companion or player faint | **`sfx/error`** | Acceptable for v1; consider replacement. |

Additional slots to add before v1:

| New slot | Trigger | Why |
| --- | --- | --- |
| `sfx_tall_grass_rustle` | step into tall-grass zone (pre-encounter tell) | Teaches the player that encounter zones are different. |
| `sfx_critical_hit` | critical damage | Legibility — critical hits must feel different. |
| `sfx_shop_buy` | purchase | Distinct from menu confirm. |
| `sfx_quest_accept` | side-quest start | Distinct positive cue. |

Target count for v1: **>=12 distinct SFX**, all with clear game-state mapping.

## Licensing Policy

Every audio asset shipped in the bundle — anywhere under `public/audio/`, `public/sfx/`, `public/rpg/audio/`, or `public/rpg/sfx/` — must carry one of these four licenses, recorded in this doc:

1. **CC0** (public domain dedication) — no attribution required. Kenney.nl tracks currently in-repo are CC0; see `public/audio/KENNEY-LICENSE.txt` and `public/rpg/audio/LICENSE.txt`.
2. **CC-BY** — credit required. Credit line belongs in a new credits file at docs/CREDITS.md (create when first needed) and in the in-game credits screen.
3. **Commissioned** — a one-off contract with a composer. Contract + deliverable checksum stored out-of-repo; license terms summarized here.
4. **Original** — created by the project team. "Original" means we wrote it and we own it.

**Never** use an asset whose license is "found on the internet", "from a YouTube royalty-free collection", "from a game asset torrent", or any variant of "probably okay". If the license cannot be cited by name and link, the asset is rejected.

**Never** use an asset whose name, motif, or chord progression is franchise-derived. The game is called Rivers Reckoning; it is not a tribute to any specific property.

### Current credits

| Asset family | Source | License | In-repo path |
| --- | --- | --- | --- |
| Kenney music loops (menu, lesson, victory, gameover) | Kenney.nl "Music Loops 1.1" | CC0 (verified via `public/audio/KENNEY-LICENSE.txt`) | `public/audio/bgm-*-kenney.ogg` + `.mp3` |
| RPG placeholder biome BGM (village, forest) | Kenney.nl Music Loops family | CC0 (verified via `public/rpg/audio/LICENSE.txt`) | `public/rpg/audio/bgm-village.ogg`, `public/rpg/audio/bgm-forest.ogg` |
| RPG runtime SFX (dialog-open, footstep, pickup) | TBD — pack source needs confirmation | **Needs license verification** | `public/rpg/sfx/*.ogg` |
| Base UI SFX (click, confirm, drop, error) | TBD — likely Kenney or similar CC0 | **Needs license verification** | `public/sfx/*.ogg` + `.mp3` |

Before v1 release, every entry above needs a specific pack name + version in a new credits file at docs/CREDITS.md + an in-game credits screen entry. Any row with "Needs license verification" is a v1 blocker: verify the source or replace the asset.

## V1 Gap Summary

**Must-do before v1:**
1. Source or commission **5 new BGM tracks**: village, forest, water, snow, gym (distinct from default battle). Each is a ~2-3 minute seamless loop.
2. Source or commission **1 new BGM track** for `bgm_boss` (final green-dragon fight).
3. Replace **`sfx_encounter_appear`** — the current error tone is wrong.
4. Replace at least one of **`sfx_catch_fail`** or **`sfx_faint`** so the acceptance bar's "no asset used for more than one game-state cue" holds (both currently share `sfx/error`).
5. Source or commission **4 new SFX**: warp, catch_throw (whoosh), level_up (chime), tall_grass_rustle.
6. Add the **4 new SFX slots** to `src/content/gameplay/audio.json` — the catalog and the JSON must move together (per the "never add a slot here without JSON" rule at the top of this doc): `sfx_tall_grass_rustle`, `sfx_critical_hit`, `sfx_shop_buy`, `sfx_quest_accept`.
7. Resolve every "Needs license verification" row in the Current credits table — either cite the exact pack or replace.
8. Create **a new credits file at docs/CREDITS.md** and verify every existing asset's license.
9. Update in-game credits screen to reference CREDITS.md entries.

**Acceptance bar for v1 audio:**
- All 5 biome BGM slots (`village`, `forest`, `mountain`, `water`, `snow`) have distinct tracks; the two regions that share a biome slot (highridge/dreadpeak use `bgm_mountain`; rivergate uses `bgm_water`) are acceptable as shared by design.
- Every combat context (wild / region master / boss) has a distinct BGM.
- 12+ SFX wired with no asset used for more than one game-state cue.
- The new credits file at docs/CREDITS.md covers every shipped audio asset with source + license (including `public/rpg/audio/` and `public/rpg/sfx/`).
- No asset's name, filename, or mood references a named franchise.

## Runtime Behavior

Already wired (source: `src/config/audio-controller.ts`, `src/modules/main/audio.ts`, `src/content/gameplay/audio.json`):

- Crossfade between BGM: 800ms (see `audio.json runtime.bgm_crossfade_ms`).
- Combat BGM override by map prefix: see `bgm_selection.gym_map_prefixes` and `map_combat_overrides`.
- SFX volumes normalized by `base_volume` in `audio.json`; the player's settings slider is a multiplier on top.

Desired for v1 (NOT currently implemented):

- **TODO for v1:** pausing gameplay should suspend active BGM and resume it on unpause. The current audio controller is driven by map-id effects and override events; there is no pause hook stopping or restarting playback. Implementing this means hooking the pause overlay's open/close signal to the controller.
