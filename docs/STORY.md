---
title: Story Bible
updated: 2026-04-23
status: current
domain: creative
---

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

### The Rival — jan Ike (Greenwood Road → every region)

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

### Riverside Home

- **The Orchard Favor** — help an orchard keeper catch a common creature that's been taking fruit. Rewards `orchard-fruit` clue + a healing item. Teaches capture mechanic safely.
- **Selby's Letter** — Elder Selby asks Rivers to carry a letter upstream. The recipient appears in the Rivergate Approach only at endgame — deliverable only after the Rivergate opens. First cross-region seed.

### Greenwood Road

- **Greenwood Watch** (existing `greenwood-watch` clue) — a forest watcher asks Rivers to scout three points on the road. Each reveals a different encounter zone. Rewards map knowledge + one rare catch.
- **Rival's Shortcut** — the Rival bets Rivers they can't reach the Highridge entrance first. Racing path gives `forest-cover` clue and a small party-XP bonus.

### Highridge Pass

- **Shrine Stones** — restore three weathered shrine stones scattered along the pass. Rewards `stone-type` clue + an upgrade item.
- **Lost Hiker** — guide an NPC down from a ledge. Gives an item at Lakehaven if the player revisits.

### Lakehaven

- **Lake Delivery** (existing `lake-delivery` clue) — deliver a fisher's catch to Frostvale. Rewards `water-edge` clue + a fast-travel unlock.
- **Frog Count** — count and report the Reedfrog population at three lakeshore spots. Rewards Bestiary data + a modest gold payout.

### Frostvale

- **Cold Hands** (existing `cold-hands` clue) — earn winter gear by gathering three items scattered in the snow. Gates Frostvale Master access.
- **The Owl Sighting** — an elder saw a Drowsy Owl in the wrong season. Rivers scouts for it. Rewards first tier-2 uncommon catch.

### Dreadpeak Cavern

- **Torch Path** (existing `torch-path` clue) — light the cavern's guide torches. Rewards `cave-shadow` clue + safe passage to the final chamber.
- **Echo Chamber** — an old recorder in the cavern's ante-room plays an echo puzzle. Solving it gives a boss-prep item.

### Rivergate Approach

- **Last Light** (existing `last-light` clue) — plant the Frostvale lantern at a marker; trail leads to the dragon. Gates the final fight.
- **Rival's Farewell** — the Rival gives Rivers the personal letter from Selby here; optional but always rewarded with a unique dialog beat on credits.

## Recurring NPCs

- **Elder Selby** (Riverside Home, Rivergate Approach ending) — the grandparent figure. Gives the ceremony, then the last letter.
- **jan Ike / the Rival** (every region) — pace-gate and foil. Always beaten or befriended, never defeated into silence.
- **The four Masters** (one per gated region) — each makes exactly one speaking appearance post-fight, with one line of cross-region payoff.
- **jan Kala, big and small** (Lakehaven, Frostvale, Rivergate Approach) — the fisher siblings. Their presence in every water region is what tells the player the dragon's path follows water.

## Post-clear loop — free exploration

After credits Rivers walks home. The world stays open. Every side quest remains live until completed. The Bestiary shows catch progress. The Rival's rematch appears at Lakehaven. No NG+ reset; instead, the final-route entrance stays open so the player can re-fight or re-capture the green dragon as many times as they like. This rewards players who want to complete the Bestiary without punishing a straight-shot player.

Rationale: the four other post-clear choices considered were NG+, full rematches, collection-completion reward, and after-credits story epilogue. Free exploration wins because:
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

- Not a dialog script. Actual dialog lives in `src/content/gameplay/*.json` (or wherever the current quest-content home is). This bible defines *what* a quest does; the JSON authors *the words*.
- Not a mechanical spec. Stats, damage numbers, and move data live in `src/content/spine/species/` and `src/content/spine/moves/`.
- Not permanent. Playtests will expose quest beats that don't land; rewrite this bible first, then the JSON, then the code.
