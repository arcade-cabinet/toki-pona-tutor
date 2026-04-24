---
title: Production Checklist
updated: 2026-04-23
status: current
domain: release
---

# Production Checklist

This document owns the big-picture question: how close Rivers Reckoning is to a
polished v1, by product pillar rather than by commit history.

`docs/STATE.md` is the current verified snapshot. `docs/ROADMAP.md` is the
task-level backlog. This file is the bridge between them.

## Release Snapshot

-   Latest verified release: `v0.12.0` (carries Phase 11 onboarding closure + T21 quest dialogs; release-please landed v0.4.0 → v0.12.0 through the same pipeline).
-   First remote-release proof: `v0.3.1` — the tag that proved the full `ci.yml` → `release.yml` → `cd.yml` chain end-to-end.
-   GitHub Pages: `https://arcade-cabinet.github.io/poki-soweli/`
-   Verified remote release flow (original proof on `v0.3.1`):
    -   feature merge to `main`: squash merge commit `d68fed9e4aebad3aea226d248e7e0cdca3873827`
    -   release-please merge to `main`: squash merge commit `a546843137137a57dc782fb4f99e32123a661d36`
    -   artifact-producing `release.yml` run: `24819206623`
    -   `cd.yml` workflow-run deploy: `24819295738`
-   Release assets template (same naming pattern on every tag):
    -   `rivers-reckoning-web-<tag>.tar.gz`
    -   `rivers-reckoning-<tag>-debug.apk`

## Pillar Status

| Pillar                      | Status  | What Is True Now                                                                           | What Still Blocks V1                                                                                 |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Runtime and build stability | strong  | local run/build/test matrix is wired; Pages and debug APK release flow are proven remotely | keep the matrix green while product work continues                                                   |
| Story and quest journey     | strong  | story bible + 15 quests across 7 regions (≥2 per region, cross-region payoff in `quest_lost_hiker`), 3-beat quest-authored NPC dialogs, post-clear green-dragon re-fight, scripted opening scene | final polish on NPC arcs, optional side paths that surprise                                          |
| Maps and art direction      | partial | seven generated maps ship and art curation boundaries exist                                | map density, landmarks, transitions, blocker readability, final visual stack choice                  |
| Combat and economy          | partial | wild capture loop, lead action battles, XP, rewards, and shops are playable                | tuning encounter pacing, catch odds, move variety, progression curve, economy                        |
| Mobile UX                   | partial | tap-to-walk, HUD menu, pause routes, touch-friendly shells, Android emulator smoke, goal widget + pause glance dashboard (Phase 11), dialog Enter/Space keyboard-advance | broader real-device proof, iOS Safari proof, more failure-path comfort                               |
| Audio and presentation      | partial | runtime BGM/SFX wiring exists and brand system is in place                                 | final soundtrack/SFX pass, more polished visual atmosphere, full surface review                      |
| QA and docs                 | partial | visual audit, golden-path diagnostics, release QA docs, and current-state docs exist       | full manual boot-to-credits playtest notes, physical-device release QA, ongoing doc drift discipline |

## Remaining Work By Domain

### Product

-   Expand the current playable arc into a fuller investigation journey.
-   Add stronger recurring NPC arcs and cross-region quest payoff.
-   Clarify optional catches, side paths, and post-clear reasons to keep playing.

### World And Art

-   Choose the final v1 overworld/interior visual stack from the curated and pending packs.
-   Rebuild maps for stronger route language, transitions, landmarks, and encounter readability.
-   Remove remaining sparse/proof-of-concept-looking areas from the shipped maps.

### Systems

-   Tune encounter frequency, catch odds, move depth, XP curve, and shop pricing from repeated playtest evidence.
-   Improve combat readability and repeat-fun rather than only baseline legibility.

### UX And Mobile

-   Prove the release-attached Android debug APK on a physical device.
-   Prove Mobile Safari/iOS simulator smoke against deployed Pages.
-   Keep reducing HUD friction and make sure no action path requires keyboard assumptions.

### Audio And Polish

-   Replace placeholder/shared audio choices with a deliberate soundtrack and SFX identity.
-   Finish the final visual polish pass across title, HUD, pause, dialog, battle, loading, defeat, and credits.

### Release And QA

-   Keep the proven `ci.yml -> release.yml -> cd.yml` flow intact.
-   Address the upstream `release-please-action` Node 20 deprecation before GitHub's forced Node 24 switch.
-   Decide whether signed Android release builds and native iOS builds are in v1 scope or post-v1 scope.

## Not Yet In Scope

These are explicitly not shipped today:

-   signed Android release APK / AAB automation
-   native iOS app packaging/signing
-   physical-device signoff across both platforms
-   a finalized store-listing submission package

## Exit Condition For V1

Rivers Reckoning is ready for a polished v1 only when:

-   the journey is fun and complete from fresh start to credits without doc help
-   the maps look cohesive in screenshot review, not merely valid in Tiled/runtime
-   combat and capture pacing feel intentionally tuned
-   mobile play is comfortable on real devices
-   release artifacts and docs stay honest and reproducible
