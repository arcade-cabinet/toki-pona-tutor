---
title: Design
updated: 2026-04-24
status: draft
domain: product
---

# Design — Rivers Reckoning v2

Rivers Reckoning is a cozy open-world creature-catching RPG. The player is Rivers, a kid who steps into a world that's always a little bigger than they expect. There is no finite story, no badge gate, no final boss. The game is about **wandering, collecting, befriending, and paying attention** — and the world is generous enough to reward any of those indefinitely.

This doc supersedes the v1 story-bible framing (finite seven-beat arc, four region masters, green-dragon ending). That frame is **retired**. The prior docs (`docs/STORY.md`, `docs/STORY_BEATS.md`) are archived in `docs/archive/` for cast and creature reference only.

## What the player does

- **Walks.** Outdoor exploration is the core verb. Tap-to-walk on phone, arrows on desktop.
- **Meets creatures.** Wild encounters in grass, water, caves, snow — the same catching mechanic as v1. Every species is catchable. Rare species exist but gate nothing.
- **Builds a party.** Up to six creatures. XP + levels. Catch them, train them, rotate them, release them.
- **Talks to people.** NPCs in villages and on roads offer flavor, rumor, and optional bite-sized challenges.
- **Takes challenges.** A challenge is: NPC states a problem, player acts on it, NPC resolves. Reward is gold + loot from the universal drop function. Never a story gate.
- **Spends money.** Shops sell consumables, pods, gear. Inns restore party HP for a fee. Buying and resting are the money sinks.
- **Discovers the world.** The world is fully procedurally generated from a grammar extracted from the seven hand-crafted v1 maps. Chunks stitch together by adjacency rules and persist per-seed in SQLite. Walking a new direction means finding a new village, a new grove, a new cave.

## What the game IS

- **A walk-first RPG** with JRPG combat underneath.
- **Seeded, persistent, open.** One seed per save. Every chunk the player visits is stored with its deltas (NPCs moved, chests opened, creatures caught). Revisit and the world is the same as you left it.
- **Rule-based procedural.** The world is NOT noise. It is generated from a grammar: biome archetypes, village archetypes, adjacency rules, landmark patterns, dialog-pool composition. The seven v1 maps informed the grammar; they are not themselves "stamped in" at fixed positions.
- **Pokédex without the dex panic.** Completion is optional and playful, not a 151-slot obligation. The bestiary tracks what you've met, but there's no "gotta catch 'em all" pressure.
- **Loot-warm.** Gear and items roll from one universal log-scaled drop function. Every wild defeat, every quest, every chest, every catch uses the same function with different multipliers. No one drop is pivotal; the sum is texture.
- **Replayable.** New seed = new world. Creature set is the same; adventure isn't.

## What the game IS NOT

- **Not finite.** No credits. No "endgame." No required beats. You can walk for ten hours or ten minutes.
- **Not a branching story.** No flag graphs, no quest chains, no gated content. Every optional challenge is self-contained: challenge → response → resolve.
- **Not level-gated.** No area refuses entry because you're the wrong level. Encounter levels scale with distance-from-start; drop levels scale with player level; both logarithmic and in lock-step, so the player is never catastrophically out of band (see "Region scaling" below).
- **Not a Pokémon gym circuit.** No four masters, no four badges, no proofs, no `badge_*` flags. The trainer archetype still exists (optional rival + boss encounters) but fighting one is not a structural promotion.
- **Not a translation / vocabulary exercise.** Native English. No corpus.
- **Not a clone of any trademarked property.** Use original names and genre-neutral language.
- **Not grind-first.** Encounters should feel chosen. Wandering should always pay better than standing in one grass patch.

## Core loop

```
walk -> see something new -> investigate / catch / talk / skip
  ^                                                         |
  |                                                         v
wander further <- gold + XP + item drops + bestiary +- done
```

Zero required edges. Every branch is optional.

## Core systems

### World generation

The world is a grid of chunks. **There are no fixed landmark chunks.** Every chunk is generated from the grammar, including the first. The seven v1 maps shaped the grammar's biomes, villages, and landmark patterns; they are now templates, not waypoints.

