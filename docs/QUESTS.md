---
title: Challenges (née Quests)
updated: 2026-04-24
status: draft
domain: technical
---

# Challenges

Optional, bite-sized, self-contained NPC tasks. Challenges are the v2 replacement for the v1 quest system — **every structural difference between the two matters.** A v1 quest had a chain, a flag gate, and story weight. A v2 challenge has none of those: it's a three-beat loop anchored to one NPC, paid from the universal reward function, forgotten forever once resolved.

Pairs with `docs/DESIGN.md` (feel + non-pivotal rule), `docs/WORLD_GENERATION.md` (NPC realization), `docs/DIALOG_POOL.md` (challenge dialog contexts), `docs/ECONOMY.md` (reward function + modifiers).

## Structure

A challenge is **three beats, one NPC**:

1. **Offer** — NPC states a problem. Player can accept, decline, or defer.
2. **Response** — Player acts on it (catch a species, deliver an item, defeat a wild, etc.). The runtime silently watches for the condition.
3. **Resolve** — On condition met, the next interaction with the issuing NPC fires the resolve line + universal reward. Challenge is marked resolved in the chunk delta.

No chain. No graph. No progression. Every challenge is standalone.

## Lifecycle states

```
pending       # challenge parameterized for this NPC on chunk realization; not yet offered
offered       # player has seen the offer dialog at least once
accepted      # player accepted; runtime watches for response condition
declined      # player declined; challenge remains pending (can be re-offered)
resolved      # response condition met + reward paid; NPC shifts to thanks+idle dialog
degraded      # long after resolve; NPC returns to ambient-only dialog
```

Transitions:
- `pending` → `offered` — on first interaction with NPC.
- `offered` → `accepted` — player picks "Accept" on the UI prompt.
- `offered` → `declined` — player picks "Decline."
- `declined` → `offered` — next interaction re-offers (idempotent, free to dismiss again).
- `accepted` → `resolved` — response condition detected at some later point.
- `resolved` → `degraded` — after `DEGRADE_DAYS` in-game days have passed since resolve.

Each state persists in the chunk delta for the NPC's coordinate.

## The 10 cause kinds

Each cause defines **what the NPC wants**. Effect kinds (below) define **how the response is detected**. A cause is typically paired with 1-3 valid effect kinds.

### 1. Find-pet
> "I lost my `<species>` near the `<biome_feature>`. Bring it back?"
- **Effect**: player catches `<species>` in the chunk (or an adjacent chunk).
- **Resolve**: player talks to NPC while that species is in the active party.
- **Flavor**: reunited, grateful.

### 2. Fetch-item
> "Bring me `<N>` `<item>` from the `<biome_feature>`."
- **Effect**: player accumulates N of `<item>` in inventory.
- **Resolve**: player talks to NPC; N items consumed from inventory.
- **Flavor**: practical, often grocery-scale.

### 3. Defeat-threat
> "Something mean is lurking near the `<biome_feature>`. Clear it."
- **Effect**: player defeats one specific wild encounter (elite-tagged, encounter_level +5) in the challenge's chunk.
- **Resolve**: player talks to NPC after the flagged wild is defeated.
- **Flavor**: concerned, thankful on resolve.

### 4. Deliver-message
> "Take this to `<named_NPC>` at `<chunk_name>`."
- **Effect**: player accepts a key-flagged "sealed letter" item + walks to the named NPC and interacts.
- **Resolve**: named NPC auto-fires a short "received" line; letter consumed; resolve state propagates back to issuing NPC on next visit.
- **Flavor**: trust, connection between strangers.

### 5. Deliver-item
> "Carry this `<item>` to `<named_NPC>` at `<chunk_name>`."
- **Effect**: same as deliver-message but with a non-key item.
- **Resolve**: same pattern.
- **Flavor**: favor, friendship, trade.

### 6. Settle-dispute
> "`<NPC_A>` says X. `<NPC_B>` says Y. Bring me `<evidence_item>` so I can judge."
- **Effect**: player obtains the evidence item (could be a find-in-chunk, a drop from a wild defeat, or a purchase).
- **Resolve**: player presents evidence to the dispute-judge NPC (always the issuing NPC, not one of the disputants). Resolve line acknowledges which side the evidence favored.
- **Flavor**: community, nuance.

