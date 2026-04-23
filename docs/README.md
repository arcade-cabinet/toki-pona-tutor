---
title: Documentation Index
updated: 2026-04-23
status: current
domain: context
---

# Documentation Index

This directory is the canonical map of Rivers Reckoning by logical domain.
Use it to answer two questions quickly:

1. what is true right now
2. what work is still left

`docs/STATE.md` owns the current verified state. `docs/PRODUCTION.md` owns the
remaining work by pillar. `docs/ROADMAP.md` owns the task-level backlog and IDs.

## Root Agentic Docs

| File              | Purpose                               |
| ----------------- | ------------------------------------- |
| `../CLAUDE.md`    | fast entry point for agents           |
| `../AGENTS.md`    | extended operating protocol           |
| `../STANDARDS.md` | repo non-negotiables                  |
| `../README.md`    | player/developer-facing repo overview |

## Documentation By Domain

| Domain    | What It Owns                                                   | Core Docs                                                                                                                                                 |
| --------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Context   | current shipped state, doc map, glossary                       | `STATE.md`, `README.md` (this index), `GLOSSARY.md`                                                                                                       |
| Product   | game identity and player journey                               | `DESIGN.md`, `JOURNEY.md`                                                                                                                                 |
| Creative  | world canon and writing voice                                  | `LORE.md`, `WRITING_RULES.md`                                                                                                                             |
| Planning  | phase/task backlog and status accounting                       | `ROADMAP.md`                                                                                                                                              |
| Design    | brand system, UI behavior, combat presentation, visual review  | `BRAND.md`, `UX.md`, `COMBAT.md`, `VISUAL_REVIEW.md`                                                                                                      |
| Technical | architecture, map/build pipeline, sprite manifests, curation   | `ARCHITECTURE.md`, `ART_DIRECTION.md`, `SPRITE_CURATION.md`, `NPC_SPRITES.md`, `COMBATANT_SPRITES.md`, `EFFECT_SPRITES.md`, `build-time/MAP_AUTHORING.md` |
| Ops       | setup, deployment, release flow, launch readiness, agent roles | `SETUP.md`, `DEPLOYMENT.md`, `RELEASE.md`, `LAUNCH_READINESS.md`, `AGENT_TEAMS.md`                                                                        |
| Quality   | testing, release QA, mobile QA, visual acceptance              | `TESTING.md`, `RELEASE_QA.md`, `MOBILE_QA.md`, `VISUAL_REVIEW.md`                                                                                         |
| Release   | pillar-level completion status and remaining work              | `PRODUCTION.md`                                                                                                                                           |

## Pillars

These are the pillars the game still has to satisfy for a polished v1:

| Pillar                                              | Source Of Truth                                         |
| --------------------------------------------------- | ------------------------------------------------------- |
| Story, questing, and player journey                 | `JOURNEY.md`, `LORE.md`, `PRODUCTION.md`                |
| Maps, tiles, and world cohesion                     | `ART_DIRECTION.md`, `VISUAL_REVIEW.md`, `PRODUCTION.md` |
| Combat, capture, economy, and progression           | `COMBAT.md`, `PRODUCTION.md`                            |
| HUD, mobile controls, and UX fit-and-finish         | `UX.md`, `MOBILE_QA.md`, `PRODUCTION.md`                |
| Build, release, Pages, and Android artifact flow    | `DEPLOYMENT.md`, `RELEASE.md`, `RELEASE_QA.md`          |
| Testing, screenshots, diagnostics, and doc accuracy | `TESTING.md`, `VISUAL_REVIEW.md`, `PRODUCTION.md`       |

## If You Need One Starting Point

-   Read `STATE.md` to understand the shipped truth.
-   Read `PRODUCTION.md` to understand what is still missing.
-   Read `ROADMAP.md` if you need stable task IDs and phase breakdown.
