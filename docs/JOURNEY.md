---
title: Journey
updated: 2026-04-19
status: current
domain: creative
---

# Journey

The seven-region arc, beat by beat. This is the prose source — `src/content/spine/journey.json` is its machine-readable shape, and the L4 interaction layer will read that JSON to drive the player's progression through the maps. Names of regions, NPCs, and creatures here MUST match `docs/LORE.md` exactly. If anything in this file contradicts LORE.md, LORE wins.

This document is **dev-facing** — every paragraph is a brief for the agent (or human) authoring the corresponding Tiled `.tmx`, NPC dialog, and gate logic. The player never sees this prose. The player sees only what the maps and dialog put on screen.

## Beat 1 — `ma_tomo_lili` (the small home-land)

The player wakes in the starter village. It is a small cluster of stone-floored homes ringed by green grass, with a path leading east out of town. **jan Sewi** stands at the village center near a sign that reads `ma`; **jan Pona** lingers in the upper plaza by another house; **jan Telo** leans against the well on the east side, ruminating about water. The mood is warm-quiet — pre-adventure, no encounters yet.

When the player walks up to **jan Sewi**, the starter ceremony fires: a four-beat dialog where she greets them ("toki"), offers a `poki_lili` ("poki"), invites them to choose ("wan"), and praises the choice ("wawa"). The choice itself is three starters laid out diegetically — `soweli_seli`, `soweli_telo`, `kasi_pona`. Picking one sets the `starter_chosen` flag, drops three `poki_lili` into the player's inventory, and adds the chosen creature to the party at level 5.

**Gate.** `starter_chosen` must be true. Until then, the eastern warp tile to `nasin_wan` is non-interactive — `jan Sewi` (or a stationed sign) waves the player back if they try.

**Transition.** A `Warp` object on the eastern edge of the map (`warp_east`) cuts to `nasin_wan` once the gate clears.

## Beat 2 — `nasin_wan` (the first road)

A long path-route running east-to-west, framed by trees north and south. Three patches of `tall_grass` rectangles are the player's first encounters: `pipi_kon` (air bug), `akesi_ma` (lizard), and `kala_lili` (small fish) are the rolled species, all in the level 3-7 band so the level-5 starter can handle them. The encounter zone is the player's first chance to use a `poki_lili` and see the catch math play out.

Halfway along the route a single sign reads "the path was narrow." At the eastern edge stands **jan Ike**, the rival, who has taken his own starter and wants to prove he's stronger. Speaking to him triggers a forced combat — `soweli_seli` at level 5 with two starter moves. Win or lose, the path past him opens (a kid-friendly loss simply restores the party at the last visited village; this is `ma_tomo_lili` for now).

**Gate.** `defeated:jan_ike` — the rival fight must resolve (win OR loss returns to village; on win the flag sets and the eastern warp activates). No catch quota here; encounters are flavor, not a gate.

**Transition.** `Warp` object on the east edge (`warp_east`) cuts to `nena_sewi`.

## Beat 3 — `nena_sewi` (the high hill)

The terrain shifts. Stone footpaths weave between rocks and tall-grass clumps as the player climbs the mountain pass. Encounters skew toward `wawa`-typed and high-altitude creatures — `waso_sewi` (sky bird), `soweli_lete` (cold-land mammal), `pipi_kiwen` (stone bug). A hiker NPC, **jan Kala**, sits along the path catching her breath and remarks how chilly it is — pure flavor, teaches the word `lete` ahead of the next region.

At the top of the pass, **jan Wawa** — the strong-master and first **jan lawa** — blocks the northward path. Speaking to him triggers his three-beat challenge dialog and a two-creature gym fight: `waso_sewi` at level 8 with `utala_lili` + `wawa_waso`, then `soweli_lete` at level 10 with `utala_lili` + `lete_lili` + `lete_sewi`. Defeating him sets the `badge_sewi` flag and grants the reward word `sewi` to the player's `mastered_words`.

**Gate.** `defeated:jan_wawa` — the gym must be cleared.

**Transition.** Northern `Warp` object (`warp_north`) cuts to `ma_telo`.

## Beat 4 — `ma_telo` (the lake village)

A round village built on a stone island in the middle of a lake. The path enters from the west, crosses the lake-stone causeway, and ends in the central plaza. Two `house_b`/`house_r` clusters frame the plaza; trees ring the outer water edge. There is no tall grass and no random encounters — `ma_telo` is a story-and-shop beat, not a catching beat.

**jan Telo** — first met as the well-leaner in the starter village — is now revealed as the **jan lawa** of `ma_telo`. He stands at the south plaza with two creatures: `kala_suli` at level 10 (water moves) and `kasi_pona` at level 12 (plant moves) — a deliberate type wrinkle that punishes a one-typed party. Beating him sets `badge_telo` and grants the reward word `telo`.

A second NPC, **jan Kala**, sits at the lake's edge and tells the player about something he lost in the water — a small quest stub for a future content pass. **jan Moku** runs a lakeside stall; she is a shopkeeper whose loop is "she sells things, the player buys" but the inventory is TBD this slice.