- **Outdoor chunks** use a **biome archetype** (forest, plain, coast, snowfield, cavern approach, river edge, and transitional variants).
- **Village chunks** use a **village archetype** (small-starter, market-medium, snow-lodged, road-stop, fishing-pier, shrine-settlement). Each archetype has a fixed slot grammar: at minimum a shop, an inn, an elder figure, 3-6 resident houses, one NPC per resident.
- **Indoor chunks** are shops, inns, elder houses, resident houses, cave interiors, shrine interiors. Entered via a door/warp in the parent chunk.
- **Adjacency rules** forbid nonsense transitions (snow → desert in one step). Biomes interpolate via transitional edge chunks (forest→plain uses a "thinning-trees" edge; forest→snow uses a "frost-dusted-forest" edge).
- **Seed names** follow `adjective-adjective-noun` for chunks ("Weathered Bright Moss", "Quiet Stone Reach") and `adjective-noun` for villages ("Quiet Hollow", "Bright Ford"). Every chunk has a name the player can see on the pause-menu map.

**First-chunk constraint (the single forced sequence in generation):**
- The first chunk generated for a fresh save MUST contain a **Guide NPC**.
- The Guide's dialog is a short diegetic tutorial: greets Rivers, hands them their first capture pod + starter creature (random from starter pool), shows them where to find tall grass, then steps aside.
- The first chunk can be any chunk type the generator picks (outdoor clearing, small village, road-stop, cave mouth) — the generator is constrained to emit one that CAN host a Guide NPC. This drops the "every seed starts in the same hand-crafted village" problem while preserving the onboarding beat.
- After the Guide's dialog completes once, the chunk persists as any other. The Guide stays as ambient flavor, becomes a familiar face if the player comes back, and serves as the "home" respawn on party faint before any inn is visited.

**Village density constraint:** The generator guarantees at least one village-type chunk within 3 chunks (Chebyshev distance) of any point on the grid. This prevents the "wander 10 chunks with no shop or inn" failure mode while keeping placement varied.

**Deterministic pre-planting:** Every `(x, y)` on the grid has a deterministic chunk type derivable from `seed + (x, y)` alone, independent of whether the player has visited it. Realization (turning a chunk from "type only" into a fully-placed-NPCs-and-encounters map) happens on first visit; persistence of post-visit deltas happens in SQLite. This makes the rumor system clean — rumors can reference unvisited chunks because they already exist in the deterministic type grid.

**Biome clustering with directional bias:** Each seed assigns a **biome compass** — snowfields cluster toward one direction (e.g. north), deep forests toward another (e.g. east), coastlines toward a third, etc. Within any 3-chunk radius the player sees 2-3 biome types mixed; walking a consistent direction gradually pushes into biome monocultures. The pause-menu world map colors visited chunks by biome so the player can SEE the clustering and make a decision about where to head.

Full spec: `docs/WORLD_GENERATION.md`.

### Forward pulls

Finite story is gone. These replace it as the reason to keep walking:

- **Visual novelty.** Each new chunk looks different. Biome transitions are gradual but visible — "one more screen" pull is the primary engine.
- **Creature novelty.** Biomes have distinct encounter tables. Walking from forest into snowfield changes what the player sees in the tall grass. The bestiary fills naturally as the player moves.
- **Tier bands.** Encounters, gear drops, and NPC dialog lines are all **tier-banded by player level**. A level-5 NPC at the edge of the inn says different things than a level-30 NPC at the same inn; a level-30 encounter at the same grass-patch as a level-5 encounter pulls from a different species roster. Walking far enough or leveling up enough keeps reshuffling the local texture.
- **Rumor system.** Some NPCs drop directional rumors ("I hear there's a tall stone shrine three days east, if the path doesn't shift"). Rumors resolve to real chunks in the player's seed — walking in the hinted direction will find the described thing eventually. Rumors expire after a while if not chased.
- **Landmark silhouettes.** Rare chunk types (shrines, lone towers, lakes, peaks) are visible from 1-2 chunks away on the pause-menu map as unnamed silhouettes, pulling the eye. Visiting resolves the silhouette to a named chunk.
- **Collection milestones.** Every 10 bestiary entries, Rivers's pack gets a small cosmetic/mechanical upgrade (pod slot, inventory slot, walk speed +5%). Smooth dopamine over indefinite time.
- **No time pressure on any of this.** Every pull is passive — the player can ignore every rumor and wander at their own pace and the game doesn't punish them.