### 7. Escort
> "Walk with me back to `<chunk>`. Keep the wildlife off."
- **Effect**: NPC becomes a follower; they track near the player. Any wild encounter that triggers during the escort counts as an "engagement." Player must reach the destination chunk.
- **Resolve**: NPC thanks on arrival + fires reward.
- **Challenge edge case**: if player walks away from the follower (>2 chunks distance) the challenge fails silently and resets to `offered` on next interaction. No penalty.
- **Flavor**: companionship, gentle urgency.

### 8. Guard-spot
> "Stand here for `<N>` minutes. Don't let anything past."
- **Effect**: player stands on a specified chunk tile; timer counts up while they're on that tile + no wild encounter escapes them.
- **Resolve**: after timer expires, NPC arrives or next interaction fires resolve.
- **Flavor**: patience-reward.

### 9. Survey
> "Catch `<N>` different species near the `<biome_feature>` — I want the count."
- **Effect**: player's bestiary gains N unique species with last-caught-location in the challenge's chunk.
- **Resolve**: player talks to NPC.
- **Flavor**: naturalist, curious.

### 10. Recover-heirloom
> "A rare thing was dropped near the `<biome_feature>`. Return it for a reward."
- **Effect**: player picks up a specific collectible sprite placed in the chunk at realization.
- **Resolve**: player returns item to NPC.
- **Flavor**: sentimental, advertised as higher-reward ("it means the world to me").
- **Reward modifier**: `challenge_heirloom` (×5) — players should *feel* the payoff difference.

## Effect kinds (detection primitives)

Each cause maps to one of these effect kinds. The effect kind is what the runtime actually watches for.

| ID | Detection |
|---|---|
| `catch_species` | player's party gains a creature of species S in chunk C |
| `inventory_count` | player's inventory has ≥N of item I |
| `defeat_flagged_wild` | player defeats encounter-instance E in chunk C |
| `deliver_item_to_npc` | player interacts with NPC X while holding item I |
| `reach_chunk` | player enters chunk C (for escort endpoints) |
| `timer_on_tile` | player stands on tile T for ≥ T seconds cumulative |
| `bestiary_delta` | bestiary gains ≥N unique species matching filter F |
| `pickup_object` | player picks up object O placed in chunk C |

## Parameterization

At chunk realization, each NPC rolls a challenge based on seed + role. Parameters are bound at this time.

```
generateChallenge(seed, chunk_xy, npc_spawn_idx, npc_role):
  cause   = pickCauseForRole(seed ^ npc_spawn_idx, npc_role)
  params  = {}

  switch cause:
    case 'find_pet':
      params.species = sampleSpeciesInBiome(chunk_xy, tier)
      params.biome_feature = sampleBiomeFeature(chunk_xy)
    case 'fetch_item':
      params.item = sampleFetchableItem(tier)
      params.N = chooseN(1..5)
      params.biome_feature = sampleBiomeFeature(chunk_xy)
    case 'deliver_message':
      params.target_npc = pickNearbyNamedNpc(seed, chunk_xy, radius=3)
      params.target_chunk = params.target_npc.chunk
      params.item = 'sealed_letter_from_{issuing_npc_name}'
    case 'settle_dispute':
      params.disputants = pickTwoNearbyNpcs(seed, chunk_xy, radius=2)
      params.evidence_item = rollEvidenceItem(tier)
    case 'escort':
      params.dest_chunk = pickNearbyChunk(seed, chunk_xy, radius=2, biome_ok=True)
    case 'guard_spot':
      params.tile = pickInteriorTileNearNpc(chunk_xy, npc_spawn_idx)
      params.seconds = 60..180
    case 'survey':
      params.N = chooseN(3..6)
      params.biome_feature = sampleBiomeFeature(chunk_xy)
    case 'recover_heirloom':
      params.pickup_chunk = chunk_xy      # same chunk, visible collectible
      params.pickup_tile  = pickObjectTile(chunk_xy, npc_spawn_idx)
    # ... etc

  return { cause, params, effect_kind: effectKindFor(cause) }
```

### Role → cause affinity

Not every role offers every cause. Affinity table:

