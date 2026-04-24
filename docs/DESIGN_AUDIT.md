---
title: Rivers Reckoning — Design Audit
updated: 2026-04-24
status: draft
domain: product
---

# Design Audit — Rivers Reckoning vs. its own ambitions

The toki-pona → English rename stripped a veil off a game whose structural choices
were opaque even in the original language. This document lists every inconsistency the
rename exposed. Each entry is a specific claim with an observation, an assessment, and
a proposed resolution. Nothing here is implemented yet — this is a spec for what needs
deciding before any more code changes.

The game is supposed to be "a creature-catching RPG starring Rivers" aimed at a kid
audience, benchmarked against Pokémon Red/Blue-era design. Wherever an observation
conflicts with that north star, it's flagged.

---

## 1. World scale — seven maps is a slideshow

**Observation.** `scripts/map-authoring/specs/` contains exactly seven maps:

| Map | Size (tiles) | Role in the arc |
|---|---|---|
| `riverside_home` | 16×12 | Starter village |
| `greenwood_road` | 32×12 | Route to region 1 |
| `highridge_pass` | 32×14 | Region master 1 + route |
| `lakehaven` | 20×16 | Region master 2 + town |
| `frostvale` | 22×16 | Region master 3 + town |
| `dreadpeak_cavern` | 16×20 | Region master 4 + dungeon |
| `rivergate_approach` | 28×14 | Endgame dragon arena |

Total explorable surface ≈ 3600 tiles. Pokémon Red has ~50 maps; Kanto's first
*town + route pair* (Pallet Town + Route 1) alone is ~1000 tiles. Each Rivers Reckoning
"region" is one screen.

**Assessment.** This isn't a region-based RPG; it's a beat-based short story with
single-screen set pieces. The "region master" / "badge" framing copies Pokémon's gym
structure but gives each one 1/10 the footprint.

**Resolution options.**

- **(a) Lean into "short game" identity.** Rename "region" → "chapter", drop the
  badge-as-gym framing. Each of the 7 maps is a scripted chapter beat. Total
  playtime: 30-45 min. Honest about scope; no pretense.
- **(b) Expand by building each region to 3-5 maps.** Each badge region gets a
  town, a route, a special area (cave/forest/shrine). Brings total to 25-30 maps.
  Months of work per region. Only viable if the project commits to Pokémon-scale
  ambition.
- **(c) Split difference: double each region to (town + wild zone).** 7 → 13 maps.
  Each region has one social/shop map + one creature-catching map. Feasible in
  weeks; doubles explorable surface without pretending to be Kanto.

Recommendation: (c) if shipping 1.0 before summer matters, (a) if honesty about
scope matters, (b) only as a v2 goal.

---

## 2. Type system — mixed scales

**Observation.** `src/content/gameplay/combat.json` defines five types:

```
fire, water, wild, frost, stone    (after Phase B rename)
seli, telo, kasi, lete, wawa       (original toki pona)
```

Matchup matrix:
- fire > wild, water > fire, wild > water — classic Pokémon triangle
- frost has a flat 0.5× attacker multiplier (global resist)
- frost > water+status:wet → 1.5× — status interaction
- `waso` (bird) defender tag doubles frost damage

**Assessment.** "wild" (was `kasi` = plants) is clearly grass-type masquerading as
something vaguer. The vague naming is a tell — the designer didn't want to commit
to the Pokémon triangle but built it anyway. Frost and stone are environmental
effects, not elements — they behave more like status-adjacent mechanics than core
types.

**Resolution options.**

- **(a) Commit to four classical elementals: fire/water/grass/earth.** Drop frost
  as a type; it becomes a STATUS only. Stone folds into earth. Matchup reduces to
  classic triangle + earth as universal neutral. Cleaner, legible.
- **(b) Keep five types but make them all elemental: fire/water/grass/earth/air.**
  No environment-type mixing. Standard JRPG schema.
- **(c) Keep current five but rename "wild" → "grass" and accept the scale mix.**
  Frost and stone stay as types. Minimal code change, honest about current
  design.

Recommendation: (a) for long-term legibility, (c) for v1 shipping velocity.

---

## 3. Badges — puns that don't translate

**Observation.** The four badge IDs in `src/content/gameplay/progression.json`:

```
badge_sewi  (sewi = high)   → Highridge Pass master
badge_telo  (telo = water)  → Lakehaven master
badge_lete  (lete = cold)   → Frostvale master
badge_suli  (suli = big)    → Dreadpeak master
```

In toki pona these are puns: "the high badge", "the water badge", "the cold badge",
"the big badge". In English they're opaque internal IDs. No player-facing UI
currently exposes these identifiers — they're save-file flags.

**Assessment.** Straight-rename to `badge_highridge / badge_lakehaven /
badge_frostvale / badge_dreadpeak` is mechanical and correct. The deeper question
the rename exposed is: **what do the badges mean narratively?** In Pokémon, a
badge certifies you defeated that gym leader. Here, what's a "badge" in the
Rivers-investigating-green-dragon context? The STORY.md lists them but doesn't
ground them in the world.

**Resolution options.**

- **(a) Direct rename, keep "badge" concept.** Safe; 30-min PR.
- **(b) Rename concept.** If Rivers is investigating a dragon, not running a
  Pokémon League circuit, "badge" is wrong. Could be "seal" (highridge_seal),
  "proof" (you already have `*_proof` clue tokens — unify?), "token". Requires
  story pass.
- **(c) Just the IDs for v1, defer concept rename to v2.**

Recommendation: (a) ships v1. (b) is the right long-term call.