### Combat + catching

Unchanged from v1 in shape. Turn-based, type-based, capture-pod-based. Every species catchable. Bestiary tracks what's met.

Rebalanced in scope:
- No badge curve. Wild defeats pay proper XP (already fixed in v1 T8b).
- Level curve is **logarithmic** — `xp_needed(n) = base × log2(n+1) × scale`. Generous early (level 1→5 in ~30 encounters), flat late (level 50→55 in ~200). This is the first lever that prevents mid-game grind.
- Rebalance lands in `src/content/gameplay/progression.json`; no engine work.

### Region scaling (the "no level gate" resolution)

The open world has **soft tiers**, never hard gates. The math:

```
chunk_tier(x, y)      = floor(log2(1 + chebyshev_distance(x, y, starter_chunk)))
party_strength(party) = 0.3 × mean(filled_slots) + 0.7 × max(filled_slots)
encounter_level(c)    = clamp(chunk_tier(c) × 5 + party_strength ± 2, 1, 99)
drop_level(c)         = encounter_level(c) + small_noise
```

The `party_strength` weighting skews toward the lead creature so a player with one level-5 and five empty slots gets calibrated against level-5, not against 0.8 (the raw mean). This prevents the "I have one strong partner and the world thinks I'm weak" failure mode.

Translated:

- **Encounter level tracks BOTH chunk-tier AND player's current party strength.** A far-out chunk is always harder than a close chunk, but not hard in an absolute way — it's hard *relative to the player*. A level-5 party walking 5 chunks out meets level-12 creatures (hard fight, learnable); a level-50 party meets level-57 creatures (same fight, same relative difficulty). The player is never catastrophically out-of-band because the world adjusts to them.
- **Drops track encounter level.** Loot found far out is better than loot found near spawn, in absolute terms. This is the forward pull — walking far is objectively more rewarding than staying close, but every step still feels fair.
- **Upgrade paths are consistent.** A level-10 sword is always ~2× a level-5 sword. A level-50 sword is ~2× a level-45 sword. Log-scaled. This means the player's party-strength-vs-encounter-difficulty ratio stays roughly constant regardless of tier — tier dials "how big are the numbers" without dialing "how hard is the fight."
- **No invisible walls.** A level-5 party CAN walk 20 chunks out. The encounters there will be level-30ish, catchable if lucky, fight-winnable with a well-typed team. The game doesn't refuse — it just becomes a real challenge. A player who wants to push deep can; a player who wants to stay cozy can.

This resolves the "not level-gated vs encounters-scale-with-region" contradiction: there IS a region gradient, but it's a gradient-of-experience, not a gradient-of-permission. Every chunk is reachable; fewer chunks are *trivial*.

### Combinatorial variety (the "finite pool but infinite world" resolution)

Finite dialog + finite templates + finite tilesets, multiplied, gives enough apparent novelty. The multiplication is explicit:

```
chunk_appearance    = biome × tileset_variant × tile_decoration_density × weather_tint
                      (6 × 4 × 3 × 3 = 216 distinct visual permutations before NPC/encounter layer)

chunk_name          = adjective_A × adjective_B × noun
                      (40 × 40 × 60 = 96,000 chunk names; some filtered for nonsense)

village_identity    = archetype × name × shop_inventory × NPC_roster
                      (6 × ~1000 × ~50 × ~100 = millions of village combinations)

NPC_utterance       = role × context × mood × level_band × line_pool
                      (15 × 6 × 4 × 4 × 30-60 = ~50,000 unique contextualized lines)

challenge           = cause × effect × target_species × reward_tier
                      (10 × 8 × 43 × 5 = ~17,000 distinct challenges)
```

The player won't see all these permutations — they'll see a stream of them across a session. The goal: **any two sessions feel materially different.** Not "infinite-distinct" — "non-repeating at session scale." This is the repetition-defense strategy.