**Gate.** `defeated:jan_telo` — the gym must be cleared.

**Transition.** Northern `Warp` object (`warp_north`) cuts to `ma_lete`.

## Beat 5 — `ma_lete` (the cold land)

The palette turns. Stone ground with patches of cold-hardy `grass_detail` (which acts as the local tall-grass key), bordered by snow-laden trees and a fenced herb garden. The encounter table mixes `waso_lete` (snow bird), `soweli_lete_suli` (the big bear — first appearance of a lete heavy hitter), `kasi_pona`, and `soweli_suwi` (the cute mammal bruiser). Levels run 7-12.

Three NPCs anchor the village: **jan Lete**, the **jan lawa**, posts up in the village center with `waso_lete` (level 10) and `soweli_lete_suli` (level 13); **jan Anpa**, an elder who watches the snow from her doorstep; and **jan Kasi**, a plant-keeper tending the herb garden behind the fence. Lete's challenge is the first one where a player without a `seli` creature in their party feels real friction — the `soweli_lete_suli` shrugs off most other types. Beating him sets `badge_lete` and grants `lete`.

**Gate.** `defeated:jan_lete` — the gym must be cleared.

**Transition.** Northern `Warp` object (`warp_north`) cuts to `nena_suli`.

## Beat 6 — `nena_suli` (the great peak)

The hardest gym before the endgame. The map is tall and narrow — stone everywhere, sparse tall-grass patches scattered around rocky outcrops. Encounters are heavy birds and the bear: `waso_suli` (the eagle, "king of birds"), `waso_sewi`, and `soweli_lete_suli` again at higher levels (10-15). This region is where the player's party either grows or stalls.

**jan Suli** — the great-peak master — waits at the upper shrine with a level-12 `waso_sewi` (`utala_lili` + `wawa_waso` + `kon_wawa`) and a level-14 `soweli_lete_suli` (`utala` + `lete_wawa` + `lete_suli`). Two ambient NPCs flesh out the climb: **jan pi kon**, a quiet monk meditating on a rock who teaches the word `kon`, and **jan pi nasin**, a lost traveler asking which way is down (pure flavor — teaches `nasin`). Defeating jan Suli sets `badge_suli` and grants the reward word `suli`.

**Gate.** `defeated:jan_suli` — the gym must be cleared. This is the canonical "you are ready" moment in the arc: the player should have at least four badges (`sewi`, `telo`, `lete`, `suli`) before the final route opens.

**Transition.** Southern `Warp` object (`warp_south`) cuts back to `ma_lete`; northern warp goes to `nasin_pi_telo` (renumbered in the journey from the legacy `sike_mun` placeholder in the existing region JSON).

## Beat 7 — `nasin_pi_telo` (the path of water)

The endgame approach. A long riverside route — wide grassy west bank, deep `water` channel down the east side, scattered tall-grass clumps. Encounters are heavily aquatic: `kala_lili`, `kala_telo`, `waso_telo`, `soweli_telo`, and `kala_suli` at the highest levels yet (7-13). The player is finishing their `lipu soweli` here.

Three NPCs populate the bank: **jan Kala Suli**, a veteran fisher who offers a tough optional fight (`kala_suli` level 10 + `kala_telo` level 11) for XP rather than a badge — a final-tune-up fight before the endgame; **jan Kala Lili**, a kid with a small net who is pure cheerful flavor; **jan Moku Pona**, a friendly merchant grilling river fish at a small cart. **jan Olin Telo** sits at the river's edge speaking quietly about the water — atmosphere ahead of the boss.

The endgame trigger lives at the eastern edge of this map. When the player walks onto the eastern `Trigger` object with all four region badges in hand, a cutscene-style transition fires: the green dragon descends, the camera focuses, and the final boss fight begins. The dragon is the only creature with a dedicated death animation; this is what it was reserved for.

**Gate.** `flag:badges_all_four` (set automatically when all of `badge_sewi`, `badge_telo`, `badge_lete`, `badge_suli` are true). Until that flag is true, the eastern trigger is dormant.

**Transition.** A `Trigger` object named `final_boss_trigger` on the eastern map edge fires the green-dragon cutscene + combat. Victory is the credits beat — beyond the scope of this journey manifest, but the transition kind is `cutscene` so the L4 layer knows to hand off to a dedicated final-boss scene rather than another warp.

## Cross-cutting notes

- **No grim language.** Defeated creatures `pakala` (break), they do not die. The dragon, even at death, is a designated narrative beat — not gore.
- **Returnability.** Every gym loss restores the party at the last visited village, no permadeath. The journey is a gentle directed graph, not a pass/fail run.
- **No `sike_mun` reference.** The legacy region JSON for `nena_suli` warps north to `sike_mun`, a placeholder ID that predates this journey pass. The journey treats `nasin_pi_telo` as the canonical seventh region; `sike_mun` is a vestige and will be removed in a follow-up cleanup of the region JSON.
- **The green dragon belongs only to beat 7.** No earlier beat references it, by name or by sprite. This rule is enforced informally here and asserted by the build script (the dragon's species id, if it ever gets one, must not appear in any encounter table).
