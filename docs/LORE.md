---
title: Lore
updated: 2026-04-22
status: current
domain: creative
---

# Lore

The world, the creatures, the characters. This is the canonical narrative source — if it's in here it's true; if it's not in here and contradicts here, here wins.

Rivers Reckoning now presents player-facing names and story text in English. Legacy stable IDs may still use their original short tokens because save files and authored map specs depend on them.

## The world

A small world of seven regions, connected by footpaths and waterways. No one place is far from the next. Weather shifts visibly: the south grows warm and flowering, the north grows cold and white. The culture is village-scale, pre-industrial, organized around a generations-old uneasy coexistence with wild companions: strange creatures that rise at twilight from ruins, graveyards, old forts, and dungeons dotting the regions. A child coming of age is given capture pods by their village elder and sent to meet, catch, and train these creatures as partners.

Four current **region masters** hold the old knowledge of taming the strongest kinds; beating them opens the final route.

Aesthetic: **cozy dark-fantasy** — goblins in the grass, skellies in the crypts, a dragon at the top of the sky — paired with catch-and-befriend mechanics. Warm cream + parchment chrome (see `docs/BRAND.md`), never edgy. Every creature the player fights, the player can also befriend.

### The seven regions (in order of first visit)

| # | ID | Name | Role |
| --- | --- | --- | --- |
| 1 | `riverside_home` | Riverside Home | **Starter village.** Your home, where Elder Selby gives Rivers a capture pod and starter creature. |
| 2 | `greenwood_road` | Greenwood Road | **First route.** Tall grass, first encounters, first rival. |
| 3 | `highridge_pass` | Highridge Pass | **Mountain pass.** A stone shrine and the first region-master fight. |
| 4 | `lakehaven` | Lakehaven | **Lake village.** Story, shop, and water-focused region-master fight. |
| 5 | `frostvale` | Frostvale | **Northern snowfield.** Ice village and cold-weather region-master trial. |
| 6 | `dreadpeak_cavern` | Dreadpeak Cavern | **The great peak.** Hardest region-master challenge before the endgame. |
| 7 | `rivergate_approach` | Rivergate Approach | **Riverside route.** Endgame approach and green-dragon trigger. |

Each region's specific tile layout, encounter table, object markers, and trigger points live in its map-authoring spec under `scripts/map-authoring/specs/<id>.ts`, which emits `src/tiled/<id>.tmx` plus `public/assets/maps/<id>.tmj`.

## The species (43 canonical — all catchable)

Every monster in the world is a catchable species. Species IDs are stable; renames break save files. Each has a type, a base stat block, a learnset, a sprite under `public/assets/animals/`, `public/assets/creatures/`, or `public/assets/bosses/`, and a one-sentence authored English description.

**Runtime tier is about encounter rarity, catch difficulty, and animation depth, not catchability.** Legendary creatures are harder catches, but capture pods work on them just the same. The green dragon is the hardest, rarest final-route catch and the only species with a dedicated defeat animation.

| Species ID | `name.en` | Type | Runtime tier | Sprite |
| --- | --- | --- | --- | --- |
| `vine_adder` | Vine Adder | kasi | common | `assets/animals/snake.png` |
| `ember_adder` | Ember Adder | seli | uncommon | `assets/animals/cobra.png` |
| `green_dragon` | Green Dragon | seli | legendary | `assets/bosses/green-dragon/idle-green.png` |
| `marshjaw` | Marshjaw | telo | legendary | `assets/animals/crocodile.png` |
| `bramble_imp` | Bramble Imp | kasi | common | `assets/creatures/goblin/goblin.png` |
| `bog_wisp` | Bog Wisp | kasi | common | `assets/creatures/zombie/zombie.png` |
| `iron_wraith` | Iron Wraith | kasi | legendary | `assets/bosses/zombie-burster/burster.png` |
| `nightspike` | Nightspike | lete | common | `assets/creatures/mummy/mummy.png` |
| `thornling` | Thornling | kasi | common | `assets/creatures/goblin/slinger.png` |
| `stoneclaw` | Stoneclaw | wawa | legendary | `assets/bosses/dread-knight/combat-animations.png` |
| `tarrin` | Stone Bruiser | wawa | common | `assets/creatures/orc/orc.png` |
| `mire_brute` | Mire Brute | wawa | common | `assets/creatures/orc/soldier-unarmoured.png` |
| `chainback` | Chainback | wawa | common | `assets/creatures/orc/archer.png` |
| `mountain_bear` | Mountain Bear | wawa | uncommon | `assets/creatures/orc/champion.png` |
| `warback` | Warback | wawa | common | `assets/creatures/orc/soldier.png` |
| `riverfin` | Riverfin | telo | uncommon | `assets/animals/octopus.png` |
| `bluefin` | Bluefin | telo | common | `assets/animals/jellyfish.png` |
| `reedfrog` | Reedfrog | telo | common | `assets/animals/hermit-crab.png` |
| `snapper` | Snapper | telo | common | `assets/animals/crab.png` |
| `ashcat` | Ashcat | seli | common | `assets/creatures/wraith/wraith.png` |
| `cinderling` | Cinderling | seli | legendary | `assets/bosses/fire-skull/fire-skull.png` |
| `quartz_shell` | Quartz Shell | lete | common | `assets/creatures/skelly/skelly.png` |
| `frostcoil` | Frostcoil | lete | common | `assets/creatures/skelly/archer.png` |
| `glacier_talon` | Glacier Talon | lete | common | `assets/creatures/skelly/warrior.png` |
| `foxhound` | Foxhound | kasi | uncommon | `assets/animals/fox.png` |
| `burrowmole` | Burrowmole | kasi | common | `assets/animals/naked-mole-rat.png` |
| `mudgrub` | Mudgrub | kasi | common | `assets/animals/rat.png` |
| `applepup` | Applepup | kasi | common | `assets/animals/squirrel.png` |
| `pebbleback` | Pebbleback | wawa | common | `assets/animals/armadillo.png` |
| `mistfox` | Mistfox | kasi | common | `assets/animals/skunk.png` |
| `mirthcat` | Mirthcat | kasi | common | `assets/animals/cat.png` |
| `hillbuck` | Hillbuck | kasi | common | `assets/animals/hedgehog.png` |
| `twiglet` | Twiglet | kasi | common | `assets/animals/porcupine.png` |
| `snowhare` | Snowhare | lete | uncommon | `assets/animals/wolf.png` |
| `fangrunner` | Fangrunner | wawa | uncommon | `assets/animals/boar.png` |
| `boulderhorn` | Boulderhorn | wawa | legendary | `assets/animals/giant-gorilla.png` |
| `mireling` | Mireling | telo | legendary | `assets/bosses/slime/idle.png` |
| `drowsy_owl` | Drowsy Owl | lete | uncommon | `assets/animals/owl.png` |
| `snowbird` | Snowbird | lete | common | `assets/animals/penguin.png` |
| `coalbeak` | Coalbeak | seli | uncommon | `assets/animals/vulture.png` |
| `raven_shade` | Raven Shade | lete | uncommon | `assets/animals/raven.png` |
| `nightjar` | Nightjar | lete | common | `assets/animals/bat.png` |
| `songbird` | Songbird | kasi | common | `assets/animals/parrot.png` |