---

## 4. Biomes — two conflicting systems

**Observation.** The codebase has two "biome" enums that don't align:

| System | Values | Source |
|---|---|---|
| `MapBiome` | `town, forest, peak, ice, cave, water` | `src/content/map-metadata.ts` |
| `AmbientBiome` | `village, kasi, lete, seli, telo, nena, indoor` | `src/modules/main/ambient-events.ts` |

The ambient-events biome drives weather tables. The map biome drives... encounter
tables? Nothing explicit consumes it uniformly.

**Assessment.** Two biome enums disagreeing is a structural smell. The ambient
enum is toki pona; the map enum is English. They were probably created at
different times by different passes and never reconciled. A map being "peak" in
one system and "nena" in another means any biome-sensitive logic has to resolve
both.

**Resolution.** Merge to one enum. The English set should win:
`village/town → town, forest, peak, ice, cave, water, indoor`. Drop `seli`
(volcanic) biome since no map uses it — unless Dreadpeak becomes volcanic
(currently it's `cave`).

---

## 5. `item.kind: "poki"` — a vestigial field

**Observation.** All capture items declare `"kind": "poki"`. The field gates
which items get surfaced to the wild-battle "catch" submenu. Non-`poki` items
can't catch.

**Assessment.** The field has ONE meaningful value (`poki`) and several
placeholder values (`heal`, `key`, `flavor`). It's a structural one-bit flag
dressed up as a taxonomy. In Pokémon terms: Poké Ball vs non-Ball is a
boolean, not a multi-value enum.

**Resolution.** Replace `kind: "poki"` with `capture: true`. Drop the field on
non-capture items entirely. Smaller schema, no toki-pona token to rename.

---

## 6. Combat XP grants — wilds pay nothing to defeat

**Observation.** `src/modules/main/encounter.ts:318` grants
`Math.floor(meta.xp_yield / 2)` on wild catch. Nothing grants XP on wild defeat
(the player chooses "fight" until target HP hits 0 → battle ends → zero XP
awarded). Only catches and trainer defeats and gym defeats pay out.

**Assessment.** This is the single biggest balance regression the user flagged.
In Pokémon, defeating a wild Pidgey awards the same XP as catching one (often
more, since catching interrupts the fight before the defeat bonus). Removing
wild-defeat XP forces a "catch every wild" grind which is antithetical to
progression freedom.

My previous T8 tuning pass (PR #171) compounded this by 5-30×'ing gym XP to
"carry the curve" — but that was treating the symptom. The root cause is that
wild DEFEATS don't award XP at all.

**Resolution.** Grant full `xp_yield * (level_scaling)` on wild defeat; keep
catches at half-yield; pull gym XP back to ~30% of inter-gym delta (vs.
current 100%). Wild encounters regain their role as the primary progression
driver.

---

## 7. Region↔badge arithmetic doesn't balance

**Observation.** 7 maps × 4 badges = 3 maps with no badge (riverside_home,
greenwood_road, rivergate_approach). The third is the endgame dragon, which
is fine. The first two are pre-first-gym content. Nothing marks the transition
from "starter area" to "first gym" beyond a warp.

**Assessment.** Pokémon's equivalent: Pallet Town → Route 1 → Viridian City →
Route 2 → Viridian Forest → Pewter City + gym 1. Five maps to reach the first
badge, each with a narrative purpose. Rivers Reckoning: 2 maps, one of which
is a single-screen green. This amplifies the "slideshow" problem from §1.

**Resolution.** Tied to §1 resolution. If the game stays 7 maps, the starter
arc needs to be narratively denser — e.g. a training encounter, a "meet the
rival" beat, a clue drop before the first master. If the game expands to 13+
maps, the first badge gets its own route-and-town cluster.

---

## 8. Five-elemental-type system has a type without a region

**Observation.** Five types (fire/water/grass/frost/stone after rename), four
gym masters. Each badge master has a species roster but is not type-specialized
like a Pokémon gym. Badge masters currently don't have a "type theme".

**Assessment.** Either the types drive the master theming (four elemental
masters + endgame dragon = five-type arc), or they don't and the types are
decoupled from gym identity. Currently they're decoupled, which again papers
over unresolved design.

**Resolution.**

- **(a) Make each master a type specialist.** Highridge = stone, Lakehaven =
  water, Frostvale = frost, Dreadpeak = fire. Green dragon (final boss) =
  grass (or a unique "dragon" type). Five types mapped to five bosses.
- **(b) Keep non-specialist masters.** They ship mixed teams. Acknowledge the
  types are decoupled from progression structure.

Recommendation: (a). It gives types narrative weight they currently lack.

---

## 9. Summary — what to decide before more code ships

The seven items above are independent decisions. Grouped for convenience:

**Scope decisions (block all further balance/rename work):**
1. §1 — how many maps should v1 ship with?
2. §7 — is the starter arc one map or a cluster?

**Structural decisions (block Phase C rename):**
3. §2 — is "wild" really "grass"?
4. §3 — are badges named by region or by toki-pona pun legacy?
5. §4 — single biome enum, which one?
6. §5 — kill `item.kind`?
7. §8 — type specialists per gym?

**Balance decisions (block v1 tuning):**
8. §6 — wild-defeat XP on, gym XP pulled back. (Concrete fix for PR #171
   regression.)

Decisions 1, 2, and 8 are the critical path. Decision 8 can land as a PR
against current main immediately (the tuning regression is the most urgent).
Decisions 1-7 need explicit sign-off before any more content or rename work.

No code changes are being made from this document. Decide, then I implement.
