---
title: Journey
updated: 2026-04-22
status: current
domain: creative
---

# Journey

The seven-region arc, beat by beat. This is the prose source — `src/content/spine/journey.json` is its machine-readable shape, and the runtime consumes the generated world content derived from that JSON to drive the player's progression through the maps. Names of regions, NPCs, and creatures here MUST match `docs/LORE.md` exactly. If anything in this file contradicts LORE.md, LORE wins.

This document is **dev-facing** — every paragraph is a brief for the agent (or human) authoring the corresponding Tiled `.tmx`, NPC dialog, and gate logic. The player never sees this prose. The player sees only what the maps and dialog put on screen.

## Beat 1 — `ma_tomo_lili` (the small home-land)

The player wakes in the starter village. It is a small grass-ringed home plot with a path leading east out of town. **jan Sewi** stands at the village center. Four ambient villagers fill out the safe first beat: **jan Pona Tomo** welcomes the player, **jan Telo Well** stands by the water, **jan Poki Tomo** reinforces readiness, and **jan Kili Tomo** anchors the food/healing vocabulary. The mood is warm-quiet — pre-adventure, no encounters yet.

When the player walks up to **jan Sewi**, the starter ceremony fires: a four-beat dialog where she greets them ("toki"), offers a `poki_lili` ("poki"), invites them to choose ("wan"), and praises the choice ("wawa"). The choice itself is three starters laid out diegetically — `kon_moli`, `telo_jaki`, and `jan_ike_lili`. Picking one sets the `starter_chosen` flag, drops three `poki_lili` into the player's inventory, and adds the chosen creature to the party at level 5.

**Side quest.** **jan Kili Tomo** can start `quest_tomo_kili`: catch one `soweli_kili` after leaving town, return to jan Kili Tomo, and receive `kili`, XP, and the `kili` word sighting.

**Gate.** `starter_chosen` must be true. Until then, the eastern warp tile to `nasin_wan` is non-interactive — `jan Sewi` (or a stationed sign) waves the player back if they try.

**Transition.** A `Warp` object on the eastern edge of the map (`warp_east`) cuts to `nasin_wan` once the gate clears.

## Beat 2 — `nasin_wan` (the first road)

A long forest path-route running east-to-west, framed by trees north and south. Three patches of tall grass are the player's first encounters: `jan_ike_lili`, `jan_utala_lili`, `soweli_musi`, `soweli_kili`, `soweli_jaki`, `waso_pimeja`, `soweli_anpa`, `soweli_kon`, `jan_moli`, `waso_toki`, `akesi_linja`, and `soweli_nena` appear across the level 3-7 band so the level-5 starter can handle them. The encounter zone is the player's first chance to use a `poki_lili` and see the catch math play out.

The route now carries five NPC markers: four path walkers (**jan Palisa Nasin**, **jan Kasi Nasin**, **jan Poki Nasin**, **jan Lukin Nasin**) plus **jan Ike**, the rival at the eastern edge. Speaking to jan Ike triggers the forced rival combat. Winning sets `jan_ike_defeated` and opens the path; losing is kid-friendly but still a setback, restoring the party at the last visited village (`ma_tomo_lili` at this point). **jan Poki Nasin** starts `quest_nasin_poki_pack` (catch two forest creatures for `poki_wawa`), and **jan Lukin Nasin** starts `quest_nasin_forest_watch` (defeat jan Ike, then report back for `ma`).

**Gate.** `jan_ike_defeated` — the rival fight must resolve (win OR loss returns to village; on win the flag sets and the eastern warp activates). No catch quota here; encounters are flavor, not a gate.

**Transition.** `Warp` object on the east edge (`warp_east`) cuts to `nena_sewi`.

## Beat 3 — `nena_sewi` (the high hill)