The content load is what we actually author:
- Biomes: ~6 archetypes + ~6 transitional edges.
- Village archetypes: 6.
- Role dialog pools: 15 roles × ~50 lines × 4 level bands = **~3000 authored lines**. Seeded by v1's 81 dossier NPCs (~200 existing beats, tag-classified → pool).
- Adjective/adjective/noun pools: 40 + 40 + 60 = 140 words. **Semantically clustered** to avoid nonsense: adjective-A pool is "texture" words (Weathered, Bright, Quiet, Mossy), adjective-B pool is "mood" words (Soft, Hidden, Wandering, Still), noun pool is "place" words (Moss, Reach, Hollow, Ford). Every composition lands on "texture-mood-place" semantics; no "Cold Wet Flame" nonsense.
- Challenge templates: ~10 causes × ~8 effects = 80 base templates, parameterized further by species/region.
- Tileset variants: already in hand (Fan-tasy family + Old Town + Grand Forests + Lonesome Forest + Natural Interior; ~20 tileset files).

Total new content: ~3000 lines + 140 words + 80 templates. Scoped and achievable.

### Economy

Gold is the single currency. One universal reward function:

```
reward(player_level, source_modifier, tier_multiplier) -> { gold, maybe_item }
```

Every source (wild defeat, catch, chest, challenge resolve, rare find) calls this with source-specific modifiers. Log-scaled on player level so rewards always feel meaningful. Item drops roll from a weighted table; the table's bounds shift with encounter level so level-20 parties find level-22 gear and level-50 parties find level-52 gear — same drop flow, different ranges.

Sinks: shops (items, pods, gear), inns (party heal for a fee), future cosmetic unlocks.

Full spec: `docs/ECONOMY.md` (new).

### Optional challenges (née quests)

A **challenge** is a three-beat interaction anchored to one NPC:

1. **Challenge**: NPC states a problem ("I lost my cat in the grass near the pond.")
2. **Response**: Player acts on it (catch a specific species nearby / bring an item / defeat a specific wild).
3. **Resolve**: NPC acknowledges + reward fires from the universal function.

No chain. No flag graph. No progression. Resolve → the NPC's dialog changes once (to a thanks line, then degrades to ambient flavor over time) and that's it. The player can walk away mid-challenge and come back whenever; the NPC holds the challenge indefinitely.

Challenges are **parameterized from a template pool** at generation time. The **cause axis** (what the NPC wants) has ~10 distinct kinds, not 3:

1. **Find-pet**: "I lost my <species> near the <biome_feature>."
2. **Fetch-item**: "Bring me <N> <item> from the <biome_feature>."
3. **Defeat-threat**: "Something mean is lurking near the <biome_feature>. Clear it."
4. **Deliver-message**: "Take this to <named_NPC> at <chunk_name>."
5. **Deliver-item**: "Carry this <item> to <named_NPC> at <chunk_name>."
6. **Settle-dispute**: "<NPC_A> says X, <NPC_B> says Y. Bring me <evidence_item> so I can judge."
7. **Escort**: "Walk with me back to <chunk>. Keep the wildlife off."
8. **Guard-spot**: "Stand here for <time>. Don't let anything past."
9. **Survey**: "Catch <N> different species near the <biome_feature> — I want the count."
10. **Recover-heirloom**: "A rare thing was dropped near the <biome_feature>. Return it for a reward."

Each cause has an **effect** kind (how it resolves) and a **detail** pool (flavor specifics). Authored combinations are ~10 causes × ~8 effect variants = 80 base templates, multiplied by species/item/chunk parameterization to tens of thousands of distinct instances.

```
template:   "I lost my <pet> near the <biome_feature>. Bring it back?"
instance:   "I lost my Applepup near the pond. Bring it back?"
            (pet sampled from species-in-chunk; biome_feature sampled from chunk landmarks)
```

Reward = gold + a roll from the loot table, same function as everything else. Some challenges advertise higher multipliers via flavor ("rare find!", "heirloom!") to pull the player, but none is pivotal to progression.

Full spec: `docs/QUESTS.md` (replaces v1 quest infrastructure).

