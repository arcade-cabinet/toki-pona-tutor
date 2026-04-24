---
title: Economy
updated: 2026-04-24
status: draft
domain: technical
---

# Economy

How gold, XP, loot, and gear flow through the game. Pairs with `docs/WORLD_GENERATION.md` (tier comes from chunk distance) and `docs/DESIGN.md` (feel constraints).

## Principles

1. **One universal reward function.** Every gold + item drop — wild defeat, catch, chest, challenge resolve, rare find — calls the same function with different modifiers. No second code path.
2. **Log-scaled everything.** XP curves, rewards, prices, loot tiers are all logarithmic on player level. Early levels feel fast; late levels feel earned but not asymptotic.
3. **In-band by construction.** Encounter difficulty + drop value track player party strength and chunk tier together. A level-5 party meets level-in-band enemies; a level-50 party meets level-in-band enemies. Same relative difficulty; different absolute numbers.
4. **No pivotal drops.** No single quest or chest gives a game-changing item. Everything is from the same log-scaled pool.
5. **Gold is the single currency.** No secondary currencies (trail tokens, proofs, etc. — all retired from v1).

## Core formulas

### Player level + XP curve

```
xp_needed(level) = floor(BASE_XP × log2(level + 1) × SCALE)

  BASE_XP = 20
  SCALE   = 12

# Examples (cumulative XP to reach level N):
# level  2 :    24 xp   (fast)
# level  5 :   186 xp
# level 10 :   600 xp
# level 25 :  2700 xp
# level 50 :  6500 xp
# level 99 : 16000 xp   (flat enough to feel earned, not asymptotic)
```

Level cap: 99. Past level 99, XP accumulates but no further levels are granted — avoids cosmetic-infinity creep.

### Party strength

Used by both encounter-level scaling and shop-pricing scaling.

```
party_strength(party):
  filled = party.filter(slot.creature != null)
  if len(filled) == 0: return 1     # Guide default
  mean = avg(filled.level)
  max  = max(filled.level)
  return 0.3 × mean + 0.7 × max
```

Skews toward the lead creature so a solo-strong party isn't mis-calibrated to zero.

### Chunk tier

```
chunk_tier(x, y) = floor(log2(1 + chebyshev_distance(x, y, (0, 0))))

# Examples:
# (0, 0)    → tier 0   (starter, Guide)
# (1, 1)    → tier 1   (one step out)
# (3, 2)    → tier 2   (three steps out)
# (7, 5)    → tier 3
# (15, 10)  → tier 4
# (31, 20)  → tier 5
# (63, 40)  → tier 6   (far wander)
```

Tier is additive to encounter level — it's how far out "really is" encoded.

### Encounter level

```
encounter_level(chunk):
  base = chunk_tier(chunk) × 5 + party_strength(player.party)
  noise = randint(-2, +2)  # seeded per encounter
  return clamp(base + noise, 1, 99)
```

Player at level 5 in tier 1 chunk → encounter level `5 + 5 + noise = 8-12`. Manageable fight.
Player at level 5 in tier 5 chunk → encounter level `5 + 25 + noise = 28-32`. Very hard, not refused. Player learns.
Player at level 50 in tier 5 chunk → encounter level `50 + 25 + noise = 73-77`. Challenging end-game.

### Drop level

```
drop_level(chunk) = encounter_level(chunk) + randint(-1, +3)
```

Slight positive skew: drops a bit better than what you're fighting, on average. Motivates pushing into new tiers.

## Universal reward function

The one function every reward source calls.

```typescript
interface RewardInput {
  player_level: number;
  party_strength: number;
  chunk_tier: number;
  source: RewardSource;  // "wild_defeat" | "wild_catch" | "chest" | "challenge" | "rare"
  source_modifier: number;  // source-specific multiplier, see table below
}

interface RewardOutput {
  gold: number;
  items: ItemDrop[];     // 0-N items; usually 0-1
}

function reward(input: RewardInput): RewardOutput;
```

