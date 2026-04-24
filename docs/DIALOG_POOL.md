---
title: Dialog Pool
updated: 2026-04-24
status: draft
domain: technical
---

# Dialog Pool

Infrastructure for v2's infinite-world NPC dialog. Every generated NPC draws their lines from a shared authored pool keyed by `role × context × mood × level_band`. Pairs with `docs/WORLD_GENERATION.md` (which realizes NPCs into chunks) and `docs/QUESTS.md` (which composes challenge dialog from the same pool).

## Problem

In v1 we authored ~200 dialog beats for 81 specific NPCs (Selby, Rook, Marin, etc.). Those NPCs, their names, their exact beats — all retired in v2 because the world is procedural. We need a system that:

1. Generates thousands of NPCs across a seed's worldspace, each with distinct, role-appropriate dialog.
2. Lets two NPCs of the same role in the same village say different things.
3. Shifts dialog as the player levels up ("you're a beginner" vs "you're a seasoned trainer").
4. Reuses v1's 200 hand-authored beats as seed corpus rather than discarding them.
5. Is authored once (~3000 lines) and scales to any seed.

## Schema

```typescript
type DialogLine = {
  id: string;              // stable line id, authoring-unique
  role: Role;              // 1 of ~15 NPC roles
  context: Context;        // what kind of interaction this line fits
  mood: Mood;              // emotional tone
  level_band: LevelBand;   // which player-level range this line fits (0-3)
  text: string;            // ≤20 words, kid-audience, English
  tags?: string[];         // optional fine-grained filters (biome, weather, etc.)
  seed_from?: string;      // v1 origin tag if extracted from a dossier NPC
}
```

### Roles (15)

| ID | Archetype | Examples |
|---|---|---|
| `guide` | The starter mentor at chunk (0,0) | v1 Elder Selby's beats reseed here |
| `shopkeep` | Sells items, transactional + chatty | v1 Shopkeep beats reseed |
| `innkeep` | Heals the party, hospitality vibe | new authoring; v1 had no dedicated inns |
| `elder` | Old villager with lore tidbits | v1 Stoneminder, frost_uncle reseed |
| `fisher` | Coastal/river NPC, water-related lines | v1 Kala-Lili/Kala-Suli, angler reseed |
| `guard` | Village-edge NPC, cautionary lines | v1 Tarrin, Cliff combat lines reseed |
| `wanderer` | Non-village traveler, rumor-dropper | v1 Loren cross-region seed |
| `farmer` | Grassland villager, practical | v1 Fig, Oren reseed |
| `hunter` | Forest villager, creature knowledge | v1 Pack, Briar reseed |
| `trainer` | Rival-adjacent; offers optional battle | v1 Rook beats reseed (rival archetype) |
| `rival` | Recurring challenger NPC archetype | v1 Rook reseeds here too |
| `child` | Younger villager, playful | v1 cave_kid, snow_kid, shrine_kid |
| `villager_generic` | Catch-all for residents | broad; fills unassigned village slots |
| `shrine_keeper` | Shrine-settlement elder, cryptic | v1 warden_ghost, shrine figures |
| `historian` | Occasional landmark NPC, long-view | new authoring |

### Contexts (6)

| ID | Meaning |
|---|---|
| `greeting` | Initial hello, no prior interaction this session |
| `ambient` | Repeat visit, background flavor |
| `rumor` | Directional hint about another chunk |
| `challenge_offer` | Opens an optional challenge |
| `challenge_thanks` | Post-resolve thank-you |
| `idle_after_resolve` | Long-after-resolve ambient |

### Moods (4)

| ID | Tone |
|---|---|
| `calm` | Steady, neutral |
| `warm` | Friendly, inviting |
| `weary` | Tired, thoughtful, bittersweet |
| `curious` | Questioning, intrigued |

Not "happy/sad/angry" — avoid volatility. Cozy dark-fantasy.

### Level bands (4)

| Band | Player level range | NPC recognition |
|---|---|---|
| 0 | 1-10 | Rivers is new; NPCs treat them as a beginner |
| 1 | 11-25 | Rivers is proven; NPCs acknowledge some progress |
| 2 | 26-45 | Rivers is seasoned; NPCs treat as peer |
| 3 | 46-99 | Rivers is veteran; NPCs defer to their experience |

## Pool size target

~3000 lines total:
- 15 roles × 4 bands × ~50 lines per role-band = **3000 base**

