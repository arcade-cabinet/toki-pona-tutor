---
title: Story Bible (v1 — archived)
updated: 2026-04-24
status: archived
domain: creative
---

> **Archived.** This doc captured the v1 seven-beat finite story with four region masters, proofs, and a green-dragon ending. That frame is retired in v2 — see `docs/DESIGN.md` for the current open-world design. Kept here for cast + creature + tone reference only.

# Rivers Reckoning — Story Bible

The writer-facing source of truth for Rivers's arc, the four region-master beats, and the green-dragon reveal. This bible pairs with:

- `docs/LORE.md` — world and canonical cast (authoritative for species, region list, and named NPCs).
- `docs/JOURNEY.md` — map-by-map gameplay arc and current beat staging.
- `docs/DESIGN.md` — product principles and non-goals.
- `src/content/clues.json` — investigation journal rows. Every quest in this bible maps to a `clueId`.

If a claim here contradicts LORE or JOURNEY, those win — and this bible should be updated in the same pass.

## Protagonist — Rivers

A village child on the cusp of coming-of-age. Elder Selby gives Rivers their first capture pods and starter companion in the Riverside Home ceremony. Rivers is:

- **Curious, not reckless.** The adventure begins because Rivers noticed something the adults missed: a pattern of odd tracks up the river, hints that *something has changed* in the way the old creatures are moving.
- **Kind before strong.** Rivers's relationship with captured companions is partnership, never ownership. The narrative never rewards cruelty.
- **Pre-literate about the wider world.** Every region teaches Rivers something the player learns alongside them.

Rivers's pronouns in narrative prose are they/them so players can project as they like. Dialog uses neutral framing; portraits show a child in a warm cream-and-river-blue tunic.

## The driving mystery — green dragon

Something woke the green dragon. Rivers finds this out slowly, never all at once. The mystery is structured as a five-beat reveal so that by the time the final route opens the player feels they *solved* it rather than been told it.

| Beat | Where it lands | What the player learns |
| --- | --- | --- |
| **Seeding** | Riverside Home + Greenwood Road | Old villagers mention the dragon only as a children's story. Elder Selby deflects the question. A first "odd track" clue (`wild-signs`) hints something larger moves through the forest. |
| **Rising** | Highridge Pass + Lakehaven | The Highridge Master's fight reveals a scar on a shrine stone that doesn't match any catalog creature. Lakehaven fisher NPCs mention fish moving inland — pressure from upstream. |
| **Turning** | Frostvale | A Frostvale elder recognizes the tracks Rivers has been collecting. "That's a dragon path. They don't walk these in peace." First explicit naming of the green dragon as real, not legend. |
| **Confronting** | Dreadpeak Cavern | The Dreadpeak Master explicitly tells Rivers what they are: the last of the green dragon's watchers. The four region proofs are the keys — the Master grants the fourth and points at the Rivergate route. |
| **Reckoning** | Rivergate Approach | The green dragon is there, and it is catchable. Defeat triggers the dedicated defeat animation. Capture triggers a different ending beat: Rivers walks home with the dragon. Credits either way. |

## Region-master arcs

Each region master has:
1. A **one-line identity**: who they are in the world.
2. A **what-they-guard**: why Rivers has to earn their proof.
3. A **what-Rivers-learns**: the narrative payoff.
4. A **cross-region payoff**: how their arc pays into a later region.

### The Rival — Rook (Greenwood Road → every region)

Identity: Another village kid, also received a starter, also chasing the dragon story for their own reasons. Not villainous — a foil.

What they guard: Nothing. They gate *pace*, not content — every rematch happens exactly where the rival would most naturally have caught up.

What Rivers learns: That the adventure is not solo. Other people in the world have their own reckonings.

