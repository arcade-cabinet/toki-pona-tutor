---
title: World Generation
updated: 2026-04-24
status: draft
domain: technical
---

# World Generation

The v2 world is a deterministic, seeded, infinite grid of chunks. This doc is the contract for how chunks are chosen, generated, adjoined, named, and placed. It pairs with `docs/DESIGN.md` (what the player experiences) and `docs/ECONOMY.md` (how tier-scaling drives encounter and loot levels).

## Invariants

1. **Determinism.** `(seed, x, y) → chunk_type` is a pure function. No hidden RNG anywhere in world-gen. Same seed + same coordinates = same chunk forever.
2. **Pre-planted grid.** Every integer coordinate has a chunk type even before the player visits it. Realization (placing NPCs, encounters, objects) is on first-visit; type is always known.
3. **Persistence.** Post-visit deltas (NPC moved, chest opened, challenge resolved) persist in SQLite keyed by `(seed, x, y)`. Revisit re-realizes from seed and applies deltas.
4. **No fixed landmarks.** There are no hand-placed chunks on the grid. The seven v1 maps inform the grammar but are not stamped at fixed positions.
5. **Reachability.** Every chunk is walkable-into from its neighbors. No chunk is an island.

## Grid geometry

- **Chunk = one rendered map.** Dimensions are fixed per chunk type but vary across types.
- **Outdoor chunks**: 32 × 24 tiles (typical v1 outdoor map was 16-32 × 12-20; 32×24 is the spacious upper bound for mobile).
- **Village chunks**: 28 × 20 tiles. Dense but not cramped.
- **Indoor chunks**: 16 × 12 tiles. Single-room or two-room interiors.
- **Tile size**: 16 × 16 px (v1 standard, unchanged).
- **Coordinates**: `(x, y)` integer. `(0, 0)` is the starter chunk for a fresh save. No negative-coordinate special-case.
- **Traversal between chunks**: edge warps. Each chunk has 0-4 edge warps (N/S/E/W) depending on its neighbors. Adjacency rules determine which edges are walkable.

## Chunk types

```
ChunkType :=
  | Outdoor(biome: BiomeArchetype)
  | Village(archetype: VillageArchetype)
  | Indoor(archetype: IndoorArchetype)
  | Landmark(kind: LandmarkKind)
```

### Biome archetypes (outdoor)

| ID | Description | Encounter flavor |
|---|---|---|
| `grassland` | Open grass with scattered groves, rolling terrain | small-mammal + grass-type |
| `forest` | Dense tree cover, shaded paths, ferns | grass-type + insect + canopy-bird |
| `coast` | Sand edge, tidal rocks, water at one edge | water-type + bird |
| `snowfield` | Exposed snow, sparse pines, frozen ponds | frost-type + snow-bird |
| `cavern_approach` | Rocky outcrops, sparse grass, cave mouth | stone-type + bat + wraith |
| `river_edge` | Running water, reeds, flat floodplain | water-type + amphibian |

### Transitional edges (outdoor)

Chosen when two incompatible biomes would otherwise be adjacent. Chebyshev-1 neighbors must differ by at most one "step" on the transition graph.

| ID | Between | Look |
|---|---|---|
| `thinning_forest` | forest ↔ grassland | sparse trees, tall grass patches |
| `frost_forest` | forest ↔ snowfield | trees with snow caps, dusted ground |
| `stony_grassland` | grassland ↔ cavern_approach | boulders, thinning grass |
| `marsh` | grassland ↔ river_edge / coast | reeds, puddles, muddy paths |
| `tundra` | snowfield ↔ grassland | dead grass under light snow |
| `dry_coast` | coast ↔ grassland | sea grass, driftwood, dry sand |

### Village archetypes

| ID | Size | Slots (min) | Vibe |
|---|---|---|---|
| `small_hamlet` | 28×20 | shop, inn, elder, 3 residents | starter-scale, Riverside Home-style |
| `market_town` | 28×20 | shop×2, inn, elder, stall×2, 5 residents | Lakehaven-style, trade-focused |
| `snow_lodge` | 28×20 | shop, inn (bigger), elder, 4 residents, wood pile | Frostvale-style, cold-weather |
| `road_stop` | 28×20 | inn, 2 residents, signpost | rest-between-chunks |
| `fishing_pier` | 28×20 | shop (supplies), inn, elder, 3 residents, pier+boats | coast-adjacent, water focus |
| `shrine_settlement` | 28×20 | shrine (central), elder, 4 residents, no shop | Highridge-style, cloistered |