Not every role needs every band populated equally. The `guide` role has heavy band-0 lines (tutorial) and sparse band-3. `rival` has balanced 0-3. `shrine_keeper` has dense band-2/3. Actual distribution is ~3000, weighted by role.

### Distribution of 3000 across roles

| Role | Band 0 | Band 1 | Band 2 | Band 3 | Total |
|---|---|---|---|---|---|
| guide | 40 | 20 | 15 | 10 | 85 |
| shopkeep | 50 | 50 | 50 | 50 | 200 |
| innkeep | 50 | 50 | 50 | 50 | 200 |
| elder | 40 | 50 | 60 | 60 | 210 |
| fisher | 40 | 50 | 50 | 40 | 180 |
| guard | 40 | 50 | 50 | 40 | 180 |
| wanderer | 60 | 70 | 70 | 60 | 260 |
| farmer | 40 | 40 | 40 | 30 | 150 |
| hunter | 40 | 50 | 50 | 40 | 180 |
| trainer | 40 | 50 | 60 | 60 | 210 |
| rival | 30 | 40 | 50 | 50 | 170 |
| child | 40 | 40 | 30 | 20 | 130 |
| villager_generic | 60 | 60 | 60 | 60 | 240 |
| shrine_keeper | 30 | 40 | 50 | 60 | 180 |
| historian | 30 | 40 | 60 | 80 | 210 |
| **Total** | **670** | **750** | **815** | **760** | **2995** |

Close enough to the 3000 target. Variance allowed — authoring can flex within ±10%.

## Authoring format

Pool lines live in `src/content/dialog_pool/` as one JSON file per role:

```
src/content/dialog_pool/
  guide.json
  shopkeep.json
  innkeep.json
  elder.json
  fisher.json
  ... (15 files)
```

### File schema

```json
{
  "role": "shopkeep",
  "lines": [
    {
      "id": "shopkeep_greeting_warm_band0_001",
      "context": "greeting",
      "mood": "warm",
      "level_band": 0,
      "text": "New face! Come in, I don't bite. Take a look around.",
      "tags": []
    },
    {
      "id": "shopkeep_greeting_calm_band0_002",
      "context": "greeting",
      "mood": "calm",
      "level_band": 0,
      "text": "Welcome. What are you after?",
      "tags": []
    },
    ...
  ]
}
```

### ID convention

`{role}_{context}_{mood}_band{n}_{seq}` where `seq` is a zero-padded index. Gives us stable IDs for debugging and test fixtures without requiring a UUID tool.

### Authoring rules (enforced by tests)

- **≤ 20 words per line** (kid audience constraint from DESIGN).
- **No franchise references.**
- **No mention of specific NPC names** (Rivers is the only proper noun allowed, referring to the player).
- **No mention of badges, proofs, dragons, finite beats** — retired v1 concepts.
- **No questions that expect a response** unless `context` is `challenge_offer` (where the UI provides accept/decline).
- **Tone check**: no `!` except diegetic shouting; no condescension; no sugar.

Validated at build-time by `tests/build-time/dialog-pool-lint.test.ts` (v2).

## NPC → pool mapping (realization)

When the world-generator realizes an NPC at `(seed, chunk, spawn_index)`, the dialog pool assigns lines:

```typescript
function assignNpcDialog(
  seed: number,
  chunk_xy: [number, number],
  spawn_index: number,
  role: Role,
): NpcDialogProfile {
  const npc_seed = hashCombine(seed, chunk_xy, spawn_index);

  // Per role, pick a deterministic subset of lines from each band
  const profile: NpcDialogProfile = {
    npc_seed,
    role,
    greetings: pickN(pool[role]["greeting"], 3, npc_seed, /*salt:*/ 1),
    ambients:  pickN(pool[role]["ambient"],  5, npc_seed, /*salt:*/ 2),
    rumors:    pickN(pool[role]["rumor"],    2, npc_seed, /*salt:*/ 3),
    challenge_offers:  pickN(pool[role]["challenge_offer"],  2, npc_seed, 4),
    challenge_thanks:  pickN(pool[role]["challenge_thanks"], 2, npc_seed, 5),
    idle_after_resolve: pickN(pool[role]["idle_after_resolve"], 3, npc_seed, 6),
  };
  return profile;
}

function pickN<T>(pool: T[], n: number, seed: number, salt: number): T[] {
  const rng = createRng(seed ^ salt);
  return shuffledCopy(pool, rng).slice(0, n);
}
```

