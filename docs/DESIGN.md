---
title: Design
updated: 2026-04-19
status: current
domain: product
---

# Design

What poki soweli **is**, what it **is not**, and the UX principles that settle the arguments.

## What it is

**A creature-catching RPG where the world is named in toki pona.** Players walk between villages, catch creatures in tall grass with a **poki** (net), build a party of up to six, and beat seven **jan lawa** (region masters) to progress. Vocabulary accumulates diegetically — by the end of a playthrough, the player reads a dialog line in TP and understands it the way they'd understand a song lyric they've sung a hundred times: not translated, *known*.

**It is for kids** learning language — roughly 7-to-12 — with a fierce-but-friendly tone. Dread-knight, not death-knight. Bright palette. Quick resolution on every interaction (no filibuster tutorials, no walls of English).

**It is a single-player offline web + Android game** built on Phaser 4 + Koota ECS + Solid-JS UI overlays, authored with Fan-tasy tileset art, shipped via GitHub Pages (web) and Capacitor (Android).

## What it is NOT

- **Not a translation exercise.** The UI never shows EN glosses for TP words. No flashcards, no quizzes mid-play.
- **Not Pokemon, not Pokémon, not a clone of any trademarked property.** The genre conventions (parties, types, catch nets, gym-like region masters) are conventions, not copies.
- **Not grindy.** Every encounter moves the story forward by either vocabulary, item, or region-gate progress. If a player is killing time for XP, something's wrong with the spec.
- **Not combat-optimization-first.** The fun is exploration + language + catching, not min-maxing movesets. Combat needs to be *legible* and *fair*, not deep.
- **Not an authoring platform.** Tile layouts are committed `.tmx` files; there's no in-game editor.

## Core loop

```
walk tall grass  →  encounter (random)  →  combat (capture or defeat)
     ↑                                              ↓
     └───  warp between regions  ←  jan-lawa defeated ←  party strong enough
                                                          ↑
                                                    catch enough species
```

Every other system (dialog, inventory, save, audio) supports this loop.

## The five types

| TP | EN gloss | Role |
|---|---|---|
| **seli** | fire | strong against kasi; weak to telo |
| **telo** | water | strong against seli; weak to kasi |
| **kasi** | plant | strong against telo; weak to seli |
| **lete** | ice/cold | strong against flying (`waso`); limited coverage elsewhere |
| **wawa** | strong | no advantage / disadvantage; high raw damage, "bruiser" type |

Starters are seli / telo / kasi (the rock-paper-scissors triangle). `lete` and `wawa` are catchable later.

## Principles that settle arguments

### Diegetic over didactic

When in doubt, the game explains itself *through* the world, not through a tutorial overlay. The starter ceremony is jan Sewi handing the player a choice — not a modal. The encounter mechanic is a creature appearing when the player steps on tall grass — not a popup explaining "Encounters happen in tall grass."

### Consistent playing pieces

Every sprite on screen must look like it belongs with every other sprite. The Fan-tasy family gives us visual coherence; the boss-vs-creature tier rule gives us narrative coherence. No mixing.

### Short over complete

We ship a fun 15-minute slice before we ship a mediocre 4-hour game. `docs/ROADMAP.md` is a dependency-ordered backlog — each phase ends with something playable.

### Legibility over depth

If the player can't tell what happened, the feature is broken regardless of correctness. HP bars animate. Damage numbers pop. Type multipliers show a colored highlight. Catch success or failure has a clear moment.

### Kid audience over all else

When a naming call is close, pick the kid-friendly one. When a mechanic feels punishing, loosen it. When a text string sounds grim, rewrite. No permadeath. No stat trolling. No wasted time.

## Success criteria (copied from ROADMAP § 1 — the definition of "done")

These are the objective tests a 0.1.0 release must pass. See `docs/ROADMAP.md` for the full list; headlines:

1. **Full playthrough, softlock-free.** Boot → starter ceremony → walk → catch → warp → gym → next region → … → final boss. No dead-ends.
2. **Catch count reachable.** ≥ 20 distinct captures across 17 species achievable without grinding.
3. **Combat is legible and fair.** Animated HP, damage numbers, visible type matchups, clear capture/defeat outcomes.
4. **UI is themed and mobile-legible.** 44×44dp touch targets on 1080p phone. sitelen-pona renders in names.
5. **Saves and resumes.** Autosave on region change, battle end, quit. `Continue` returns exactly where the player left.
6. **Audio live.** Per-biome music. ≥ 12 SFX wired.
7. **Exports green.** Web ≤ 30MB compressed, Android APK installable.
8. **CI green.** Full validate + typecheck + test suite.

## Open design questions (not yet settled)

- **Party management UI** — drag-to-reorder? Hotkeys? How does the player swap the lead? Needs a mockup pass.
- **Save slot count** — single autosave only, or 3 named slots? Probably single autosave for v0.1.
- **Difficulty curve** — enemy level ramp across regions 1–7. Need to playtest before committing numbers.

None block the Phase-1 slice.
