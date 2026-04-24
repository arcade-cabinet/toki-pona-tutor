---
title: Content Architecture — per-region dossiers for parallel authoring
updated: 2026-04-24
status: draft
domain: technical
---

# Content Architecture

How the story content is sliced so it can be parallel-authored by multiple model tiers
(haiku / sonnet / opus) without collisions, then compiled into the runtime JSON the engine
already consumes.

## Goals

1. **Parallelizable.** Two agents authoring two different regions never touch the same file.
2. **Co-located.** Every authoring concern for one region (map spec, NPCs, signs, shop,
   encounter table, quest starts, master fight) lives in one subdirectory.
3. **Tierable.** Macro (arc-level) changes are rare and high-stakes; meso (region-level)
   is the bulk of the writing; micro (single NPC line / single sign) is filler. Each has
   its own file shape and its own model-tier expectation.
4. **Compile-to-existing.** The existing `src/content/generated/world.json` and
   `src/content/gameplay/*.json` shapes don't change. A new build step fans dossiers out
   into those shapes. The engine is unchanged.

## The three tiers

| Tier | Scope | Model | Example task | Example unit |
|---|---|---|---|---|
| Macro | World-wide arc, mystery structure, type system, region order | **Opus** | "Write the 5-beat green-dragon reveal arc" | `docs/STORY.md` sections |
| Meso | One region: map, ~8 NPCs, signs, encounter table, shop, quest starts, master fight | **Sonnet** | "Write the Highridge Pass dossier" | `src/content/regions/highridge_pass/` |
| Micro | One NPC's dialog states, one sign, one species description, one move flavor | **Haiku** | "Write 3 states of dialog for the Highridge shrine-keeper" | `regions/highridge_pass/npcs/shrine_keeper.json` |

## Directory layout (proposal)

```
src/content/
├── story/                       # macro — hand-authored arc bibles
│   ├── arc.json                 # 5-beat master arc (seed/rise/turn/confront/reckoning)
│   ├── mystery.json             # green-dragon reveal structure, per-region clue drops
│   ├── cast.json                # every named NPC in the game: role, first appearance,
│   │                            #   recurring regions, voice notes, cross-region callbacks
│   └── types.json               # the five combat types as flavor (not mechanics — those
│                                #   live in gameplay/combat.json)
│
├── regions/                     # meso — one subdirectory per explorable map
│   ├── riverside_home/
│   │   ├── region.json          # manifest: name, biome, size, music, weather, neighbors
│   │   ├── map-spec.ts          # tile authoring spec (moved from scripts/map-authoring)
│   │   ├── encounters.json      # wild creature tables (empty for village maps)
│   │   ├── shop.json            # optional shop inventory
│   │   ├── quests.json          # quest giver + goals anchored to this region
│   │   ├── master.json          # region-master fight (omitted for non-gym regions)
│   │   ├── signs.json           # every signpost, placard, door-label
│   │   └── npcs/
│   │       ├── elder_selby.json     # one file per speaking character
│   │       ├── piper.json
│   │       ├── wren.json
│   │       ├── oren.json
│   │       ├── fig.json
│   │       └── ...
│   ├── greenwood_road/
│   ├── highridge_pass/
│   ├── lakehaven/
│   ├── frostvale/
│   ├── dreadpeak_cavern/
│   └── rivergate_approach/
│
├── species/                     # unchanged — 43 creature spec files
├── moves/                       # unchanged — 17 move spec files
├── items/                       # unchanged — 5 item spec files
│
└── generated/
    └── world.json               # compiled by pnpm build-spine (consumed at runtime)
```

### Migration path

The old `src/content/spine/dialog/*.json` flat directory is replaced by
`src/content/regions/<id>/npcs/*.json`. The new build-spine compiler:

1. Walks `regions/*/npcs/*.json`, emits the flat dialog records the runtime already
   expects (keeps engine API stable).
2. Walks `regions/*/encounters.json`, merges into the runtime encounter tables.
3. Walks `regions/*/quests.json`, merges into `src/content/gameplay/quests.json`.
4. Walks `regions/*/signs.json`, emits sign records (new runtime API — the engine
   currently has no sign system; adding one is part of this work).
5. Validates every reference: NPC IDs, quest IDs, species IDs, map IDs, flag IDs all
   resolve.
6. Emits the familiar `world.json` plus the existing gameplay JSON, with NO shape
   changes to downstream code.

## NPC file shape (micro tier)

```jsonc
{
  "id": "elder_selby",
  "display_name": "Elder Selby",
  "home_region": "riverside_home",
  "role": "starter_ceremony_giver",          // role tag drives engine placement logic
  "portrait": "selby_portrait",               // resolves to an asset in public/assets/

  "appearances": [                            // where this NPC walks into
    { "region": "riverside_home", "spawn": [10, 6], "default": true },
    { "region": "rivergate_approach", "spawn": [14, 3], "requires_flag": "badges_all_four" }
  ],

  "dialog_states": [                          // ordered, first matching wins
    {
      "id": "starter_ceremony",
      "when": { "flag_absent": "starter_chosen" },
      "beats": [
        { "text": "Rivers. Come here. The river brought us two more this spring." },
        { "text": "Three capture pods on the table. Pick a companion." }
      ],
      "on_exit": { "trigger": "starter_ceremony" }
    },
    {
      "id": "pre_first_gym",
      "when": { "flag_present": "starter_chosen", "flag_absent": "badge_highridge" },
      "beats": [
        { "text": "The Highridge shrine-keeper is expecting you. Walk east." }
      ]
    },
    {
      "id": "post_first_gym",
      "when": { "flag_present": "badge_highridge", "flag_absent": "badge_lakehaven" },
      "beats": [
        { "text": "First proof earned. The fishers in Lakehaven saw something in the water." }
      ]
    },
    // ... one state per story plateau
    {
      "id": "post_clear",
      "when": { "flag_present": "game_cleared" },
      "beats": [
        { "text": "You came home. That matters more than the dragon, Rivers." }
      ]
    }
  ]
}
```