**Each NPC stores a tiny "dialog profile"** — 3 greetings, 5 ambients, 2 rumors, 2 offers, 2 thanks, 3 idles — ~17 line references, not the lines themselves.

At runtime, the UI:
1. Reads the NPC's profile.
2. Filters profile lines by current `level_band` (player_level → band).
3. Picks one greeting (first visit this session) or one ambient (repeat).
4. Renders the text via the rr-ui bridge.

### Level-band shift

`level_band` is computed on the player's level at interaction time. As Rivers levels up, the same NPC starts pulling from higher-band lines in their profile.

If a profile has no lines in the current band (e.g. band 3 line pool is thin for a `child` role), fall back to band 2, then band 1. Never fall upward (never show a band-0 line to a level-50 player).

### Determinism

Given `(seed, chunk, spawn_index)`, the NPC's profile is a pure function. Two players with the same seed meet the same NPC saying the same lines.

## Rumor system

Special `rumor` context lines encode a directional hint:

```json
{
  "id": "wanderer_rumor_warm_band1_005",
  "context": "rumor",
  "mood": "warm",
  "level_band": 1,
  "text": "Heard tell of a tall stone in {direction}, a day or two out.",
  "tags": ["landmark_hint"]
}
```

The `{direction}` token resolves at runtime to a compass word ("north", "west", "eastward"). The world-gen's rumor-resolver picks an unvisited landmark chunk within 3-5 chunks of the player in a matching direction and fills the token.

Rumors persist in the player's rumor journal (see DESIGN.md forward-pulls) with direction + estimated distance. Expires after ~30 in-game days if not chased; can be replaced by a new rumor from another NPC.

Full rumor mechanics spec: `docs/WORLD_GENERATION.md § Forward pulls` + a future `docs/RUMORS.md` for implementation detail. For v2.0 the rumor pool is ~60 lines total (split across wanderer, historian, elder roles).

## Challenge dialog

Challenge-related lines (`challenge_offer`, `challenge_thanks`, `idle_after_resolve`) pair with template-parameterized challenge data. See `docs/QUESTS.md` for how cause/effect templates slot into these lines.

```json
{
  "id": "farmer_challenge_offer_calm_band0_003",
  "context": "challenge_offer",
  "mood": "calm",
  "level_band": 0,
  "text": "I lost my {pet} near the {biome_feature}. Bring it back?"
}
```

`{pet}` and `{biome_feature}` are template tokens resolved by the challenge system at realization time.

## Name generator

Separate from dialog pool but shares the authoring surface.

```
src/content/names/
  adjective_first.json    # 60 warm/neutral adjectives (Bright, Quiet, Soft, Still)
  noun_first.json         # 80 first-name-like nouns (Pine, Wren, Ash, Clay, Fen)
```

NPC names are `{adjective_first} {noun_first}` — e.g. "Bright Wren", "Quiet Pine", "Soft Ash". Two words, no last names.

Semantic clustering:
- `guard` / `trainer` / `rival` NPCs favor sturdy adjectives (Steady, Firm, Solid).
- `child` NPCs favor light adjectives (Bright, Quick, Laughing).
- `elder` / `historian` / `shrine_keeper` favor weighty adjectives (Faded, Weathered, Ancient).
- `innkeep` / `farmer` / `villager_generic` favor warm adjectives (Warm, Kind, Gentle).

Pool subsets per role defined in the role's config. Shared name-pool file, per-role filter.

Collision avoidance: hash `(seed, chunk, spawn_index)` → deterministic draw. Collisions within the same village are re-rolled deterministically (salt += 1) until unique within village.

## v1 extraction plan

The 200-ish hand-authored beats from v1's 81 dossier NPCs are seed corpus, not waste.

### Extraction process (tooling + manual review)

**T139 in PRD** covers this. Summary:

1. **Scan** `src/content/regions/*/npcs/*.json` (archived).
2. **Parse** each NPC's `dialog_states[].beats[]`.
3. **Classify** each beat by best-fit `(role, context, mood, level_band)`. Use the NPC's `role:` field in v1 dossier as a hint for `role`. Use the beat's `when` flags to infer `level_band` (pre-gate = band 0, post-first-gym = band 1, etc.). Use the beat's `mood` field directly.
4. **Strip v1-specific references**: delete beats mentioning badges, specific names (Rook, Selby, etc.), specific flags (game_cleared, proofs_all_four). Rewrite generic-able beats; drop the rest.
5. **Rewrite player-specific callbacks**: "You've made it past the village" (Rook-specific) → "You've come a long way" (generic, band 1).
6. **Tag** with `seed_from: "v1/<original_npc_id>"` for provenance.
7. **Dump** into the appropriate `src/content/dialog_pool/<role>.json` file.