Every village has: a **center** (plaza/well/shrine), a **main path** running E-W or N-S, a **perimeter fence/edge**, and **buildings with doors that warp to Indoor chunks**.

### Indoor archetypes

| ID | Size | Purpose |
|---|---|---|
| `shop_interior` | 16×12 | counter + inventory display + shopkeep |
| `inn_interior` | 16×12 | counter + beds + innkeeper |
| `elder_house` | 16×12 | hearth + chairs + elder |
| `resident_house` | 16×12 | bed + table + resident villager |
| `cave_interior` | 16×12 | torch + stone + treasure (chest+) |
| `shrine_interior` | 16×12 | altar + candles + silent figure |

### Landmark kinds

Rare outdoor chunks that serve as directional pulls. 1 per ~16×16 sub-grid (so they're findable but not common).

| ID | Visual | Contents |
|---|---|---|
| `stone_shrine` | Tall carved stones in a clearing | chest(rare), NPC(elder) |
| `lone_tower` | Single tower on a hill | chest(rare), silhouette visible from 2 chunks away |
| `lake` | Full-chunk open water + shore | rare-species encounter, no NPC |
| `peak_overlook` | Cliff edge with long sightline | signpost with seed-name, chest(rare) |
| `ruined_village` | Wrecked buildings, no NPCs | chests, rare-species |

## Deterministic chunk-type assignment

The function `chunkType(seed, x, y) -> ChunkType` is pure and determines the type before realization.

### Algorithm

```
chunkType(seed, x, y):
  # 1. Starter chunk is always Guide-hostable
  if (x, y) == (0, 0):
    return Outdoor(grassland)  # (Guide chunk is always grassland clearing)

  # 2. Deterministic biome roll per seed
  biome = sampleBiome(seed, x, y)

  # 3. Village-density constraint
  if needsVillage(seed, x, y):
    return Village(sampleVillageArchetype(seed, x, y, biome))

  # 4. Landmark constraint (rare)
  if isLandmarkCell(seed, x, y):
    return Landmark(sampleLandmarkKind(seed, x, y, biome))

  # 5. Transitional edge if neighbors clash
  if neighborsIncompatible(seed, x, y, biome):
    return Outdoor(pickEdgeBiome(biome, neighborBiomes))

  # 6. Default: outdoor biome
  return Outdoor(biome)
```

### Biome compass (directional bias)

Each seed assigns a **biome compass** — a vector per biome that biases its frequency by direction from `(0, 0)`.

```
biomeCompass(seed) -> Map<BiomeArchetype, Vec2>
  # Per seed, each biome gets a unit vector. Angle derived from seeded PRNG.
  # Biomes on "opposite sides" from each other are pushed apart by 120°-180°
  # Example: seed A → snowfield (0, 1), coast (-0.7, -0.7), forest (0.7, -0.7), ...
```

`sampleBiome(seed, x, y)` computes per-biome weight = `base_weight × dot((x, y).normalized, compass[biome])` clamped to `[0, 1]`. Pick by weighted draw.

This gives the player directional pull: walking north is more snow-likely, walking east is more forest-likely. But it's never absolute — there's always biome mixing within ~3 chunks.

### Village density constraint

Guarantee: for every `(x, y)`, there exists a village chunk within Chebyshev distance ≤3.

Implementation: `needsVillage(seed, x, y)` returns `true` when a seeded rolling check finds no village in the 7×7 neighborhood centered at `(x, y)` AND this cell wins a density-tiebreak among the vacant cells in that neighborhood.

Validated at build-time by a random-coordinate sweep test (T120).

### Landmark cell selection

`isLandmarkCell(seed, x, y)`: returns `true` for ~1 in every 256 cells (= ~1 per 16×16 sub-grid), placed deterministically by seed + coordinate hash. Landmark kind picked from the compatible set for the local biome.

### Neighbor incompatibility check

```
neighborBiomesOf(seed, x, y):
  return [chunkType(seed, x+dx, y+dy) for (dx, dy) in [(-1,0), (1,0), (0,-1), (0,1)]]
```

Wait — this is a recursion problem. `chunkType` calls `neighborsIncompatible` which calls `chunkType` on neighbors. Resolution: neighbor-check uses the **base biome** (step 2), NOT the final chunk type. Base biome doesn't depend on neighbors, so no recursion.

```
baseBiome(seed, x, y) = sampleBiome(seed, x, y)   # no neighbor dependency
chunkType(seed, x, y):
  ...
  if biomeDistance(baseBiome(x,y), baseBiome(neighbor)) > 1:
    return Outdoor(edgeFor(baseBiome(x,y), baseBiome(neighbor)))
  ...
```

### Biome distance metric

```
biomeDistance(a, b):
  # Graph distance on compatibility graph:
  #   grassland -- forest -- frost_forest -- snowfield
  #   grassland -- stony_grassland -- cavern_approach
  #   grassland -- marsh -- river_edge -- dry_coast -- coast
  #   grassland -- tundra -- snowfield
```

Distance > 1 triggers an edge biome. Distance > 2 means the assignment is buggy (should never happen given the compass is pushing biomes apart consistently).

## First-chunk Guide constraint

On a **fresh save** (no persisted chunks yet), chunk `(0, 0)` is forced to `Outdoor(grassland)` (always Guide-hostable). The realization step plants a **Guide NPC** at a known spawn, plus a single capture pod item drop, plus the starter creature ceremony trigger.

```
realizeChunk(seed, x, y, is_fresh_save):
  type = chunkType(seed, x, y)
  chunk = emitBaseChunk(seed, x, y, type)
  if (x, y) == (0, 0) and is_fresh_save:
    chunk.addNpc(guide_npc_spawn_at(16, 12), role="guide", dialog_id="guide_tutorial")
    chunk.addSign(15, 13, "The Guide waits by the path.")
  return chunk
```

The Guide dialog fires a **starter ceremony** (similar to v1 Selby's role): pick random starter from pool, hand Rivers 3 capture pods, trigger a brief tutorial sequence, then step aside. After ceremony completion the Guide becomes an ambient NPC with role-pool dialog.

Respawn-after-faint with no inn visited defaults to `(0, 0)` Guide chunk at Guide-adjacent spawn.

## Seed-name generator

Every chunk has a name composed deterministically from the seed + coordinates.

### Pools

- **adjective-A (texture)**: Weathered, Bright, Quiet, Mossy, Rough, Smooth, Faded, Shining, Deep, Pale, Lonely, Winding, Narrow, Wide, Windy, Still, Stormy, Silver, Golden, Shadow, Sunlit, Moonlit, Dappled, Frosted, Carved, Soft, Hard, Warm, Cool, Wild, Hollow, Sacred, Plain, Remote, Hidden, Forgotten, Remembered, Ancient, Fresh, Rolling (40 words)
- **adjective-B (mood)**: Soft, Hidden, Wandering, Still, Sleeping, Watching, Calling, Remembering, Patient, Listening, Singing, Whispering, Weeping, Laughing, Dreaming, Waiting, Drifting, Falling, Rising, Breathing, Seeking, Finding, Yearning, Hushed, Gentle, Fierce, Tender, Kind, Brave, Honest, Proud, Tired, Rested, Glad, Humble, Steady, Restless, Easy, Sudden, Slow (40 words)
- **noun (place)**: Moss, Reach, Hollow, Ford, Vale, Bluff, Ridge, Stone, Pine, Oak, Birch, Willow, Thicket, Meadow, Glade, Dell, Hollow, Marsh, Fen, Copse, Grove, Spring, Brook, Ferry, Crossing, Knoll, Rise, Fall, Bend, Loop, Edge, Shore, Tide, Cove, Bay, Reach, Bend, Bight, Hill, Dale, Hollow, Heath, Moor, Fell, Pass, Shelf, Scarp, Gully, Ledge, Outlook, Point, Mouth, Watch, Keep, Croft, Field, Pasture, Acre, Patch, Yard (60 words)

### Composition

```
chunkName(seed, x, y):
  a = pick(seed ^ 0xA_A_SALT, x, y, adjective_A_pool)
  b = pick(seed ^ 0xB_B_SALT, x, y, adjective_B_pool)
  n = pick(seed ^ 0xN_N_SALT, x, y, noun_pool)
  return f"{a} {b} {n}"
```

### Semantic coherence

Pools are classed so every composition reads naturally:
- **texture × mood × place** always lands on a poetic-sounding location.
- No "Cold Wet Flame" — "Flame" isn't in the noun pool; "Wet" isn't in adjective-A; "Cold" isn't in adjective-B.

If any composition produces a known-bad pair (e.g. "Stormy Gentle Still"), add to a `forbidden_pairs` exclusion table and re-roll with a deterministic alternate.

### Village name variant

Villages use `adjective-A + noun` (shorter, proper-noun-like): "Quiet Hollow", "Bright Ford", "Still Pine."

## Adjacency rules

Enforced at `realizeChunk` edge-warp placement.

```
canWarpBetween(chunkA, chunkB):
  # Hard rules:
  if chunkA.type == Indoor or chunkB.type == Indoor:
    # Indoor chunks only link via door warps, not edge warps
    return False
  if biomeDistance(chunkA.baseBiome, chunkB.baseBiome) > 1:
    # Should never happen; asserts at dev time
    return False
  # Soft rules (village perimeters):
  if chunkA.type.isVillage and chunkB.type.isVillage:
    # Two adjacent villages is rare but allowed; bridge road between them
    return True
  return True
```

Edge warps are placed on the chunk's 4 edges in realization. If an edge is blocked (e.g. a lake chunk's water edge), no warp is placed there — the player can walk up to the water but can't cross.

Landmarks follow the same rules as their parent biome.

## Chunk realization (first visit)

```
realizeChunk(seed, x, y, is_fresh_save):
  type = chunkType(seed, x, y)
  grid = generateTileGrid(seed, x, y, type)  # from biome/village/indoor archetype
  encounters = generateEncounterZones(seed, x, y, type)
  objects = {
    npcs: sampleNpcsForChunk(seed, x, y, type),
    chests: sampleChestsForChunk(seed, x, y, type),
    signs: sampleSignsForChunk(seed, x, y, type),
    warps: placeEdgeWarps(x, y),
    doors: placeBuildingDoors(type),
  }
  if (x, y) == (0, 0) and is_fresh_save:
    injectGuide(objects)
  return { grid, encounters, objects, name: chunkName(seed, x, y) }
```

The chunk's realization is deterministic per seed — running it twice produces the same output. Persistence stores deltas applied over this base, not the base itself.

## Pause-menu world map

Not part of world-gen proper but closely tied.

- Renders the visited chunks (from SQLite `chunk(seed, x, y)` entries) on a 2D grid.
- Each chunk colored by its biome (grassland=light green, forest=dark green, snow=white, coast=light blue, cavern=grey, river=blue, landmark=gold outline).
- Each chunk labeled with its seed-name on hover/tap.
- Unvisited chunks within 2 Chebyshev distance of any visited chunk shown as **silhouettes** (biome color, no name), pulling the eye.
- Player's current position marked with an X.
- Biome-compass direction indicators on the edges: "More forest ↗, more snow ↑" based on the seed's compass.
- Rumor markers: destinations of active rumors shown as a "?" silhouette with direction arrow.

## Validation and testing

### Build-time tests

- **T120 village-density sweep**: random sample of 10,000 coordinates across 5 seeds; every sample has a village within Chebyshev 3.
- **Biome-compass consistency**: for a seed, sampling many points in one compass direction yields a biome distribution that matches the compass vector within ±5%.
- **Chunk-type determinism**: `chunkType(seed, x, y)` called N times returns the same type.
- **No recursion**: `chunkType` calls are terminating for all sampled `(seed, x, y)`.
- **Edge coherence**: for N random adjacent pairs, `biomeDistance ≤ 1` holds.
- **Seed-name no-nonsense**: N random names, all lint-clean per `forbidden_pairs` table.

### Integration tests

- **Fresh-save Guide spawn**: new seed, chunk `(0, 0)` realized, Guide NPC present at expected spawn with `dialog_id="guide_tutorial"`.
- **Walk across a transition**: player walks forest → frost_forest → snowfield, no hard biome jump.
- **Revisit persistence**: open chest in chunk, walk away, walk back, chest is opened (delta applied).

## What this replaces from v1

- `scripts/map-authoring/specs/*.ts` — retired. Grammar codified here and in `src/modules/world-generator.ts`.
- Hand-placed warps, NPC spawns, sign text — retired. All procedural.
- Fixed map registry in `src/standalone.ts` — retired. Engine asks the world-gen module for chunks by `(seed, x, y)`.

## Open implementation questions

1. **Chunk render cost on mobile.** 32×24 tiles × tileset compositing — is the first-visit render under 300ms on a mid-range Android? If not, consider reducing outdoor chunk size to 24×18.
2. **Tileset variant count.** DESIGN.md targets `6 biomes × 4 tileset variants × 3 densities × 3 tints = 216` visual permutations. Verify we have 4 visual variants per biome in the tileset packs on hand.
3. **Name pool localization.** If we ever localize, pool needs per-language versions. For v2.0 English-only.
4. **Chunk prefetch.** Realize neighbors on entry to hide generation latency. Over-prefetch (all 8 neighbors) or lazy (neighbor on approach)?

## Related specs

- `docs/DESIGN.md` — product/feel constraints this spec serves.
- `docs/ECONOMY.md` — encounter-level and drop-level formulas that consume chunk-tier.
- `docs/DIALOG_POOL.md` — role-keyed dialog pool that NPC realization samples from.
- `docs/QUESTS.md` — challenge template parameterization that runs at NPC realization.
