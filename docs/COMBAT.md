---
title: Combat
updated: 2026-04-22
status: current
domain: design
---

# Combat

Rivers Reckoning currently has two combat paths.

## Wild Encounters

Wild encounters are dialog-driven creature fights launched from encounter zones. The player can:

-   fight
-   throw a capture pod
-   use an item
-   run

Wild encounters award clue sightings, bestiary seen/caught records, drops, XP, and party additions when captured.

## Set-Piece Action Battles

Rival, region-master, and green-dragon fights use RPG.js action battle. The current bridge swaps the player body to the lead creature, syncs HP/SP/ATK/PDEF, shows the lead movebar, supports bench switching, and restores the field hero afterward.

The set-piece path lives mainly in:

-   `src/modules/main/jan-ike.ts`
-   `src/modules/main/gym-leader.ts`
-   `src/modules/main/green-dragon.ts`
-   `src/modules/main/lead-battle-avatar.ts`
-   `src/modules/main/lead-battle-skills.ts`

## Combat Types

Internal IDs remain stable for formulas and saves:

-   `seli` = fire
-   `telo` = water
-   `kasi` = wild
-   `lete` = ice
-   `wawa` = stone / neutral bruiser

Player-facing copy should use English labels where practical.

## Current Rewards

Wins/catches can grant:

-   creature XP and level-ups
-   learned moves
-   coins/items
-   clue IDs
-   badge/proof flags
-   quest progress

## Acceptance

Combat is acceptable only when the player can tell:

-   who is acting
-   who is damaged
-   whether HP changed
-   whether capture succeeded
-   why the fight ended
-   what reward was gained

The remaining v1 work is not "add more effects" in isolation. It is tuning encounter frequency, catch odds, party switching, item economy, XP curve, move variety, and boss escalation through repeated playtests.