The `when` clauses drive which line fires. The runtime picks the first matching state
when the player interacts. This is a substantial upgrade from the current flat dialog
files: an NPC no longer has one line for the whole game.

## Sign file shape (new, micro tier)

```json
{
  "region": "riverside_home",
  "signs": [
    {
      "at": [7, 8],
      "title": "RIVERSIDE HOME",
      "body": "Where the river remembers your name."
    },
    {
      "at": [10, 5],
      "title": "ELDER'S HOUSE",
      "body": "Selby has lived here since before anyone else."
    }
  ]
}
```

Signs are Pokémon-style flavor plaques. Each is 5-15 words. They add zero mechanical
complexity and triple the sense of a lived-in world. Ship even before the full NPC
density expansion.

## Region manifest shape (meso tier)

```jsonc
{
  "id": "riverside_home",
  "display_name": "Riverside Home",
  "biome": "town",
  "music": "bgm_village",
  "size": { "w": 16, "h": 12 },
  "neighbors": { "east": "greenwood_road" },
  "summary": "Rivers's home village. Green-ringed, river-adjacent. The starter ceremony happens here.",
  "flavor_beats": [
    "Clay-tile roofs. The same ones Selby was born under.",
    "The well in the center is older than the village's oldest story."
  ]
}
```

## Story bible's role

`docs/STORY.md` (and the new `docs/STORY_BEATS.md`) drive what goes in each region dossier.
A meso-tier agent authoring a region reads:
- `docs/STORY.md` — the overall arc
- `docs/STORY_BEATS.md` — the beat-by-beat "what happens in THIS region"
- `docs/RPG_BENCHMARKS.md` — the density targets (≥8 NPCs per populated map, ~200 words)
- `src/content/story/cast.json` — the canonical list of named NPCs to use
- `src/content/regions/<id>/region.json` — the region manifest

Then writes `regions/<id>/{map-spec.ts, npcs/*.json, signs.json, quests.json, ...}`.

A micro-tier agent authoring a single NPC reads:
- That NPC's entry in `cast.json`
- The region manifest
- The story beat for their region
- Then writes one `regions/<id>/npcs/<npc>.json` with 3-5 dialog states.

## Parallelization plan

Once the structure lands:

- **7 meso agents** can author 7 region dossiers in parallel — different subdirectories,
  no file collisions.
- **Inside a region**, a **meso agent** can fan out to **N micro agents** for individual
  NPCs — again, no collisions because each NPC is its own file.
- **Macro-tier** (arc, cast, types) is authored by a single opus pass before meso agents
  start, so all meso agents share a consistent world.

Effort estimate per Option A (Undertale-density):
- 1 opus pass for macro (arc + cast + story-beats): ~4-6 hours
- 7 sonnet passes for region dossiers (1 per region): ~2-3 hours each → **parallel, ~3
  hours wall-clock**
- ~60 haiku passes for individual NPC dialog states: ~10-20 min each →
  **parallel in batches of 10, ~1 hour wall-clock**

Total wall-clock for a full Option A rewrite: **~1 working day** if the parallelization
is clean.

## Compiler work required

- `scripts/build-content.mjs` (new) — fans `src/content/regions/*` and
  `src/content/story/*` into `src/content/generated/world.json` + the existing gameplay
  JSON outputs. Replaces `build-spine.mjs` eventually.
- Zod schemas in `src/content/schema/story.ts` and `src/content/schema/regions.ts`
  enforce the new shapes at build time.
- A runtime sign event kind (if not already present) to surface signpost flavor in the
  dialog UI.

## What this doc does NOT commit to

- An Option (A / B / C) choice. The architecture works for all three; only the amount of
  content authored changes.
- An implementation timeline. Structure must land first, then we decide what volume.
- The Phase C rename. That stays a separate branch (`wip/t47-phase-c-agent-stash`) and
  will land before the dossier migration so renames don't collide with a restructure.

## What lands first (proposed PR sequence)

1. **PR: docs/CONTENT_ARCHITECTURE.md + docs/STORY_BEATS.md** (this doc + the beat spec).
   No code. Gets the plan approved.
2. **PR: Phase C rename completion** (pick up `wip/t47-phase-c-agent-stash`, finish the
   remaining 30%, run gates, ship).
3. **PR: src/content/story/** scaffolding — macro files + Zod schemas. Still no dossier
   migration.
4. **PR: migrate one region** (`riverside_home`) as proof of concept — new dossier,
   new compiler path, emits same world.json. All 848 tests still pass.
5. **PRs: remaining 6 regions**, one per PR, parallel agents.
6. **PR: content expansion pass** — now that every region is a dossier, meso agents
   author the Option-A-density content fill.
