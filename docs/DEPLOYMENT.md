---
title: Deployment
updated: 2026-04-19
status: draft
domain: ops
---

# Deployment

## Current state (stub — expand when slice is playable)

This branch (`spike/phaser-koota-revive`) is not yet deployable. The Phase-1 vertical slice must be playable + green through the Vitest browser harness before we wire CI/CD.

When that's true, this doc describes:

- **Web** — GitHub Pages deploy via `cd.yml` triggered on `push: main`.
- **Android** — Capacitor 8 wraps the web build; debug APK builds in `ci.yml`; release APK signed + attached to release-please tags via `release.yml`.
- **Local preview** — `pnpm preview` after `pnpm build`.

## What exists today

The branch inherits `.github/workflows/content-validate.yml` (validate-tp + build-spine on PR) and `.github/workflows/deploy.yml` (GitHub Pages — status unknown, likely needs re-work). The `ci.yml`/`release.yml`/`cd.yml` trifecta called for in global standards does not yet exist on this branch.

## When this doc gets real content

After the Phase-1 slice is E2E-green and we merge this PR, a follow-up PR wires:

1. `.github/workflows/ci.yml` — lint + typecheck + vitest on every PR, no branch filter.
2. `.github/workflows/release.yml` — triggered by release-please tag; builds web bundle + signed Android APK; uploads to GitHub release.
3. `.github/workflows/cd.yml` — triggered on `push: main`; pulls artifacts from release.yml and deploys web to Pages.
4. `release-please-config.json` + `.release-please-manifest.json` (`node` config).
5. `.github/dependabot.yml` — npm, github-actions ecosystems, weekly, group minor/patch.

Until then, run locally:

```sh
pnpm install
pnpm prebuild   # validate + build-spine + typecheck
pnpm build      # vite build
pnpm preview    # preview the built bundle
```