### NPC dialog pool

Each NPC has a **role** (innkeeper, shopkeep, elder, wanderer, fisher, guard, rival, villager-generic, etc.). Dialog is authored as a **pool** keyed by `(role, context, mood, player_level_band)`. At world-gen time each NPC is given a name (from the `adjective + noun` first-name pool) and a deterministic subset of pool lines. The 81 hand-authored dossier NPCs from v1 become the *seed corpus*: their beats are tagged with role/context/mood/level-band and dropped into the pool.

**Level bands**: 1-10, 11-25, 26-45, 46-99. An innkeeper at level band 1-10 greets Rivers as a beginner; at 46-99 they acknowledge a seasoned trainer. Same NPC, same role, different lines pulled as the player levels up.

Pools must be big enough that two NPCs of the same role in the same village never say the same opening line. "Innkeeper" wants ~50+ lines per level band = ~200+ lines total across bands.

Full spec: `docs/DIALOG_POOL.md` (new).

## Design principles

- **The world is generous.** Nothing is hidden behind a gate the player can't see. If a chunk is visible, it's reachable.
- **Short, purposeful text.** 20-word soft cap per dialog beat. Kid audience; no talking down.
- **Diegetic over didactic.** Signs, NPC lines, landmark placement teach affordances. No tutorials except the Guide's first-chunk onboarding.
- **Mobile-first legibility.** Every interaction works with a tap. Touch targets ≥ 44×44dp. HUD doesn't hide targets.
- **Cohesive art over novel art.** The chosen tilesets (Fan-tasy family + Old Town + Grand Forests + Lonesome Forest + Natural Interior) are the palette. Anything outside is excluded.
- **Fair combat.** HP, damage, effectiveness, capture chance, defeat all communicated clearly. No hidden mechanics.
- **Cozy dark-fantasy tone.** Skellies, goblins, wraiths — but never grim. Defeats are faints, not deaths.
- **Kindness is not a reward mechanic.** NPCs are kind because the world is kind. Player doesn't earn kindness.
- **Determinism per seed.** Same seed + same player actions = same world. No hidden RNG that makes two players' same-seed experiences diverge.

## V2 success criteria

1. **Walk for an hour without repeating yourself.** A new seed gives an hour of novel chunks before visual fatigue.
2. **Villages feel lived-in.** Each generated village has a shop, an inn, ≥4 NPCs, named buildings, and at least one challenge available.
3. **Combat stays fun at level 5, 25, and 50.** Same loop, same legibility, different numbers.
4. **Save/resume round-trips.** Chunk deltas persist and reload.
5. **One seed, reproducible.** Same seed = same world layout. Swap seeds to get a new world.
6. **Mobile comfort.** iPhone Safari + Android debug APK both run end-to-end on a real device.
7. **No softlocks.** No way to get stuck. If the party faints, wake in the last inn / Guide chunk, small gold tax.
8. **Docs match reality.** Every doc's frontmatter `updated` date matches its contents.

## What gets kept from v1

- Catching mechanic (server.ts encounter path, capture-pod math, animation loop).
- Combat engine (turn-based, type matchups, status effects, wild-battle-view UI).
- Party system (up to six, rotate in menu, XP, level, moves).
- The **grammar extracted from** the seven hand-crafted maps (biome shape, village layout, landmark placement, encounter density).
- The **dialog beats extracted from** the 49 dossier NPCs (tagged with role/context/mood/level-band, dropped into the pool). Personal-name dossiers become role-archetype dialog.
- The 43 species (unchanged).
- RPG.js v5 engine + Capacitor wrap.
- Persistence layer (`src/platform/persistence/*`, extended with chunk-delta storage).
- Release pipeline (`ci.yml → release.yml → cd.yml`).
- The existing art bench (tilesets, sprites, FX, pending packs — all usable as-is).

## What gets retired from v1

