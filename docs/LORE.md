---
title: Lore
updated: 2026-04-19
status: current
domain: creative
---

# Lore

The world, the creatures, the characters. This is the canonical narrative source — if it's in here it's true; if it's not in here and contradicts here, here wins.

All names in toki pona. TP meanings provided for reference but not used in-game (the game is diegetic).

## The world

A small world of seven regions, connected by footpaths and waterways. No one place is far from the next. Weather shifts visibly: the south grows warm and flowering, the north grows cold and white. The culture is village-scale, pre-industrial, built around care for animals and respect for elders.

### The seven regions (in order of first visit)

| # | ID | Name meaning | Role |
|---|---|---|---|
| 1 | `ma_tomo_lili` | "small home-land" | **Starter village.** Where jan Sewi gifts the poki and the starter creature. Your home. |
| 2 | `nasin_wan` | "path one" / "first road" | **First route.** Tall grass, first encounters, first rival. |
| 3 | `nena_sewi` | "high hill" | **Mountain pass.** jan Wawa (strong-master) tests the player in a mountain gym. |
| 4 | `ma_telo` | "water-land" | **Lake village.** jan Telo (water-master) lives here. |
| 5 | `ma_lete` | "cold-land" | **Northern snowfield.** jan Lete (ice-master). |
| 6 | `nena_suli` | "big peak" | **The great peak.** jan Suli (big-master), hardest gym before the endgame. |
| 7 | `nasin_pi_telo` | "path of water" | **Riverside fishing route.** Endgame approach. |

Each region's specific tile layout, encounter table, and trigger points live in its spine JSON (`src/content/spine/regions/<id>.json`) and its Tiled map (`<id>.tmx` — new this PR).

## The species (17 canonical)

Species IDs are stable; renames break save files. All are catchable except where noted. Each species has a type, a base stat block, a learnset, and a one-sentence corpus-verified description.

| Species | Type | Notes |
|---|---|---|
| `soweli_seli` | seli | The fire mammal. Starter option 1. |
| `soweli_telo` | telo | The water mammal. Starter option 2. |
| `kasi_pona` | kasi | The plant creature. Starter option 3. |
| `soweli_suwi` | wawa | The cute mammal (cat-shaped). Bruiser. |
| `soweli_lete` | lete | The cold-land mammal. |
| `soweli_lete_suli` | lete | The big bear. Late-game. |
| `akesi_ma` | lete | The lizard. Cold-blooded; odd type pairing. |
| `kala_lili` | telo | Small fish. Schooling encounter. |
| `kala_telo` | telo | Water fish. |
| `kala_suli` | telo | Big fish. |
| `pipi_kiwen` | wawa | Stone bug. Hard-shelled. |
| `pipi_kon` | wawa | Air bug. |
| `waso_lete` | lete | Snow bird. |
| `waso_telo` | telo | Water bird. |
| `waso_lili` | wawa | Small bird. |
| `waso_suli` | wawa | Eagle — "king of birds" per its description. |
| `waso_sewi` | wawa | Sky bird. High-altitude. |

## The creatures that are NOT catchable

The **green dragon** (`public/assets/bosses/green-dragon/`) is the designated **final boss**. It is NOT a catchable species — it is a unique narrative entity. It has the only dedicated death animation in the asset library, and that animation is reserved for its defeat at the endgame.

Other boss sprites (`dread-knight`, `slime`, `fire-skull`, `zombie-burster`) are also non-standard — they're used for gym jan-lawa set-piece fights, rivals, or specific-scene encounters, not wild tall-grass rolls.

## The people (jan = person; named jan have canonical TP names)

### jan Sewi — the wise elder

The starter-village grandmother figure. Gifts the player their first **poki** and their first creature in a short diegetic ceremony. Appears in `ma_tomo_lili` at its starting spawn.

### jan Pona — the friend

Lives in the starter village. Friendly helper NPC. Teaches simple vocabulary through small-talk dialog beats.

### jan Telo — water-keeper

In the starter village, teaches about water; later, the **jan lawa** of `ma_telo` — the region 4 gym master.

### jan Ike — the rival

Appears at the east edge of `nasin_wan`. First forced combat encounter. Reappears across regions as the player's foil; never malicious, always competitive.

### jan Wawa — strong-master (region 3)

Master of the `nena_sewi` mountain gym. Wields `wawa`-type creatures. Teaches strength through challenge.

### jan Lete — ice-master (region 5)

Master of the `ma_lete` snowfield gym. Wields `lete`-type creatures.

### jan Suli — big-master (region 6)

Master of the `nena_suli` great-peak gym. Final gym before endgame. The toughest of the seven.

### Other named NPCs

- **jan Kala** (small-fish person, big-fish person) — fisher NPCs in water regions
- **jan Moku** (food person) — cook NPC
- **jan Anpa, jan Kasi** — minor villagers in `ma_lete`
- **jan Pi Kon, jan Pi Nasin** — minor villagers in `nena_suli`
- **jan Moku Pona, jan Olin Telo** — minor villagers in `nasin_pi_telo`

## Names the game uses for its own things

Avoid English genre-labels in-game; use these TP names:

| Thing | TP name | Where it appears |
|---|---|---|
| Creature catalog | **lipu soweli** (the creature book) | Menu; updated on each first-encounter |
| Catch net | **poki** (container) | Inventory; `poki_lili` / `poki_wawa` variants |
| Region master | **jan lawa** (leader-person) | NPC role; in-world title |
| Gym badge | (TBD — likely **sike pi jan lawa** "circle of the leader") | Awarded per-gym win |
| Save file | (player-invisible; no in-game label) | |

## The starter ceremony (canonical beat sequence)

1. Player spawns in `ma_tomo_lili` near jan Sewi.
2. jan Sewi dialog opens: greeting, ceremonial offer.
3. Three starters offered: `soweli_seli`, `soweli_telo`, `kasi_pona`. Player picks one.
4. jan Sewi gives 3 × `poki_lili` (starter net, low catch power).
5. `starter_chosen` flag set; starter added to party at level 5.
6. Dialog closes; player is free to walk. Warp to `nasin_wan` becomes reachable.

See `src/content/spine/regions/ma_tomo_lili.json` for the canonical dialog text.

## Tone rules

- **Never grim.** Defeated creatures "pakala" (break / make-a-mistake) rather than "die."
- **Never condescending.** NPCs never explain game mechanics in meta-terms. They just live in the world.
- **Never opaque.** If a kid player can't guess what a dialog line means from context + accumulated vocabulary, the line is too hard — shorten it.
- **Always returnable.** Defeat → wake in last village, party restored. No permadeath. No save corruption.
