---
title: Rivers Reckoning — Glossary
updated: 2026-04-22
status: current
---

# Glossary

This glossary describes current Rivers Reckoning terms after the native-English pivot.

## Core Terms

| Term | Meaning |
|---|---|
| Rivers | Player character and story anchor. |
| Companion | A caught creature in the player's party. |
| Capture Pod | Tool used to catch wild creatures. |
| Party | Up to six companions; the party is the character sheet. |
| Region Master | Major gate fight for a region. |
| Green Dragon | Endgame set-piece boss and legendary final-route creature. |
| Clue | Curated investigation note stored in `src/content/clues.json`. |
| Field Log | Player-facing list of discovered clue/field-note entries. |
| Bestiary | Seen/caught creature catalog. |
| Trail Token | Current shop currency item. |

## Current Regions

| Map Id | Display Name | Role |
|---|---|---|
| `riverside_home` | Riverside Home | Starter village and first safe zone. |
| `greenwood_road` | Greenwood Road | First route and rival/forest quest area. |
| `highridge_pass` | Highridge Pass | First region-master gate. |
| `lakehaven` | Lakehaven | Water town, shop, and second region-master gate. |
| `frostvale` | Frostvale | Ice village and third region-master gate. |
| `dreadpeak_cavern` | Dreadpeak Cavern | Cave climb and fourth region-master gate. |
| `rivergate_approach` | Rivergate Approach | Endgame approach and green-dragon route. |

## Combat Types

The internal type ids are legacy stable ids because they are already threaded through saves, content, and tests. User-facing labels are English.

| Internal Id | Display Label |
|---|---|
| `seli` | fire |
| `telo` | water |
| `kasi` | wild |
| `lete` | frost |
| `wawa` | stone |