- `docs/STORY.md` and `docs/STORY_BEATS.md` — archived.
- The seven hand-crafted maps as playable content — their grammar is extracted and the `.tmx`/`.tmj`/spec artifacts are archived as reference implementations of the generator's targets.
- The 15 quests in `src/content/gameplay/quests.json` — retired. Content becomes challenge-template seed material.
- All `badge_*` flags — retired. No area gating.
- `proofs_all_four`, `green_dragon_defeated`, `game_cleared` flags — retired. No finite ending.
- `src/modules/main/green-dragon.ts` endgame event — retired. Green dragon becomes a rare high-tier encounter somewhere in the far chunks.
- `src/modules/main/new-game-plus.ts` — retired. Infinite world doesn't need NG+.
- `src/modules/main/rematch.ts` — retired. Trainers don't gate anything.
- Journey beat progression (`src/content/spine/journey.json`) — retired.
- Personal-name NPC dossiers (Selby, Rook, Marin, etc.) as canon cast — they become dialog-pool seed material. If the Guide NPC's personality is loosely Selby-like that's by extraction, not by character persistence.
- `docs/LAUNCH_READINESS.md` checklist v1 items referencing credits, dragon, badges — rewritten for v2 criteria.

## What needs to be built

- **World generator** — chunk grid, biome archetypes, village archetypes, transitional-edge biomes, adjacency rules, first-chunk Guide constraint. Spec: `docs/WORLD_GENERATION.md`.
- **Chunk persistence** — SQLite chunk-delta store. Save chunks only when the player modifies them (NPC moved, chest opened, challenge resolved, etc.).
- **Universal reward function** — one function, every source. Spec: `docs/ECONOMY.md` (new).
- **Dialog pool infrastructure** — role × context × mood × level-band lookup, deterministic-per-NPC subset. Authoring tool to extract v1 beats into tagged pool. Spec: `docs/DIALOG_POOL.md` (new).
- **Challenge template system** — parameterized challenge generator per NPC/region. Spec: `docs/QUESTS.md` (replaces v1 quest infrastructure).
- **Seed-name generator** — `adjective-adjective-noun` pools for chunks and villages, with filter for nonsense combinations. Spec: sub-section of `WORLD_GENERATION.md`.
- **Tier-band scaling tables** — the encounter-level, drop-level, XP-curve tables wired to region-distance and player-level. Spec: sub-section of `docs/ECONOMY.md`.
- **Rumor system** — NPC rumor-line pool + directional resolver that maps a rumor to a chunk in the player's seed.
- **Pause-menu world map** — renders visited chunks, shows named chunks, silhouettes nearby unvisited rare chunks, colors chunks by biome so the player can see the directional biome clustering.

## Decisions

Based on the pivot discussion:

1. **Player character**: Rivers stays as the player's name by default, but "Rivers" is the world's role-name for the player rather than a fixed biography. No Elder Selby, no specific birthplace. The Guide NPC in the first chunk fills the role that Selby filled in v1.
2. **Starter**: Random starter from a small pool (Ashcat / Mireling / Bramble Imp retained from v1 as the three archetypal starters). Guide picks one for Rivers based on seed.
3. **Death / faint penalty**: Full-party faint → wake at the last-visited inn OR the first-chunk Guide if no inn visited yet. 10% gold tax, no bestiary or party loss. Cozy tone preserved.
4. **Green dragon**: Rare high-tier encounter in the far chunks (tier 8+). Catchable, legendary-odds, same rules as any rare. No dedicated defeat animation in v2 — the dragon is a creature, not a cutscene. (Archive the defeat-animation asset for possible post-v2 reuse.)
5. **Day/night cycle**: Post-v2. Noted here so the "weather_tint" variable in the chunk-appearance formula has a future home.
6. **Villages — hand-authored vs generated**: All generated. The three v1 villages are template/grammar sources, not playable content. Their `.tmx`/`.tmj` artifacts are archived as reference implementations.

## What happens to the current codebase

The v1 game was at `v0.40.1` on `main` when the pivot started. **v2 is an in-place refactor** — each phase deletes v1 code and adds v2 code on `main`. The game may not boot cleanly during the refactor (Phase 1-2 especially), which is expected. `v1.0.0-final` tag preserves the last v1 runtime snapshot as a historical reference only, not a deploy target.

Work sequencing lives in `docs/ROADMAP.md` and `docs/plans/rivers-reckoning-v2.prq.md`.
