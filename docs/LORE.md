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

A small world of seven regions, connected by footpaths and waterways. No one place is far from the next. Weather shifts visibly: the south grows warm and flowering, the north grows cold and white. The culture is village-scale, pre-industrial, organized around a generations-old uneasy coexistence with the **ijo utala** — "fighting-things" — monsters that rise at twilight from ruins, graveyards, old forts, and dungeons dotting the regions. A child coming of age is given a **poki** by their village elder and sent to meet, catch, and train these creatures — ijo utala become *jan pona* (friend-things) once caught. The seven **jan lawa** hold the old knowledge of taming the strongest kinds; each guards one region and one type.

Aesthetic blend: **Final Fantasy** dark-fantasy encounter art (goblins in the grass, skellies in the crypts, a dragon at the top of the sky) with **catch-and-train** mechanics. Every creature the player fights, the player can also befriend.

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

## The species (18 canonical — all catchable)

Every monster in the world is a catchable species. Species IDs are stable; renames break save files. Each has a type, a base stat block, a learnset, a sprite in `public/assets/creatures/` or `public/assets/bosses/`, and a one-sentence corpus-verified description.

**Tier structure is about encounter rarity + catch difficulty + animation depth, not about catchability.** Tier-2 bosses are harder catches but poki works on them just the same — the green dragon is simply the hardest, rarest, final catch.

### Tier 1 — common creatures (static sprite; tall-grass random encounter)

| Species ID | `name.en` | Type | Sprite | Role |
|---|---|---|---|---|
| `jan_ike_lili` | ike | kasi | `creatures/goblin/goblin.png` | **Starter option 3 (kasi).** Grass-zone common. |
| `jan_utala_lili` | utala | kasi | `creatures/goblin/slinger.png` | Grass-zone ranged variant. |
| `jan_pi_sewi_pimeja` | pimeja | lete | `creatures/mummy/mummy.png` | Crypt / tomb encounter. |
| `jan_wawa` | wawa | wawa | `creatures/orc/orc.png` | Rocky-path bruiser. |
| `jan_wawa_linja` | linja | wawa | `creatures/orc/archer.png` | Ranged orc. |
| `jan_wawa_suli` | suli | wawa | `creatures/orc/champion.png` | Late-game heavy orc. |
| `jan_wawa_utala` | utala | wawa | `creatures/orc/soldier.png` | Armed orc soldier. |
| `jan_wawa_jaki` | jaki | wawa | `creatures/orc/soldier-unarmoured.png` | Raw orc soldier. |
| `sijelo_kiwen` | kiwen | lete | `creatures/skelly/skelly.png` | Bone creature. Cold-type. |
| `sijelo_linja` | linja | lete | `creatures/skelly/archer.png` | Skeletal archer. |
| `sijelo_utala` | utala | lete | `creatures/skelly/warrior.png` | Skeletal warrior. |
| `kon_moli` | kon | seli | `creatures/wraith/wraith.png` | **Starter option 1 (seli).** Spirit-flame. |
| `jan_moli` | moli | kasi | `creatures/zombie/zombie.png` | Shambling grass-plague. |

### Tier 2 — boss creatures (animated sprite; set-piece encounter + rare wild roll)

| Species ID | `name.en` | Type | Sprite | Role |
|---|---|---|---|---|
| `telo_jaki` | jaki | telo | `bosses/slime/` | **Starter option 2 (telo).** Only telo creature in the roster. |
| `seli_moli` | seli | seli | `bosses/fire-skull/` | Fire spirit boss. |
| `jan_utala_suli` | utala | wawa | `bosses/dread-knight/` | Regional champion. |
| `jan_moli_wawa` | wawa | kasi | `bosses/zombie-burster/` | Exploding death creature. |
| `akesi_sewi` | akesi | seli | `bosses/green-dragon/` | **Final boss. Legendary catch.** Only creature with dedicated death animation — used when caught AND when defeated without capture. |

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