| Role | Common | Rare |
|---|---|---|
| farmer | find_pet, fetch_item, settle_dispute | recover_heirloom |
| hunter | defeat_threat, survey | fetch_item, find_pet |
| fisher | find_pet (water species), survey (water species) | fetch_item |
| elder | recover_heirloom, deliver_message, settle_dispute | — |
| historian | recover_heirloom, survey | deliver_message |
| shrine_keeper | guard_spot, recover_heirloom | deliver_message |
| shopkeep | fetch_item, deliver_item | — |
| innkeep | deliver_message, escort | fetch_item |
| wanderer | escort, deliver_message, deliver_item | — |
| guard | defeat_threat, escort | guard_spot |
| villager_generic | any | any |
| child | find_pet, recover_heirloom | — |
| trainer | defeat_threat | — |
| rival | — (no challenges; rivals are combat prompts) | — |
| guide | — (tutorial-only, no challenges after ceremony) | — |

## Challenge dialog composition

The three dialog beats (offer, thanks, idle_after_resolve) pull from the NPC's dialog profile (see `docs/DIALOG_POOL.md § NPC → pool mapping`).

The NPC's profile has 2 challenge_offer lines, 2 challenge_thanks lines, 3 idle_after_resolve lines. When a challenge is generated:

1. Pick one challenge_offer line from the profile, pattern-matched to the cause (lines are tagged by which causes they fit).
2. Resolve template tokens (`{species}`, `{biome_feature}`, `{named_NPC}`, etc.) from the challenge's `params`.
3. Render the offer with speaker = NPC name, accept/decline buttons.

On resolve:
1. Pick one challenge_thanks line (also tagged by cause).
2. Resolve tokens.
3. Render as speaker line.
4. Fire reward function.

After `DEGRADE_DAYS`:
1. NPC's next greeting pulls from idle_after_resolve instead of ambient/greeting.
2. One of the 3 idle lines is picked deterministically per challenge resolution; same line until another challenge resolves with this NPC.

### Line tagging example

```json
{
  "id": "farmer_challenge_offer_calm_band0_003",
  "context": "challenge_offer",
  "mood": "calm",
  "level_band": 0,
  "text": "I lost my {pet} near the {biome_feature}. Bring it back?",
  "tags": ["cause:find_pet"]
}
```

Lines without a `cause:*` tag are generic fallbacks (rare).

## Challenge journal (UI)

Pause menu → Challenges tab. Lists:

- Active accepted challenges: issuing NPC name + chunk name + one-line summary + progress indicator.
- Resolved-but-not-collected: rare state when resolve fires but reward UI was dismissed; journal holds the receipt.

Journal never shows declined challenges. Declined + re-offered is a fresh entry.

## Reward integration

Reward fires on resolve via `docs/ECONOMY.md § reward()`:

```typescript
reward({
  player_level,
  party_strength,
  chunk_tier,
  source: 'challenge_normal' | 'challenge_heirloom',
  source_modifier: 2.0 | 5.0,
});
```

Modifier selected based on the challenge's cause:
- `recover_heirloom` → `challenge_heirloom` modifier.
- All other causes → `challenge_normal` modifier.

Some causes can tag `rare_flag_multiplier = 2.0` when the parameter roll landed on a rare species (e.g. find-pet for a legendary). NPC dialog flavor nods to it.

## Persistence

Chunk delta schema adds per-NPC challenge state:

```json
{
  "chunk_id": "seed=42;x=3;y=-1",
  "npcs": {
    "spawn_3": {
      "challenge": {
        "cause": "find_pet",
        "params": { "species": "applepup", "biome_feature": "pond" },
        "effect_kind": "catch_species",
        "state": "accepted",
        "offered_at_day": 1,
        "accepted_at_day": 1,
        "resolved_at_day": null
      }
    }
  }
}
```

Minimal; stored inside chunk delta rather than a separate table.

## Edge cases

- **Target species not in biome.** `sampleSpeciesInBiome` uses the chunk's own encounter table. If a biome has no valid species for a cause, pick a different cause.
- **Target NPC despawned / missing.** Deliver-message target NPC must exist at realization time. If the target chunk hasn't been realized yet, use the chunk's planned first-NPC slot (deterministic from seed) as target; the recipient is guaranteed to be placed when the player arrives.
- **Escort follower pathing.** Follower NPC uses v1's existing event-tracking pattern (follow within N tiles; teleport to player if stuck). Challenge fails silently if distance >2 chunks.
- **Guard-spot interrupted.** Timer pauses if player leaves the tile; resumes on return. No punishment.
- **Multiple challenges per NPC.** At any time an NPC holds one challenge. Once resolved + degraded, the NPC may be re-rolled with a fresh challenge (on next chunk re-realize, e.g. after a long absence). v2.0 doesn't re-roll — "one challenge per NPC per save" is simplest; revisit post-v2 if playtesters find the world feels static.
- **Challenge collision.** Two NPCs in the same village roll the same cause + species? Allowed. Players might see two "I lost my Applepup" offers in one village — it's a seed quirk, not a bug. Mitigation: when choosing cause at realization, salt with NPC spawn index so sibling NPCs get different causes preferentially (soft collision avoidance; not enforced).