Cross-region payoff: Final appearance at the Rivergate Approach entry — they cannot come further. They give Rivers the last piece of the puzzle (a personal note from Elder Selby that Selby couldn't give directly) and wish them luck.

### The Highridge Master (Highridge Pass)

Identity: A weathered shrine-keeper who lives at the top of the mountain pass with a small circle of stone-type companions.

Guards: The first proof (`highridge-proof`). Their fight teaches Rivers to read elevation, because the shrine's fighting floor is tiered.

Rivers learns: Strength in the Rivers Reckoning world is about *readiness*, not level. The Master offers a fight the player *can* win — the player only loses if they came unprepared.

Cross-region payoff: Gifts a path-marker at the Lakehaven entrance that cuts travel time if Rivers returns; this is how side quests cross regions. (See `torch-path` clue.)

### The Lakehaven Master (Lakehaven)

Identity: A lake-village fisher-sage with water-type companions.

Guards: The second proof (`lakehaven-proof`). Fight takes place on a narrow pier — forces Rivers into positional combat.

Rivers learns: The dragon's path follows water. Scars on the lake floor match scars on Highridge.

Cross-region payoff: Writes a letter to the Frostvale elder about the pattern. Delivering that letter is the Frostvale entry quest.

### The Frostvale Master (Frostvale)

Identity: A mountain trial-keeper with ice-type companions.

Guards: The third proof (`frostvale-proof`). The cold is as much the trial as the fight — Rivers can only reach the Master after earning `cold-hands` (warm-weather party gear).

Rivers learns: The green dragon is not a story. It's real. It has a path. The path leads to Rivergate.

Cross-region payoff: The Master's `last-light` lantern unlocks safe traversal of Dreadpeak Cavern.

### The Dreadpeak Master (Dreadpeak Cavern)

Identity: The final current region master. An elder who carries the oldest knowledge of the four; the Master's companions are stone, wraith, and shadow-type.

Guards: The fourth proof (`dreadpeak-proof`). The cavern itself is the trial — encounters are denser, blockers are meaner, and the final chamber is a multi-phase fight.

Rivers learns: The truth. The Master tells Rivers plainly what the dragon is and why they've spent their life guarding the path.

Cross-region payoff: The four proofs in inventory unlock the Rivergate Approach entrance. The Master asks Rivers to choose, not promise, what happens when they meet the dragon.

## Side quests — at least two per region

Each side quest must have: a start NPC, a gameplay trigger, a clue row (from `src/content/clues.json` or new), and a payoff that either unlocks a party/item upgrade or drops a piece of the green-dragon mystery.

The entries below describe the **shipped** quest behavior — the JSON in `src/content/gameplay/quests.json` is the source of truth. Proposed future redesigns are marked explicitly with **[future]** so writers know what's live vs what's aspirational.

### Riverside Home

- **Orchard Helper** (`quest_orchard_helper` → `orchard-fruit` clue) — catch one Applepup for the Riverside snack keeper. Teaches capture mechanic safely.
- **Safe House** (`quest_safe_house` → `safe-house` clue) — catch one Reedfrog near the riverside pond to prove the area is safe for coming-of-age departures.

### Greenwood Road

- **Greenwood Watch** (`quest_greenwood_watch` → `battle-ready` clue) — defeat the rival on Greenwood Road and report back to the route watcher. First forced rival encounter, with XP + trail-token reward.
- **Field Notes** (`quest_field_notes` → `capture-pods` clue) — catch two Greenwood creatures to earn a stronger capture pod from the forest-route pod keeper.
- **Wild Signs** (`quest_wild_signs` → `wild-signs` clue) — catch two forest creatures and bring back what you notice about their tracks. First seed of the dragon mystery for the player.

### Highridge Pass

- **Shrine Stones** (`quest_shrine_stones` → `stone-type` clue) — catch two Pebblebacks for the shrine keeper's stone-count ritual.
- **Lost Hiker** (`quest_lost_hiker` → `torch-path` clue) — carry a trail token down to the lake-village fisher to call a rescue. **Cross-region delivery** to `loren` in Lakehaven.

### Lakehaven

- **Lake Delivery** (`quest_lake_delivery` → `lake-delivery` clue) — deliver Orchard Fruit to the Lakehaven stall keeper. First full quest chain the player can actually complete when they reach the lake.
- **Water Edge** (`quest_water_edge` → `water-edge` clue) — catch two lakeside creatures for the well-tender's field count.

### Frostvale

- **Cold Hands** (`quest_cold_hands` → `cold-hands` clue) — catch two Frostvale creatures for the cold-weather pod keeper. Confirms Rivers can handle the snowfields. **[future]** redesign would gate Frostvale Master access on physical warm gear; current shipped version is a biome-catch count.
- **Snowbird Sighting** (`quest_snowbird_sighting` → `frost-type` clue) — catch one Snowbird so the frost botanist can confirm the cold-season roster.

### Dreadpeak Cavern

- **Torch Path Survey** (`quest_torch_path_survey` → `torch-path` clue) — catch two cave creatures near the Dreadpeak torch path. **[future]** redesign would turn this into a torch-lighting puzzle gating the final chamber; current shipped version is a biome-catch count.
- **Cave Shadow** (`quest_cave_shadow` → `cave-shadow` clue) — catch two more cave creatures beyond the torch path to map the shadows.

### Rivergate Approach

- **Last Light** (`quest_last_light` → `last-light` clue) — catch one river-route creature before the final dragon approach. **[future]** redesign would have Rivers plant the Frostvale lantern at a marker to light the trail to the dragon; current shipped version is a biome-catch count.
- **Companion Bond** (`quest_companion_bond` → `companion-bond` clue) — catch one more river creature so the party is ready for the green dragon.

### [future] planned quest redesigns

These quest ideas are in the bible to capture narrative intent but are NOT currently implemented. They are written here so the eventual implementation PR has a clear brief.

- **Selby's Letter** — Elder Selby asks Rivers to carry a letter upstream to a recipient in the Rivergate Approach. Cross-region seed, delivery unlocks only at endgame. Requires a new `selby-letter` clue and a new deliver_item quest; not in current `quests.json`.
- **Rival's Farewell** — At the Rivergate Approach entry, the Rival hands Rivers a personal note from Selby. Would replace Selby's Letter's direct delivery with a Rival handoff so the two plot threads merge. Not currently shipped.
- **Frog Count**, **Shrine Stones (restore)**, **Owl Sighting**, **Echo Chamber**, **Torch Path (relight)**, **Lost Hiker (rescue)** — richer narrative versions of the shipped biome-catch quests above. Each would need new goal kinds (`survey_points`, `restore_objects`, `solve_puzzle`, `escort_npc`) which don't exist in the current schema.

## Recurring NPCs

- **Elder Selby** (Riverside Home, Rivergate Approach ending) — the grandparent figure. Gives the ceremony, then the last letter.
- **Rook / the Rival** (every region) — pace-gate and foil. Always beaten or befriended, never defeated into silence.
- **The four Masters** (one per gated region) — each makes exactly one speaking appearance post-fight, with one line of cross-region payoff.
- **Kala-Lili and Kala-Suli** (Lakehaven, Frostvale, Rivergate Approach) — the fisher siblings. Their presence in every water region is what tells the player the dragon's path follows water.

## Post-clear loop — free exploration

After credits Rivers walks home. The world stays open. Every side quest remains live until completed. The Bestiary shows catch progress. The Rival's rematch appears at Lakehaven. For v1, there is no player-facing NG+ reset; instead, the final-route entrance stays open so the player can re-fight or re-capture the green dragon as many times as they like (implemented by T14 / PR #113 — `decideFinalBossTrigger` clears `defeatedFlag` on re-entry while keeping `clearedFlag` set so credits do not re-roll). This rewards players who want to complete the Bestiary without punishing a straight-shot player.

NG+ scaffolding already exists in code (`src/modules/main/new-game-plus.ts`) and config (`src/content/gameplay/progression.json → new_game_plus`) keyed off the `game_cleared` flag. It is intentionally not exposed in the shipped v1 post-clear loop. Re-enabling NG+ would be a player-facing toggle on the Title screen, tracked as a future row.

Rationale: the four other post-clear choices considered for the shipped v1 loop were exposing NG+, full rematches, collection-completion reward, and after-credits story epilogue. Free exploration wins because:
- It respects the time of straight-shot players (they get credits and can stop).
- It respects the time of completionists (no artificial reset tax).
- It has the lowest implementation risk — the world already stays in memory, we just leave the gate open.
- It matches the cozy dark-fantasy frame: the world is *lived in*, not a series of locked boxes.

## Writing voice

- Short. Every NPC line under 20 words unless a beat actively earns more.
- Kind before arch. Rivers is a child; no NPC speaks down to them.
- Specific before poetic. "The fish have been moving inland" beats "the waters are troubled."
- No exclamation marks except in diegetic shouting.
- Names use Title Case. Creatures and places use the same name in dialog that the Bestiary and map UI show.
- No franchise references in text, asset names, or comments.

## What this bible is NOT

- Not a dialog script. Authored dialog nodes live in `src/content/spine/dialog/*.json` and compile into `src/content/generated/world.json`; quest configuration lives in `src/content/gameplay/quests.json`; NPC placement + event kind live in `src/content/gameplay/events.json`. This bible defines *what* a quest does; the JSON authors *the words*.
- Not a mechanical spec. Stats, damage numbers, and move data live in `src/content/spine/species/` and `src/content/spine/moves/`.
- Not permanent. Playtests will expose quest beats that don't land; rewrite this bible first, then the JSON, then the code.
