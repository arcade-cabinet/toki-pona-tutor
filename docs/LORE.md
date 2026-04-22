---
title: Lore
updated: 2026-04-22
status: current
domain: creative
---

# Lore

The world, the creatures, the characters. This is the canonical narrative source — if it's in here it's true; if it's not in here and contradicts here, here wins.

All names in toki pona. TP meanings provided for reference but not used in-game (the game is diegetic).

## The world

A small world of seven regions, connected by footpaths and waterways. No one place is far from the next. Weather shifts visibly: the south grows warm and flowering, the north grows cold and white. The culture is village-scale, pre-industrial, organized around a generations-old uneasy coexistence with the **ijo utala** — "fighting-things" — monsters that rise at twilight from ruins, graveyards, old forts, and dungeons dotting the regions. A child coming of age is given a **poki** by their village elder and sent to meet, catch, and train these creatures — ijo utala become _jan pona_ (friend-things) once caught.

Four current **jan lawa** hold the old knowledge of taming the strongest kinds; beating them opens the final route.

Aesthetic: **cozy dark-fantasy** — goblins in the grass, skellies in the crypts, a dragon at the top of the sky — paired with catch-and-befriend mechanics. Warm cream + parchment chrome (see `docs/BRAND.md`), never edgy. Every creature the player fights, the player can also befriend.

### The seven regions (in order of first visit)

| #   | ID              | Name meaning              | Role                                                                                      |
| --- | --------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | `ma_tomo_lili`  | "small home-land"         | **Starter village.** Where jan Sewi gifts the poki and the starter creature. Your home.   |
| 2   | `nasin_wan`     | "path one" / "first road" | **First route.** Tall grass, first encounters, first rival.                               |
| 3   | `nena_sewi`     | "high hill"               | **Mountain pass.** jan Wawa (strong-master) tests the player at a mountain shrine.        |
| 4   | `ma_telo`       | "water-land"              | **Lake village.** jan Telo (water-master) lives here.                                     |
| 5   | `ma_lete`       | "cold-land"               | **Northern snowfield.** jan Lete (ice-master).                                            |
| 6   | `nena_suli`     | "big peak"                | **The great peak.** jan Suli (big-master), hardest jan lawa challenge before the endgame. |
| 7   | `nasin_pi_telo` | "path of water"           | **Riverside fishing route.** Endgame approach.                                            |

Each region's specific tile layout, encounter table, object markers, and trigger points live in its map-authoring spec under `scripts/map-authoring/specs/<id>.ts`, which emits `src/tiled/<id>.tmx` plus `public/assets/maps/<id>.tmj`.

## The species (43 canonical — all catchable)

Every monster in the world is a catchable species. Species IDs are stable; renames break save files. Each has a type, a base stat block, a learnset, a sprite under `public/assets/animals/`, `public/assets/creatures/`, or `public/assets/bosses/`, and a one-sentence corpus-verified description.

**Runtime tier is about encounter rarity, catch difficulty, and animation depth, not catchability.** Legendary creatures are harder catches, but poki works on them just the same. The green dragon is the hardest, rarest final-route catch and the only species with a dedicated defeat animation.

| Species ID           | `name.en` | Type | Runtime tier | Sprite                                             |
| -------------------- | --------- | ---- | ------------ | -------------------------------------------------- |
| `akesi_linja`        | linja     | kasi | common       | `assets/animals/snake.png`                         |
| `akesi_seli`         | seli      | seli | uncommon     | `assets/animals/cobra.png`                         |
| `akesi_sewi`         | akesi     | seli | legendary    | `assets/bosses/green-dragon/idle-green.png`        |
| `akesi_suli`         | suli      | telo | legendary    | `assets/animals/crocodile.png`                     |
| `jan_ike_lili`       | ike       | kasi | common       | `assets/creatures/goblin/goblin.png`               |
| `jan_moli`           | moli      | kasi | common       | `assets/creatures/zombie/zombie.png`               |
| `jan_moli_wawa`      | wawa      | kasi | legendary    | `assets/bosses/zombie-burster/burster.png`         |
| `jan_pi_sewi_pimeja` | pimeja    | lete | common       | `assets/creatures/mummy/mummy.png`                 |
| `jan_utala_lili`     | utala     | kasi | common       | `assets/creatures/goblin/slinger.png`              |
| `jan_utala_suli`     | utala     | wawa | legendary    | `assets/bosses/dread-knight/combat-animations.png` |
| `jan_wawa`           | wawa      | wawa | common       | `assets/creatures/orc/orc.png`                     |
| `jan_wawa_jaki`      | jaki      | wawa | common       | `assets/creatures/orc/soldier-unarmoured.png`      |
| `jan_wawa_linja`     | linja     | wawa | common       | `assets/creatures/orc/archer.png`                  |
| `jan_wawa_suli`      | suli      | wawa | uncommon     | `assets/creatures/orc/champion.png`                |
| `jan_wawa_utala`     | utala     | wawa | common       | `assets/creatures/orc/soldier.png`                 |
| `kala_luka`          | luka      | telo | uncommon     | `assets/animals/octopus.png`                       |
| `kala_telo`          | telo      | telo | common       | `assets/animals/jellyfish.png`                     |
| `kala_tomo`          | tomo      | telo | common       | `assets/animals/hermit-crab.png`                   |
| `kala_uta`           | uta       | telo | common       | `assets/animals/crab.png`                          |
| `kon_moli`           | kon       | seli | common       | `assets/creatures/wraith/wraith.png`               |
| `seli_moli`          | seli      | seli | legendary    | `assets/bosses/fire-skull/fire-skull.png`          |
| `sijelo_kiwen`       | kiwen     | lete | common       | `assets/creatures/skelly/skelly.png`               |
| `sijelo_linja`       | linja     | lete | common       | `assets/creatures/skelly/archer.png`               |
| `sijelo_utala`       | utala     | lete | common       | `assets/creatures/skelly/warrior.png`              |
| `soweli_alasa`       | alasa     | kasi | uncommon     | `assets/animals/fox.png`                           |
| `soweli_anpa`        | anpa      | kasi | common       | `assets/animals/naked-mole-rat.png`                |
| `soweli_jaki`        | jaki      | kasi | common       | `assets/animals/rat.png`                           |
| `soweli_kili`        | kili      | kasi | common       | `assets/animals/squirrel.png`                      |
| `soweli_kiwen`       | kiwen     | wawa | common       | `assets/animals/armadillo.png`                     |
| `soweli_kon`         | kon       | kasi | common       | `assets/animals/skunk.png`                         |
| `soweli_musi`        | musi      | kasi | common       | `assets/animals/cat.png`                           |
| `soweli_nena`        | nena      | kasi | common       | `assets/animals/hedgehog.png`                      |
| `soweli_palisa`      | palisa    | kasi | common       | `assets/animals/porcupine.png`                     |
| `soweli_sewi`        | sewi      | lete | uncommon     | `assets/animals/wolf.png`                          |
| `soweli_utala`       | utala     | wawa | uncommon     | `assets/animals/boar.png`                          |
| `soweli_wawa`        | wawa      | wawa | legendary    | `assets/animals/giant-gorilla.png`                 |
| `telo_jaki`          | jaki      | telo | legendary    | `assets/bosses/slime/idle.png`                     |
| `waso_lape`          | lape      | lete | uncommon     | `assets/animals/owl.png`                           |
| `waso_lete`          | lete      | lete | common       | `assets/animals/penguin.png`                       |
| `waso_moku`          | moku      | seli | uncommon     | `assets/animals/vulture.png`                       |
| `waso_moli`          | moli      | lete | uncommon     | `assets/animals/raven.png`                         |
| `waso_pimeja`        | pimeja    | lete | common       | `assets/animals/bat.png`                           |
| `waso_toki`          | toki      | kasi | common       | `assets/animals/parrot.png`                        |