### Gold formula

```
gold = floor(
  BASE_GOLD
  × (1 + chunk_tier × 0.5)
  × log2(party_strength + 2)
  × source_modifier
  × (1 + randint(-0.2, +0.2))   // ±20% noise
)

BASE_GOLD = 5
```

- Tier 1 wild defeat, party strength 5, `source_modifier = 1.0` → `5 × 1.5 × log2(7) × 1 × noise ≈ 21 gold`.
- Tier 5 chest, party strength 50, `source_modifier = 10.0` → `5 × 3.5 × log2(52) × 10 × noise ≈ 998 gold`.
- Tier 0 catch, party strength 2, `source_modifier = 0.5` → `5 × 1.0 × log2(4) × 0.5 × noise ≈ 5 gold`.

### Item drop probability

```
drop_chance = clamp(
  BASE_DROP_CHANCE
  + chunk_tier × TIER_DROP_BONUS
  × source_modifier
  × rare_flag_multiplier,
  0, 1
)

BASE_DROP_CHANCE = 0.15    # 15% base
TIER_DROP_BONUS  = 0.03    # +3% per tier
```

- Tier 1 wild defeat: `15% + 3% = 18%` item chance.
- Tier 5 chest (modifier 10): `(15 + 15) × 10 = 100%` item chance, guaranteed drop.
- Tier 3 challenge resolve (modifier 3): `(15 + 9) × 3 = 72%` item chance.

### Source modifier table

