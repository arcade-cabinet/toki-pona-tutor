---
title: Architecture
updated: 2026-04-19
status: current
domain: technical
---

# poki soweli Architecture

poki soweli is a Pokemon-shaped RPG whose world is named in Toki Pona. The player walks between villages, catches creatures in tall grass with a net (**poki**), builds a party of up to six, and beats a **jan lawa** (master) in each village to unlock the next region.

Language is diegetic flavor, not the mechanic. Every creature, place, and move has a canonical Toki Pona name that the player accumulates as vocabulary simply by playing. The game never makes the player translate — it just lets the language saturate the world.

## Tech stack

- Vite 6 + React 18 (app shell, menus) + SolidJS 1.9 (game UI overlays — dialog, combat, HUD) + Phaser 4 (overworld + combat scenes) + Koota 0.6 (ECS for in-world entities)
- TypeScript strict. Tailwind for shell styling. Tone.js + Web Audio for SFX/BGM.
- Web ships to GitHub Pages. Native Android via Capacitor 8.

## The content pipeline

This is the load-bearing decision. All game content is declarative JSON; all Toki Pona is canonical (Tatoeba-sourced); hand-authored TP is banned.

### Directory layout

```
src/content/
  corpus/
    tatoeba.json         # vendored CC BY 2.0 FR corpus, immutable
    LICENSE.md
  schema/                # Zod schemas — source of truth for content shape
    species.ts
    move.ts
    region.ts
    npc.ts
    dialog.ts
    item.ts
    world.ts
    koota-gen.ts         # zodToKootaTrait() helper
    index.ts
  spine/                 # English-only source content, committed
    species/<id>.json
    moves/<id>.json
    regions/<id>.json
    items/<id>.json
    world.json           # region adjacency + story spine
  generated/
    world.json           # compiled output, committed for reproducibility
```

### Authoring contract

Content authors (humans or agents) edit only `src/content/spine/`. Every Zod schema tags translatable string fields with a `.describe('tp')` marker. Those fields carry an `en` value at authoring time; `tp` is filled at build.

### Build steps

- `pnpm validate-tp` — walks every `en`-tagged string in spine, confirms an exact Tatoeba pair exists, prints the three closest EN targets for any miss. Exit 1 on any miss.
- `pnpm build-spine` — validates spine files against Zod, resolves every `en` to its canonical Tatoeba `tp`, emits `src/content/generated/world.json`.
- `pnpm prebuild` — runs validate-tp then build-spine then typecheck. Vite's `build` inherits from this.
- CI (`.github/workflows/content-validate.yml`) runs validate-tp and build-spine on every PR. A merged PR with a spine change that fails validation is impossible.

Single-word TP values (entries from `dictionary`) are exempt — `kili`, `soweli`, `moku`, etc. are vetted already. The validator only gates multi-word constructions.

### Zod → Koota bridge

`zodToKootaTrait(schema)` returns a Koota trait whose shape is the schema's inferred TypeScript type. At scene-boot the engine loads `generated/world.json`, iterates entities, and instantiates Koota entities tagged with the relevant traits. This gives us one source of truth for both content and runtime state.

## Game shape

### The party (player's character sheet)

The player has no stats of their own. Their `party[]` is up to six creatures. Each creature has HP, types, moves, XP, and a level. When the lead creature faints, the next comes out automatically — when the whole party faints, the player wakes in the last village they visited.

### Types (rock-paper-scissors-extended)

Five starter types, expandable. Matchups:

- **seli** (fire) beats **kasi** (plant)
- **telo** (water) beats **seli**
- **kasi** beats **telo**
- **lete** (ice) beats **waso** (sky/bird) *(waso lands later)*
- **wawa** (strong) no advantage/disadvantage; high raw damage

### Encounters

**Tall-grass random:** on each overworld step while standing on a tile tagged `tall-grass`, roll the region's encounter table. On hit, transition to combat with the rolled species at the region's encounter-level range.

**Set-piece:** hand-placed guardian fights, one per region, gating the path to the next region. Named, memorable, higher level than the surrounding grass.

### Catch mechanic

Every starter kit contains three **poki** (nets). During a wild fight the player can spend a move-turn to throw a poki. Success chance = `(1 - enemy_hp / enemy_hp_max) * species.catch_rate`. On success, the creature joins the party (if party ≤ 5). On failure, the wild creature gets its turn.

### Progression gates

Each region has a `gate_species_to_pass` — creatures you must have in your Pokedex before the jan lawa fight unlocks. This keeps players in-region long enough to experience the biome and learn its vocabulary without forcing grind.

## Engine sketch

- `PhaserGame` (React lazy-loaded) boots a single `OverworldScene`.
- `OverworldScene` reads `generated/world.json`, picks the region keyed by the save's `current_region`, paints the tile layout from the region's `tiles[]`, spawns NPCs/signs/warps as Koota entities, arms the encounter roller on `tall-grass` tiles.
- `CombatScene` is a Solid overlay (existing `CombatOverlay`, extended) that knows how to run any two `Creature` entities against each other using move data from `generated/world.json`.
- `DialogOverlay` reads multi-beat dialog nodes from the region's `dialog[]`, still supports typewriter + glyph lesson cards.

The engine is small on purpose. The content pipeline is where the richness lives.

## What's being deleted in the pivot

- `src/game/procgen/` (seed, villageGen, seedPhrase)
- `src/game/solid-ui/NewGameModal.tsx`
- Seed HUD chip in `AdventureHUD.tsx`
- `src/content/village.json` (replaced by spine files + generated output)
- Hungry-friend quest (reframed as the starter-choose ceremony)

The village-scale procgen was a dead end for an RPG. Real RPGs are authored.
