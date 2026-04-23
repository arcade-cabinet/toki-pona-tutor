---
title: Design
updated: 2026-04-22
status: current
domain: product
---

# Design

Rivers Reckoning is a native-English creature-catching RPG built around Rivers, a young explorer investigating a fantastical world full of strange creatures, regional disputes, and a green-dragon mystery.

## What It Is

-   **A kid-friendly fantasy investigation.** Rivers travels from home village to forest road, high pass, lake town, frost village, dread cavern, and final river approach.
-   **A creature-catching RPG.** Every monster is catchable. Bosses and rare creatures differ by difficulty, rarity, and presentation, not by an uncapturable rule.
-   **A party-first progression game.** The player has no standalone combat sheet; the party of up to six creatures is the build.
-   **A mobile-first web/Android game.** Tap-to-walk and tap-to-interact are primary; keyboard is a desktop shortcut.
-   **A native-English story.** The former language constraint is gone so NPCs, quests, mysteries, and flavor text can be richer and more natural.

## What It Is Not

-   **Not a translation or vocabulary exercise.** Field Notes and the clue journal support investigation, not language learning.
-   **Not a clone of any trademarked property.** Use genre-neutral creature-catching language and original names.
-   **Not grind-first.** Encounters should advance collection, clues, quests, items, party strength, or regional access.
-   **Not combat-optimization-first.** Combat should be legible, fair, and repeatably fun before it is deep.
-   **Not an in-game editor.** Maps are authored through TypeScript specs and emitted artifacts.

## Core Loop

```text
explore -> notice clue/quest/grass -> encounter -> fight or capture
   ^                                             |
   |                                             v
reward, party growth, region access <- quest/master/finale progress
```

The loop should stay understandable on a phone screen. If a feature requires precise keyboard play or tiny click targets, it is not done.

## Internal Combat Types

The content still uses stable internal type IDs for saves and formulas:

| ID     | Player-facing role      |
| ------ | ----------------------- |
| `seli` | fire                    |
| `telo` | water                   |
| `kasi` | wild                    |
| `lete` | ice                     |
| `wawa` | stone / neutral bruiser |

Use English labels in player-facing copy unless an internal ID is being shown for debug or authored-data reasons.

## Design Principles

-   **Diegetic over didactic.** The world teaches through placement, NPC staging, encounter zones, and repeated affordances.
-   **Legibility over density.** Dense maps are good only when roads, blockers, warps, hazards, NPCs, and encounter zones remain readable.
-   **Mobile comfort over desktop shortcuts.** Every gameplay action needs a clear touch route.
-   **Cohesion over asset novelty.** A beautiful tile that clashes with the chosen style is worse than a simpler coherent tile.
-   **Short, purposeful text.** Native English allows richer writing, but every dialog beat still needs a gameplay or character purpose.
-   **Kid audience first.** Fierce is fine; grim, gory, punitive, or mean-spirited is not.

## V1 Success Criteria

1. Boot to credits is softlock-free through the real browser path.
2. The player can catch a varied party without excessive grinding.
3. Maps look like a cohesive authored world, not isolated tile experiments.
4. The HUD frames gameplay without hiding targets on mobile.
5. Combat communicates HP, damage, effectiveness, capture, defeat, and reward clearly.
6. Quests, clues, loot, and NPCs form a complete beginning-to-end journey.
7. Save/continue, Pages deployment, release artifacts, and debug APK builds are proven.
8. Docs describe only what is true now or explicitly mark future work.

## Open Design Work

-   Expand the story and quest chain from the current playable arc into a richer v1 journey.
-   Recompose maps using the curated art manifest and stronger biome-transition grammar.
-   Tune combat/catching/economy pacing through repeated golden-path playtests.
-   Replace placeholder/shared audio with a more intentional soundtrack and SFX pass.
-   Device-prove Android debug APK and iOS Pages smoke flows with Maestro.