## The People

### Elder Selby — the wise elder

The starter-village grandmother figure. Gifts the player their first **capture pods** and their first creature in a short diegetic ceremony. Appears in `riverside_home` at its starting spawn.

### Village helpers

Riverside Home includes friendly helper NPCs who establish route safety, capture pods, and healing fruit through short small-talk dialog beats.

### The Lakehaven Master

The water-focused region master of `lakehaven`.

### The Rival

Appears at the east edge of `greenwood_road`. First forced combat encounter. Reappears across regions as the player's foil; never malicious, always competitive.

### The Highridge Master

Master of the `highridge_pass` mountain shrine. Wields stone-type creatures. Teaches strength through challenge.

### The Frostvale Master

Master of the `frostvale` snowfield trial. Wields frost-type creatures.

### The Dreadpeak Master

Master of the `dreadpeak_cavern` great-peak trial. Final region master challenge before endgame. The toughest of the current four.

### Other named NPCs

-   **jan Kala** (small-fish person, big-fish person) — fisher NPCs in water regions
-   **jan Moku** (food person) — cook NPC
-   **jan Anpa, jan Kasi** — minor villagers in `frostvale`
-   **jan Pi Kon, jan Pi Nasin** — minor villagers in `dreadpeak_cavern`
-   **jan Moku Pona, jan Olin Telo** — minor villagers in `rivergate_approach`

## Names the game uses for its own things

Player-facing labels are now English. Internal IDs remain stable until a save-migration pass renames them safely:

| Thing | Player-facing name | Stable internal IDs |
| --- | --- | --- |
| Creature catalog | **Bestiary** | bestiary state keys are species IDs |
| Catch tool | **Capture Pod** / **Heavy Capture Pod** | `capture_pod` / `heavy_capture_pod` |
| Trade token | **Trail Token** | `trail_token` |
| Region master | **Region master** | trainer IDs still use `jan_*` |
| Region badge | Highridge / Lakehaven / Frostvale / Dreadpeak badges | `badge_sewi`, `badge_telo`, `badge_lete`, `badge_suli` |
| Save file | Save slot | preference keys keep the old namespace until migration |

## The starter ceremony (canonical beat sequence)

1. Player spawns in `riverside_home` near Elder Selby.
2. Elder Selby dialog opens: greeting, ceremonial offer.
3. Three starters offered: Ashcat (`ashcat`), Mireling (`mireling`), and Bramble Imp (`bramble_imp`). Player picks one.
4. Elder Selby gives 3 × `capture_pod` (Capture Pods).
5. `starter_chosen` flag set; starter added to party at level 5.
6. Dialog closes; player is free to walk. Warp to `greenwood_road` becomes reachable.

See `src/content/spine/dialog/jan_sewi_starter.json` for the starter ceremony dialog node and `src/content/spine/journey.json` for the canonical seven-beat arc.

## Tone rules

-   **Never grim.** Defeated creatures are knocked down or worn out rather than killed.
-   **Never condescending.** NPCs never explain game mechanics in meta-terms. They just live in the world.
-   **Never opaque.** If a kid player can't guess what a dialog line means from context, the line is too hard — shorten it.
-   **Always returnable.** Defeat → wake in last village, party restored. No permadeath. No save corruption.