| Source | Modifier | Rationale |
|---|---|---|
| `wild_defeat` | 1.0 | baseline |
| `wild_catch` | 0.5 | reduced (you kept the creature, that's the reward) |
| `trainer_defeat` | 2.0 | harder fight, better pay |
| `chest_common` | 3.0 | one-time container |
| `chest_rare` | 6.0 | landmark chest |
| `challenge_normal` | 2.0 | 3-5× a wild; meaningful but not pivotal |
| `challenge_heirloom` | 5.0 | advertised-rare challenge flavor |
| `rare_spot` | 10.0 | legendary-spawn territory |

`rare_flag_multiplier` is `1.0` for normal, `2.0` for rare-advertised challenges, `4.0` for legendary-species drops.

## Loot tables

### Item schema

```typescript
type Item = {
  id: string;                  // stable internal id
  name: string;                // English player-facing
  kind: ItemKind;              // "capture_pod" | "potion" | "gear" | "material" | "key"
  tier: number;                // 1-10, log-scaled tier bands
  value: number;               // base shop sell price
  weight?: number;             // carry weight, optional
  stats?: StatMod;             // only for gear
  capture?: boolean;           // replaces v1 "kind: poki"; true = usable in catch
  description: string;
}

type StatMod = {
  hp?: number;
  atk?: number;
  def?: number;
  spd?: number;
}
```

No `kind: "poki"` (retired). Capture items flagged with `capture: true` instead. Cleaner schema; matches DESIGN audit §5.

### Item tier bands

Tier bands are logarithmic on item level so a tier-5 item from a level-25 drop doesn't stomp a tier-5 item from a level-10 drop.

```
item_tier_for_drop_level(lvl) = ceil(log2(lvl + 1))

# drop level  1 → tier 1   (commons)
# drop level  3 → tier 2
# drop level  7 → tier 3
# drop level 15 → tier 4
# drop level 31 → tier 5
# drop level 63 → tier 6
# drop level 99 → tier 7
```

### Loot roll

Given a drop_level, sample from the loot pool filtered by tier band:

```
rollItem(drop_level, source_kind):
  target_tier = item_tier_for_drop_level(drop_level)
  pool = loot_pool.filter(item =>
    item.tier >= target_tier - 1 &&
    item.tier <= target_tier + 1 &&
    item.source_kinds.includes(source_kind)
  )
  return weighted_sample(pool)  # higher-tier items lower-weight within the band
```

### Initial loot pool (seed set for v2.0)

~100 items spanning tiers 1-10. Rough composition:

| Category | Tier 1-3 | Tier 4-6 | Tier 7-10 |
|---|---|---|---|
| Capture pods (basic/heavy/rare/legendary) | 4 | 3 | 2 |
| Potions (heal small/med/large/full) | 4 | 4 | 2 |
| Status items (antidote, awakening, etc.) | 6 | 4 | 2 |
| Gear — weapons (if in scope) | 8 | 10 | 6 |
| Gear — armor (if in scope) | 6 | 8 | 6 |
| Gear — accessories | 4 | 6 | 4 |
| Materials (crafting future-proofing) | 4 | 4 | 2 |
| Rare / unique finds | 2 | 3 | 4 |

Total: ~102 items. Authored once, referenced everywhere.

## Gear equip decision

**In scope for v2.0.** Each party creature has **1 gear slot** (accessory-style). Items in the `gear` category apply StatMod bonuses. Rivers themselves does not equip gear — Rivers is the walker, not a fighter.

Rationale:
- Adds a collection axis beyond bestiary (which creature gets which gear?).
- Natural spend for gold (shops sell gear; players upgrade party).
- Explains loot drops meaningfully (not just "potion or potion").
- Single slot per creature keeps the UI compact — no multi-slot equip sheet.

Swap gear via pause → party → select creature → gear → inventory picker.

## Shop pricing

```
sell_price(item, chunk_tier, player_level) = floor(
  item.value
  × (1 + chunk_tier × 0.3)    # far-out shops sell higher
  × log2(player_level + 2)    # late-game prices scale up
  × TYPE_MULT[item.kind]
)

TYPE_MULT = {
  capture_pod: 1.0,
  potion:      0.8,   // encourage buying potions
  gear:        2.5,   // gear is a splurge
  material:    1.5,
  key:         5.0,   // key items almost never sold
}
```

Buy-back price at shops is always `floor(sell_price × 0.3)`.

### Shop inventory rotation

Each shop holds 5-8 items. On visit:

```
shop_inventory(shop_id, chunk_tier, game_day):
  pool = shop_template(shop_id).loot_categories
  seed = hash(shop_id, game_day / RESTOCK_DAYS)
  return sample(pool, 5 + chunk_tier % 4, seed)

RESTOCK_DAYS = 3    # shops restock every 3 in-game days
```

Deterministic per shop per restock cycle. Players can save/close/reopen without exploiting randomness.

## Inn pricing

```
heal_price(party_strength, chunk_tier) = floor(
  BASE_HEAL_PRICE
  × log2(party_strength + 2)
  × (1 + chunk_tier × 0.2)
)

BASE_HEAL_PRICE = 10
```

- Level 5 party, tier 1: `10 × log2(7) × 1.2 ≈ 34 gold`.
- Level 25 party, tier 3: `10 × log2(27) × 1.6 ≈ 76 gold`.
- Level 50 party, tier 5: `10 × log2(52) × 2.0 ≈ 114 gold`.

A single wild defeat in-tier covers the heal cost comfortably. Inns are an always-affordable safety net.

## Faint penalty

```
on_party_faint:
  player.gold = floor(player.gold × 0.9)     # 10% tax
  respawn_at = last_visited_inn ?? guide_chunk
  heal_full(player.party)                    # party restored at respawn
```

No bestiary loss, no XP loss, no item loss. Cozy-tone preservation. The 10% gold hit is real but recoverable.

## Bestiary progression rewards

Every 10 unique species met → small cosmetic/mechanical upgrade. Not gold-tied, not pivotal.

| Milestone | Reward |
|---|---|
| 10 species | +1 pod slot (max 4→5) |
| 20 species | +1 inventory slot |
| 30 species | +5% walk speed |
| 40 species | +1 pod slot (5→6) |
| 50 species | visual: cloak color-shift |
| 60, 70, 80 | incremental bag / flag / badge-pin cosmetics |
| 99 / all | final cosmetic unlock |

This is the only milestone-style reward ladder. Everything else is continuous log-scaled.

## Rare-find mechanic

Occasionally (~1/200 tiles walked), a chunk spawns a **rare find** marker — a glowing ground sprite the player can interact with. Uses source `rare_spot` with modifier 10.0. Single-use per chunk (delta persists).

Rare-find contents: high-tier item drop + chunk-seeded small gold lump. Think "shiny gold fleck" rather than "loot chest." Visually distinct.

## Calibration targets

Based on playtest goals (DESIGN v2 success criteria):

- **Session average**: 3000-5000 gold per hour of active play at levels 5-15.
- **First shop purchase affordable in**: < 10 minutes from fresh save.
- **Inn always affordable**: Inn heal never exceeds 15% of current player gold in steady state.
- **Gear meaningfully impacts**: equipping a tier-5 accessory on a level-20 creature gives ~10-15% effective stat lift.
- **Post-level-50 continued play**: progression feels earned, not ground — ~30 min of steady play per level beyond 50.

Calibration is subject to playtest. All constants above (`BASE_XP`, `SCALE`, `BASE_GOLD`, `BASE_DROP_CHANCE`, etc.) live in a single config file so tuning doesn't require code changes.

## Single-source tuning config

```
src/content/economy.json   (authored config, hot-reloadable in dev)
  {
    "xp": { "base": 20, "scale": 12, "cap": 99 },
    "gold": { "base": 5, "noise_pct": 0.2 },
    "drops": { "base_chance": 0.15, "tier_bonus": 0.03 },
    "party_strength": { "mean_weight": 0.3, "max_weight": 0.7 },
    "encounter": { "tier_mult": 5, "noise": 2 },
    "drop_level": { "skew_min": -1, "skew_max": 3 },
    "source_modifiers": { ... },
    "shop": { "type_multipliers": { ... }, "restock_days": 3 },
    "inn": { "base_price": 10 },
    "faint": { "gold_tax_pct": 0.10 }
  }
```

All formulas reference this config. Changing tuning = editing JSON; no code changes.

## Validation

### Unit tests

- `reward(...)` determinism: same inputs produce same outputs (modulo noise reset).
- `xp_needed(level)` monotonic, never exceeds `i32` bounds up to level 99.
- `encounter_level(chunk)` in `[1, 99]` for all reasonable inputs.
- Drop-chance in `[0, 1]` for all inputs.
- `rollItem(...)` returns only items in the tier band.
- Faint penalty never produces negative gold.

### Calibration tests

- Simulate 1000 encounters at (level 5, tier 0), sum gold → expected ~3000-6000.
- Simulate 1000 encounters at (level 50, tier 5), sum gold → expected ~30k-60k.
- Inn heal at (level 50, tier 5) < 15% of current gold at steady state.
- First shop purchase (cheapest potion at tier 0) affordable after ≤10 wild defeats from fresh save.

## What this replaces from v1

- `src/modules/main/victory-rewards.ts` — retired (awardLeadVictoryXp reshaped into universal reward).
- `src/modules/main/badge-derivation.ts` — retired entirely.
- `src/modules/main/quest-runtime.ts` reward-grant path — replaced by universal reward function.
- `src/content/gameplay/progression.json` — retired. Tuning config lives in `src/content/economy.json`.
- Shop inventory from `src/content/gameplay/shops.json` — retired. Procedural via shop templates.

## Related specs

- `docs/DESIGN.md` — feel targets that drive calibration.
- `docs/WORLD_GENERATION.md` — chunk tier input to encounter/drop formulas.
- `docs/QUESTS.md` — source modifiers for challenge rewards.
- `docs/DIALOG_POOL.md` — shop/inn dialog uses role-pool infrastructure.