## The people (jan = person; named jan have canonical TP names)

### jan Sewi — the wise elder

The starter-village grandmother figure. Gifts the player their first **poki** and their first creature in a short diegetic ceremony. Appears in `ma_tomo_lili` at its starting spawn.

### jan Pona — the friend

Lives in the starter village. Friendly helper NPC. Teaches simple vocabulary through small-talk dialog beats.

### jan Telo — water-keeper

In the starter village, teaches about water; later, the **jan lawa** of `ma_telo` — the region 4 master.

### jan Ike — the rival

Appears at the east edge of `nasin_wan`. First forced combat encounter. Reappears across regions as the player's foil; never malicious, always competitive.

### jan Wawa — strong-master (region 3)

Master of the `nena_sewi` mountain shrine. Wields `wawa`-type creatures. Teaches strength through challenge.

### jan Lete — ice-master (region 5)

Master of the `ma_lete` snowfield trial. Wields `lete`-type creatures.

### jan Suli — big-master (region 6)

Master of the `nena_suli` great-peak trial. Final jan lawa challenge before endgame. The toughest of the current four.

### Other named NPCs

-   **jan Kala** (small-fish person, big-fish person) — fisher NPCs in water regions
-   **jan Moku** (food person) — cook NPC
-   **jan Anpa, jan Kasi** — minor villagers in `ma_lete`
-   **jan Pi Kon, jan Pi Nasin** — minor villagers in `nena_suli`
-   **jan Moku Pona, jan Olin Telo** — minor villagers in `nasin_pi_telo`

## Names the game uses for its own things

Avoid English genre-labels in-game; use these TP names:

| Thing            | TP name                                 | Where it appears                                                                                  |
| ---------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Creature catalog | **lipu soweli** (the creature book)     | Menu; updated on each first-encounter                                                             |
| Catch net        | **poki** (container)                    | Inventory; `poki_lili` / `poki_wawa` variants                                                     |
| Trade token      | **ma** (land)                           | Inventory currency; earned from battle wins and spent at jan Moku's stall                         |
| Region master    | **jan lawa** (leader-person)            | NPC role; in-world title                                                                          |
| Region badge     | `sewi` / `telo` / `lete` / `suli` marks | Awarded by the four current jan lawa fights; pause/inventory surfaces show earned marks by region |
| Save file        | (player-invisible; no in-game label)    |                                                                                                   |

## The starter ceremony (canonical beat sequence)

1. Player spawns in `ma_tomo_lili` near jan Sewi.
2. jan Sewi dialog opens: greeting, ceremonial offer.
3. Three starters offered: `kon_moli`, `telo_jaki`, `jan_ike_lili`. Player picks one.
4. jan Sewi gives 3 × `poki_lili` (starter net, low catch power).
5. `starter_chosen` flag set; starter added to party at level 5.
6. Dialog closes; player is free to walk. Warp to `nasin_wan` becomes reachable.

See `src/content/spine/dialog/jan_sewi_starter.json` for the starter ceremony dialog node and `src/content/spine/journey.json` for the canonical seven-beat arc.

## Tone rules

-   **Never grim.** Defeated creatures "pakala" (break / make-a-mistake) rather than "die."
-   **Never condescending.** NPCs never explain game mechanics in meta-terms. They just live in the world.
-   **Never opaque.** If a kid player can't guess what a dialog line means from context + accumulated vocabulary, the line is too hard — shorten it.
-   **Always returnable.** Defeat → wake in last village, party restored. No permadeath. No save corruption.
