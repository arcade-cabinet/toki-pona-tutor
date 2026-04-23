---
title: Launch Readiness Checklist
updated: 2026-04-23
status: current
domain: ops
---

# Launch Readiness Checklist

This is the manual readiness sweep for the current public-playtest phase.
It is intentionally narrower than a full store-submission checklist because the
current shipped targets are GitHub Pages plus a debug Android APK.

Automated CI and release proof are assumed green before this checklist starts.

## Product

-   [ ] Fresh-start to credits is playable without doc lookup.
-   [ ] Quest flow has no known softlock.
-   [ ] Required region-master progression is legible.
-   [ ] Save/Continue works from a real release artifact.

## World And Visuals

-   [ ] `docs/VISUAL_REVIEW.md` checklist has been walked for the current branch.
-   [ ] All authored maps have current visual-audit screenshots.
-   [ ] No known blocker/overlay/transition issue is being silently accepted.

## Release And Platform

-   [ ] Latest remote `release.yml` artifact run succeeded.
-   [ ] Latest remote `cd.yml` workflow-run deploy succeeded.
-   [ ] GitHub release has both the web tarball and debug APK attached.
-   [ ] Pages boot verified at `https://arcade-cabinet.github.io/poki-soweli/`.

## Mobile

-   [ ] Android emulator smoke completed with the release-attached debug APK.
-   [ ] One physical Android device smoke completed with the release-attached debug APK.
-   [ ] iOS simulator or Mobile Safari Pages smoke completed against deployed Pages.
-   [ ] Portrait and landscape layouts remain usable.

## Docs

-   [ ] `docs/STATE.md` matches the current shipped truth.
-   [ ] `docs/PRODUCTION.md` matches the actual remaining work.
-   [ ] `docs/ROADMAP.md` statuses match the verified state.
-   [ ] Root docs (`README.md`, `CLAUDE.md`, `AGENTS.md`, `STANDARDS.md`) align with the same story.

## Out Of Scope For This Checklist

The following are not implied complete just because this checklist is green:

-   signed Android release builds
-   native iOS builds
-   App Store / Play Store submission metadata
-   physical-device accessibility signoff at store-launch level
