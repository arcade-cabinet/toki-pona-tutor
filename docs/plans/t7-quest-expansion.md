---
title: T7 — Quest expansion sub-plan
updated: 2026-04-23
status: active
domain: planning
---

# T7 — Quest expansion sub-plan

Story bible (PR #96) calls for >=2 side quests per region. Current state (`src/content/gameplay/quests.json` on main) has 7 quests distributed unevenly:

| Region | Quests today |
| --- | --- |
| riverside_home | 1 (`quest_tomo_kili`) |
| greenwood_road | 2 (`quest_nasin_forest_watch`, `quest_nasin_poki_pack`) |
| highridge_pass | **0** |
| lakehaven | 1 (`quest_telo_kili_delivery`) |
| frostvale | 1 (`quest_lete_poki_pack`) |
| dreadpeak_cavern | 1 (`quest_suli_torch`) |
| rivergate_approach | 1 (`quest_telo_last_light`) |

**Gap:** 7 new quests needed to hit the >=2-per-region bar, one of which must land in highridge_pass (currently empty).

## Constraints

- Every quest needs a `giver_npc_id` that **exists** in `events.json` on that map.
- Every quest needs a `goal.kind` from the existing schema: `catch_count` | `catch_any_in_biome` | `defeat_trainer` | `deliver_item`.
- Every reward `reward_clue` must exist in `src/content/clues.json` (or a new clue must be added there).
- The Zod schema in `src/content/gameplay/schema.ts` is the source of truth; invalid quests fail `pnpm validate-challenges`.
- One quest per region must cross-reference another region (per story bible).

## NPC promotion strategy

Rather than invent new NPCs, promote existing `ambient_npc` rows to `quest_npc` and add a `quest_id` field. The ambient dialog stays as a fallback pre-quest; a new "quest offered" dialog fires when the player meets the prerequisite state.

## Proposed 7 new quests

| New id | Map | Giver (promote) | Goal kind | Target | Reward clue | Cross-region note |
| --- | --- | --- | --- | --- | --- | --- |
| `quest_tomo_selby_letter` | riverside_home | `jan-sewi` (starter mentor) | `deliver_item` | letter → `jan_selby_rivergate` | new clue `selby-letter` | Delivers in rivergate_approach |
| `quest_nasin_rival_shortcut` | greenwood_road | `jan-ike` (rival) | `defeat_trainer` | rival rematch | `forest-cover` | Unlocks highridge shortcut |
| `quest_sewi_shrine_stones` | highridge_pass | `jan-kiwen` | `catch_any_in_biome` | mountain 3 | `stone-type` | — |
| `quest_sewi_lost_hiker` | highridge_pass | `jan-nasin-sewi` | `deliver_item` | hiker token → `jan-kala-lake` | `torch-path` | Delivers in lakehaven |
| `quest_telo_frog_count` | lakehaven | `jan-telo-well` | `catch_count` | kala_tomo 3 | `water-type` | — |
| `quest_lete_owl_sighting` | frostvale | `jan-waso-sewi` | `catch_count` | waso_lape 1 | `frost-type` | — |
| `quest_suli_echo_chamber` | dreadpeak_cavern | `jan-kala` | `catch_any_in_biome` | cave 2 | `cave-shadow` | — |

Counts after this PR:

| Region | Quests after |
| --- | --- |
| riverside_home | 2 |
| greenwood_road | 3 |
| highridge_pass | 2 |
| lakehaven | 2 |
| frostvale | 2 |
| dreadpeak_cavern | 2 |
| rivergate_approach | 1 (already covered by `quest_telo_last_light`, adding a second would require rivergate-specific work) |

Note on rivergate_approach: gets a second quest via the `quest_tomo_selby_letter` delivery target. Net ≥2 per region satisfied.

## New clue rows needed

- `selby-letter` — "A sealed letter from Elder Selby to someone at Rivergate."

## Test plan

1. Schema validation: `pnpm build-spine` must accept the new quests.
2. Runtime smoke: `pnpm test:integration` needs a new spec that loads the quest table and asserts each quest's `giver_npc_id` resolves to an NPC on the declared map.
3. Cross-reference: the two cross-region delivery quests must resolve to existing NPCs on the target maps.
4. Content gate: `pnpm validate-challenges` must accept every `reward_clue` reference.

## Out of scope for this sub-plan

- Writing the full dialog tree for each quest — that's a follow-up dialog PR.
- Balancing XP + item rewards against the combat tuning pass (T8).
- Adding the `lupa_jan_lawa` rematch chamber quests — post-v1.

## Owner

Autonomous — agent writes JSON, wires the NPC promotion, adds tests, opens PR. No user input required beyond merging.