The terrain shifts. Dirt and stone footpaths weave between blocked gray cliffs, rocks, and tall-grass clumps as the player climbs the mountain pass. Encounters skew toward `wawa`-typed and high-altitude creatures: `jan_wawa`, `jan_wawa_linja`, `jan_wawa_jaki`, `sijelo_kiwen`, `soweli_palisa`, `waso_lape`, `akesi_seli`, and `soweli_sewi`. Five NPC markers are now placed on the pass: **jan Kiwen**, **jan Kala**, **jan Waso Sewi**, **jan Nasin Sewi**, and **jan Wawa**. The first four are ambient route flavor; jan Wawa is the gatekeeper fight.

At the top of the pass, **jan Wawa** — the strong-master and first **jan lawa** — blocks the northward path. Speaking to him triggers his challenge dialog and the current RPG.js action-battle trainer event from `src/content/gameplay/trainers.json`: HP 60, ATK 16, PDEF 10, aggressive AI, then a phase-2 swap to HP 80, ATK 20, PDEF 14, tank AI. Defeating him sets the `badge_sewi` flag and grants the reward word `sewi` to the player's `mastered_words`.

**Gate.** Journey beat gate `defeated:jan_wawa`; runtime warp gate `badge_sewi`.

**Transition.** Northern `Warp` object (`warp_north`) cuts to `ma_telo`.

## Beat 4 — `ma_telo` (the lake village)

A round village built on a stone island in the middle of a lake. The path enters from the west, crosses the lake-stone causeway, and ends in the central plaza. Two `house_b`/`house_r` clusters frame the plaza; trees ring the outer water edge. There is no tall grass and no random encounters — `ma_telo` is a story-and-shop beat, not a catching beat.

**jan Telo** — first met as the well-leaner in the starter village — is now revealed as the **jan lawa** of `ma_telo`. He stands at the south plaza and uses the current action-battle trainer config: HP 80, ATK 20, PDEF 12, defensive AI, then a phase-2 swap to HP 100, ATK 24, PDEF 16. Beating him sets `badge_telo` and grants the reward word `telo`.

**jan Kala** rests at the lake's edge and starts `quest_telo_kili_delivery`: carry one `kili` to **jan Moku**, then return for `telo_pona`, XP, and a `telo` sighting. **jan Olin Telo** is a quiet lakeside villager who reinforces the water-region mood. **jan Moku** runs a lakeside stall that sells `poki_lili`, `kili`, `telo_pona`, and `poki_wawa` for `ma`. **jan Sike Telo** fills the central plaza with extra water-town flavor.

**Gate.** Journey beat gate `defeated:jan_telo`; runtime warp gate `badge_telo`.

**Transition.** Northern `Warp` object (`warp_north`) cuts to `ma_lete`.

## Beat 5 — `ma_lete` (the cold land)

The palette turns. Snow and ice ground give way to stone village paths, bordered by snow-laden trees, a well, houses, and a fenced herb garden. Snow tall-grass patches carry the encounter table: `sijelo_linja`, `sijelo_kiwen`, `jan_pi_sewi_pimeja`, `waso_lete`, `soweli_nena`, `soweli_kiwen`, and `sijelo_utala`. Levels run 7-12.

Five NPCs anchor the village: **jan Lete**, the **jan lawa**, posts up in the village center with the current action-battle trainer config (HP 90, ATK 22, PDEF 14, ranged AI, then phase 2 HP 120, ATK 30, PDEF 20, tank AI); **jan Anpa**, an elder who watches the snow from her doorstep; **jan Kasi**, a plant-keeper tending the herb garden behind the fence; **jan Suno Lete**, a cold-light villager; and **jan Poki Lete**, a traveler checking supplies who starts `quest_lete_poki_pack` (catch two ice-biome creatures for `poki_wawa`). Beating jan Lete sets `badge_lete` and grants `lete`.

**Gate.** Journey beat gate `defeated:jan_lete`; runtime warp gate `badge_lete`.

**Transition.** Northern `Warp` object (`warp_north`) cuts to `nena_suli`.

## Beat 6 — `nena_suli` (the great peak)