Expected yield: ~150 usable lines from 200 original. Some beats are too context-specific to reuse (e.g. "the four polished stones at the shrine" — pure v1 dragon-mystery content).

Extraction is a one-shot tool + manual-review pass. Not a recurring process.

### Author sub-tasks

Per PRD T140 — authoring the remaining ~2850 lines — split into per-role sub-tasks:

| Role | Lines to author (new) | Seed lines from v1 | Target total |
|---|---|---|---|
| guide | 70 | 15 | 85 |
| shopkeep | 180 | 20 | 200 |
| innkeep | 200 | 0 | 200 |
| elder | 180 | 30 | 210 |
| fisher | 160 | 20 | 180 |
| guard | 170 | 10 | 180 |
| wanderer | 250 | 10 | 260 |
| farmer | 140 | 10 | 150 |
| hunter | 170 | 10 | 180 |
| trainer | 190 | 20 | 210 |
| rival | 165 | 5 | 170 |
| child | 120 | 10 | 130 |
| villager_generic | 230 | 10 | 240 |
| shrine_keeper | 175 | 5 | 180 |
| historian | 210 | 0 | 210 |
| **Total** | **2810** | **185** | **2995** |

Sub-tasks spawn one content-author agent per role (batchable; see PRD T140).

## Runtime integration

### Module: `src/modules/dialog-pool.ts`

```typescript
export function loadDialogPool(): DialogPool;
export function assignNpcDialog(args: NpcDialogArgs): NpcDialogProfile;
export function pickLine(
  profile: NpcDialogProfile,
  context: Context,
  player_level: number,
): DialogLine;
export function resolveRumorTokens(line: DialogLine, resolver: RumorResolver): string;
export function resolveChallengeTokens(line: DialogLine, challenge: ChallengeInstance): string;
```

`loadDialogPool()` eagerly loads all 15 files at boot. ~3000 lines × ~80 bytes each = ~240 KB; no concern on mobile.

### UI bridge

`playDialog(player, npc_id)` (v2 reshape) calls:

1. Lookup NPC's dialog profile.
2. Call `pickLine(profile, "greeting"|"ambient"|etc., player.level)`.
3. If line has tokens, resolve them via context (rumor resolver / challenge instance).
4. Show via existing rr-ui bridge with NPC's name as speaker.

Existing `src/modules/main/dialog.ts` retired in Phase 9 cleanup; replaced by `src/modules/dialog.ts`.

## Validation

### Build-time tests

- **Pool size coverage**: every (role, context, level_band) triple has ≥ 5 lines. Prevents profiles with empty slots.
- **Length lint**: no line exceeds 20 words.
- **Forbidden-content lint**: no line contains banned tokens (badge, dragon, proofs, Selby/Rook/Marin/etc.).
- **Token coherence**: every `{token}` in a line matches a known resolver name.
- **Seed determinism**: `assignNpcDialog(seed, chunk, idx)` called twice returns identical profiles.
- **Name non-collision**: in a sample of 100 seeds × 10 villages each, no duplicate NPC names within a village.

### Integration tests

- **Greeting on first visit**: NPC first-talked-to surfaces one of their 3 greeting lines, filtered by current level band.
- **Ambient on revisit**: second visit surfaces one of their 5 ambient lines.
- **Level-band shift**: same NPC at level 5 vs level 30 surfaces lines from different bands.
- **Rumor resolution**: rumor line with `{direction}` resolves to a compass word matching an unvisited chunk.

## What this replaces from v1

- `src/content/regions/*/npcs/*.json` — retired (contents extracted to pool).
- `src/content/spine/dialog/*.json` — retired.
- `src/modules/main/dialog.ts` selector — retired (replaced by pool-based `pickLine`).
- Personal NPC dossiers — retired. Personality becomes role + deterministic profile.

## Related specs

- `docs/DESIGN.md` — ≤20-word rule, tone rules, level-banding motivation.
- `docs/WORLD_GENERATION.md` — NPC realization, name generation, rumor resolver.
- `docs/QUESTS.md` — challenge-offer/thanks/idle contexts and token resolution.
- `docs/ECONOMY.md` — shop/inn roles call into shopkeep/innkeep pools.