## Challenge inflation safeguard

Because challenges are generated per-NPC per-chunk, a player who visits 100 chunks (with ~4 villages × 5 NPCs per village average) has ~2000 NPCs offering challenges. Even if only 10% get accepted that's 200 active challenges — unmanageable.

Safeguards:

1. **Max active challenges**: 8. Accepting a 9th prompts "You have 8 going already. Drop one?" (UX friction).
2. **Auto-expire accepted-but-ignored**: 50 in-game days after accept with no progress → reverts to `offered` state silently.
3. **Challenge journal sorts by proximity to player**: oldest/farthest-away challenges drift to the bottom; recently-offered float up.

## Authoring surface

```
src/content/v2/challenges/
  templates.json         # 10 cause × 3-5 effect variants = ~40 base templates
  cause_affinities.json  # role → cause weight table
  evidence_items.json    # item list valid as evidence_item param in settle_dispute
  fetchable_items.json   # item list valid as fetch_item param
  heirloom_items.json    # item list valid as recover_heirloom params
```

Templates reference dialog-pool line IDs by their cause tag (no duplication).

## Validation

### Build-time tests

- **Every cause has ≥ 5 lines** in dialog pool tagged with `cause:<cause>`.
- **Every cause has valid parameterization**: the `generateChallenge` output for a cause with default params is schema-valid.
- **Role→cause affinity coverage**: each role that offers challenges has ≥ 2 candidate causes.
- **Token resolution**: every `{token}` in a challenge_offer line has a matching param in at least one cause.
- **Seed determinism**: `generateChallenge(seed, chunk, idx)` called twice returns identical challenges.

### Integration tests

- **Offer → accept → resolve round-trip** for each of the 10 causes.
- **Decline → re-offer**: declining an offer lets the NPC offer it again on next interaction.
- **Resolve → degraded**: after `DEGRADE_DAYS`, NPC shifts to idle_after_resolve lines.
- **Deliver-message to target NPC**: letter-item delivery across chunks fires resolve.
- **Escort distance failure**: walking 2+ chunks away from follower reverts challenge silently.

## What this replaces from v1

- `src/content/gameplay/quests.json` — retired.
- `src/modules/main/quest-runtime.ts` — retired.
- `src/modules/main/quest.ts` — retired.
- `src/modules/main/quest-npc.ts` — retired.
- `quest_*_status`, `quest_*_progress`, `quest_*_done` flags — retired.
- `shopkeep_first_sale`, `lost_hiker_delivered`, `cold_hands_complete`, `snowbird_sighting_complete`, `torch_path_survey_complete`, `proofs_all_four` flags — retired.
- Dialog-wide `flag_present: quest_*_done` gates — retired (dialog now only level-banded).

## Design rules

- **A challenge is never required.** No progression gate, no chain, no "can't leave until."
- **A challenge never has lasting world impact.** Resolving 100 challenges doesn't change the world map, open new chunks, or trigger story beats. The only persistence is: the NPC remembers + your gold/items increase.
- **The reward is proportional.** No 10,000-gold quest dwarfing wild defeats. Log-scaled, in-band.
- **The offer is optional.** Decline is free. Decline 10 times in a row. Game doesn't care.
- **The UI never nags.** No persistent "unfinished quest!" indicator. Journal entry is the only surface; out-of-sight is out-of-mind.

## Related specs

- `docs/DESIGN.md` — non-pivotal rule, cozy tone.
- `docs/WORLD_GENERATION.md` — NPC realization, chunk params.
- `docs/DIALOG_POOL.md` — challenge_offer / thanks / idle contexts, token resolution, cause tags.
- `docs/ECONOMY.md` — reward function invocation.
