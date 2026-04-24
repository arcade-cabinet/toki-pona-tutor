---
title: RPG Narrative Benchmarks
updated: 2026-04-24
status: draft
domain: research
---

# RPG Narrative Benchmarks

Hard-number research on what a "Pokémon-length" or "Final Fantasy-length" game actually contains,
pulled from disassemblies and primary sources. Used to ground the story-bible rewrite in
evidence, not vibes.

## Bottom line

| Metric | Pokémon Red/Blue (1996) | Rivers Reckoning (today) | Gap |
|---|---:|---:|---|
| Total unique maps | **225** | 7 | **32× smaller** |
| Overworld locations (towns/routes/caves) | ~100 | 7 | 14× |
| Dialog script, English words | **~20,000** | ~3,200 | **6× smaller** |
| Main-story playtime target | 26 hours | (playable: 15-30 min) | 50-100× |
| Unique named NPCs | ~150+ | ~15 | 10× |
| Pallet Town tile size | ~1,440 tiles | — | — |
| Riverside Home tile size | — | 192 tiles | **7.5× smaller than Pallet Town alone** |
| Towns with ≥5 NPCs | 9 of 9 | 4 of 7 (rest have 0) | — |

Sources: [pret/pokered disassembly](https://github.com/pret/pokered), [Bulbapedia Kanto](https://bulbapedia.bulbagarden.net/wiki/Kanto), [Pallet Town has 8 residents](https://pokemon.fandom.com/wiki/Pallet_Town), [HowLongToBeat 26hrs Pokémon Red via GameRant](https://gamerant.com/shortest-longest-pokemon-games-length-how-long-to-beat-hltb/).

## Pokémon Red/Blue — the 1996 GameBoy benchmark

Pokémon Red/Blue is the lowest-specification reference point for "what a creature-catching
RPG needs to feel complete." It fits in 1 MB ROM, ran on a 4 MHz CPU, shipped on a grayscale
2.5-inch screen. Everything below is from [pret/pokered](https://github.com/pret/pokered),
a production-grade disassembly of the original ROM. The per-map counts are from
`curl api.github.com/repos/pret/pokered/contents/maps` (unique basenames) and
`curl api.github.com/repos/pret/pokered/contents/text` (script files).

### World scale

- **225 unique maps** in `maps/` (each is a distinct screen the player can walk into).
- Breakdown:
  - **9** cities/towns (Pallet, Viridian, Pewter, Cerulean, Vermilion, Lavender, Celadon, Fuchsia, Cinnabar)
  - **44** route-map files (many routes are 2-3 screens each — Route 1 is 180 tile-blocks vs Pallet's 90)
  - **8** gyms (1 interior map each, with 2F for some)
  - **48** interior rooms (houses, shops, labs) — these are what makes each town feel *lived in*
  - **39** dungeon floors (Mt. Moon 3 floors, Rock Tunnel 2 floors, Silph Co. 11 floors, Cerulean Cave 3 floors, Pokémon Tower 7 floors, Victory Road 3 floors, Seafoam 4 floors)
  - **15** PokéMarts and **15** Pokémon Centers (one per town + duplicates at key points)

### Dialog volume

- **211 script-text files** totaling **236 KB** in `text/`
- Estimated **~20,000 English words** of dialog (sampled 8 files, 1525 words for 18KB, extrapolated)
- Per-location breakdown from direct disassembly:
  - Pallet Town script: **72 words** — 4 NPCs saying short lines
  - Route 1 script: **80 words** — 2 trainers, 1 sign
  - Oak's Lab: **552 words** — the opening ceremony
  - Viridian City: **273 words** — 5 NPCs + signs + shop
  - Cerulean City: **338 words** — 10+ NPCs, rival encounter
  - Pewter Gym: **35 words** — Brock's two lines pre/post
- Characteristics:
  - Each NPC says 1-3 sentences (15-40 words). No long speeches.
  - Towns average ~200 words, gyms ~40 words (the fight speaks for itself), big cities ~400 words.
  - Signs exist and carry lore ("PALLET TOWN — Shades of your journey await!").

### NPC density

- **Pallet Town** (the smallest town in Kanto): 8 residents — mother, Professor Oak, 3 lab assistants, rival's sister Daisy, 2 extras. Plus Oak's lab is itself populated. [Source](https://pokemon.fandom.com/wiki/Pallet_Town)
- **Viridian City**: 6 overworld NPCs + Pokémart + Gym + school
- **Cerulean City**: ~10 overworld NPCs + Mart + Gym + rocket + scientist
- **Pattern**: every town has a Pokémon Center keeper, a Mart clerk, 3-6 villagers, a gym trainer or two, a plot NPC. ~10 NPCs per town is typical.
- **Routes**: 2-6 trainers per route (each a combat NPC with 20-50 words of dialog).

### Playtime

- Main story: **25-26 hours** average ([GameRant](https://gamerant.com/shortest-longest-pokemon-games-length-how-long-to-beat-hltb/))
- Completionist (full Pokédex, all trainers): 60+ hours

## Final Fantasy VI, Chrono Trigger, Earthbound — SNES cohort

All three cluster at **25-35 hours** main story per HowLongToBeat reports surfaced in [Gamer Rant's SNES longest](https://gamerant.com/longest-snes-games-time-to-beat/) and [TheGamer on FFVI](https://www.thegamer.com/final-fantasy-6-pixel-remaster-how-long-to-beat/).

- **Final Fantasy VI**: ~35 hours, 14 playable characters each with a backstory beat, ~30 locations, overworld + towns + dungeons on separate maps.
- **Chrono Trigger**: 23-30 hours, 7 eras of time, ~50 locations across eras.
- **Earthbound**: 25-30 hours, 8 "Your Sanctuary" locations but dozens of filled towns between them.

Common structure: **playable hours ÷ 15 = map count** is a rough floor. A 25-hour game needs
at least ~50 distinct explorable screens to not feel repetitive.

## Undertale — the indie outlier

- ~6-8 hour main story (much shorter than SNES cohort).
- **16,000 lines of dialogue** ([per this 2016 dump](https://gamefaqs.gamespot.com/pc/180989-undertale/faqs/72468)) across ~30 location screens.
- Density trade-off: fewer maps, much denser writing per map. Every NPC has a speech and
  multiple states that change as the story progresses.

## What this means for Rivers Reckoning

Three honest options, quantified:

### Option A — "Undertale-density" short RPG (3-5 hour experience)

Keep 7-9 maps, but **5-10× the NPC count per map** and **3× the dialog per NPC**. Each
region becomes densely written, each NPC has multiple dialog states tied to plot flags,
species catch-count, and quest progression.

- Map count: 7 → 9 (add 2 — a village interior, one "ruins" area)
- NPCs per map: 0-5 → 8-12 (every map has at least 8 speaking characters)
- Dialog: 3,200 → ~15,000 words (~5× current)
- Playtime: 15-30 min → 4-6 hours
- Effort: 2-3 weeks of writing + 1 week of implementation

### Option B — "Pokémon-lite" mid-length RPG (12-15 hour experience)

Expand each region into 2-3 screens (town + route + interior). Match per-map NPC density
to Pokémon's ~8 NPCs per town baseline.

- Map count: 7 → ~20 (each of the 7 regions gets a town + route + dungeon/shrine)
- NPCs per map: match Pokémon (~6-10 per town, 2-4 per route)
- Dialog: 3,200 → ~12,000 words (~4× current, matching Pokémon Red's 20k scaled to 20 maps)
- Playtime: 15-30 min → 12-15 hours
- Effort: 2 months of writing + 3-4 weeks of map authoring + encounter balance

### Option C — "Full Pokémon-scale" long RPG (25-30 hour experience)

Match Pokémon Red/Blue structure: 50+ maps, 100+ NPCs, 20,000 words, full towns-plus-routes
world. Every species has a habitat region. Every region has a hub town + 2-3 routes + an
interior/dungeon + a gym.

- Map count: 7 → ~60
- NPCs per map: match Pokémon (~8-12 per town, 2-4 per route)
- Dialog: 3,200 → ~20,000-25,000 words
- Playtime: 15-30 min → 25-30 hours
- Effort: 6-9 months minimum for a single author

## Recommendation

Option A is the only one shippable in weeks. Option B is shippable in a quarter. Option C
is a multi-quarter commitment.

The first cut of the story bible should target **Option A** — prove the writing voice and
density work in 7-9 maps, then decide whether to expand to Option B for v1.0 shipping.

## What the next story-bible pass needs to produce

- **Names** on everything. No "Orchard" — the orchard-keeper has a name, a voice, a history
  with Rivers's parents.
- **Culture context** for every region. Highridge isn't just "mountain." It's a *place where
  someone lives* with seasons, trade, grudges.
- **NPC density checklist per map**: minimum 6-8 speaking NPCs in populated maps.
- **Dialog states**: every NPC gets a "pre-starter," "post-starter," "post-first-gym,"
  "post-clear" line so the world feels reactive.
- **Word budget per map**: 200 words for a populated map (matches Pokémon town baseline),
  50 words for a route map.
- **Signs** on every map. Pokémon's signs carry lore in one line.
- **Cross-map callbacks**: every major NPC references either an earlier event the player
  did or a later region they know about. No NPC exists in a vacuum.

## Sources

- [pret/pokered — Pokémon Red/Blue disassembly](https://github.com/pret/pokered) — authoritative for map count, script count, script file sizes
- [Bulbapedia — Kanto region](https://bulbapedia.bulbagarden.net/wiki/Kanto) — 10 cities/towns, 28 routes
- [Pokémon Wiki — Pallet Town](https://pokemon.fandom.com/wiki/Pallet_Town) — 8 residents
- [GameRant — shortest/longest Pokémon games](https://gamerant.com/shortest-longest-pokemon-games-length-how-long-to-beat-hltb/) — 26h Pokémon Red main story
- [TheGamer — How Long Does It Take To Finish FF VI](https://www.thegamer.com/final-fantasy-6-pixel-remaster-how-long-to-beat/) — 35h FFVI
- [GameRant — longest SNES games](https://gamerant.com/longest-snes-games-time-to-beat/) — FF VI, Chrono Trigger, Earthbound cluster
- [hushbugger — Undertale dialogue dump](https://hushbugger.github.io/dialogue/) — Undertale script references