The hardest gym before the endgame. The map is tall and narrow — a cave-shrine climb with blocked rock walls, stone floors, torch landmarks, and sparse encounter overgrowth around rocky outcrops. Encounters are `jan_wawa_suli`, `jan_wawa_utala`, `jan_utala_suli`, `soweli_utala`, `sijelo_utala`, `waso_moku`, `waso_moli`, `soweli_sewi`, `soweli_alasa`, and `soweli_wawa` at levels 10-15. This region is where the player's party either grows or stalls.

**jan Suli** — the great-peak master — waits at the upper shrine with the current action-battle trainer config: HP 110, ATK 28, PDEF 18, aggressive AI, then phase 2 HP 140, ATK 36, PDEF 22, berserker AI. Four NPCs flesh out the climb: **jan Kiwen Suli**, **jan pi kon**, **jan Pimeja Suli**, and **jan pi nasin**. **jan Pimeja Suli** starts `quest_suli_torch` (catch two cave-biome creatures for `telo_pona`). They reinforce cave, quiet, and route vocabulary before the gym fight. Defeating jan Suli sets `badge_suli` and grants the reward word `suli`.

**Gate.** Journey beat gate `defeated:jan_suli`; runtime warp gate `badge_suli`. This is the canonical "you are ready" moment in the arc: the player should have at least four badges (`sewi`, `telo`, `lete`, `suli`) before the final route opens.

**Transition.** Northern `Warp` object (`warp_north`) cuts to `nasin_pi_telo`.

## Beat 7 — `nasin_pi_telo` (the path of water)

The endgame approach. A long riverside route — wide grassy west bank, deep water channel down the east side, and scattered tall-grass clumps. Encounters are heavily aquatic/endgame-leaning: `jan_moli`, `kon_moli`, `telo_jaki`, `kala_telo`, `kala_uta`, `kala_tomo`, `jan_moli_wawa`, `kala_luka`, `seli_moli`, `akesi_suli`, and the rare `akesi_sewi` across the level 7-13 band. The player is finishing their `lipu soweli` here.

Five NPCs populate the bank: **jan Kala Lili**, a kid with a small net who is pure cheerful flavor; **jan Moku Pona**, a friendly cook grilling river fish; **jan Kala Suli**, a veteran fisher who gives final-route tune-up flavor; **jan Olin Telo**, a quiet river watcher; and **jan Suno Telo**, the final quest-giver before the boss trigger. **jan Suno Telo** starts `quest_telo_last_light` (catch one water-route creature for two `poki_wawa`).

The endgame trigger lives at the eastern edge of this map. When the player walks onto the eastern `Trigger` object with all four region badges in hand, a cutscene-style transition fires: the green dragon descends, the camera focuses, and the final boss fight begins. The dragon is the only creature with a dedicated death animation; the final-boss defeat path is what it was reserved for.

**Gate.** `flag:badges_all_four` is the virtual aggregate condition for `badge_sewi`, `badge_telo`, `badge_lete`, and `badge_suli`. Until all four are true, the eastern trigger is dormant.

**Transition.** A `Trigger` object named `final_boss_trigger` on the eastern map edge fires the green-dragon cutscene + combat. Victory is the credits beat — beyond the scope of this journey manifest, but the transition kind is `cutscene` so the L4 layer knows to hand off to a dedicated final-boss scene rather than another warp.

## Cross-cutting notes

- **No grim language.** Defeated creatures `pakala` (break), they do not die. The dragon, even at death, is a designated narrative beat — not gore.
- **Returnability.** Every gym loss restores the party at the last visited village, no permadeath. The journey is a gentle directed graph, not a pass/fail run.
- **No `sike_mun` reference.** The canonical seventh region is `nasin_pi_telo`; current specs, TMX/TMJ artifacts, and the journey manifest use that id.
- **The green dragon belongs only to beat 7.** No earlier beat references it, by name or by sprite. The build script (`scripts/build-spine.mjs`) enforces this: any encounter table in a non-final beat that lists the final-boss species causes the build to fail. The dragon's species id is `akesi_sewi`; do not use that id outside beat 7.
