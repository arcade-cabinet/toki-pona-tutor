---
title: Release Runbook
updated: 2026-04-23
status: current
domain: ops
---

# Release Runbook

This file is the operational runbook for shipping Rivers Reckoning through the
current GitHub flow.

The flow is:

`ci.yml` on PRs -> merge to `main` -> `release.yml` opens/updates a
release-please PR -> release PR merges -> `release.yml` builds versioned
artifacts -> `cd.yml` consumes that completed run and deploys Pages.

## Proven Example

The latest end-to-end proof is `v0.3.1` on 2026-04-23:

-   feature merge commit: `d68fed9e4aebad3aea226d248e7e0cdca3873827`
-   release merge commit: `a546843137137a57dc782fb4f99e32123a661d36`
-   artifact-producing `release.yml` run: `24819206623`
-   consuming `cd.yml` run: `24819295738`
-   release URL: `https://github.com/arcade-cabinet/poki-soweli/releases/tag/v0.3.1`
-   Pages URL: `https://arcade-cabinet.github.io/poki-soweli/`

## Preconditions

-   The intended feature PR is green in `ci.yml`.
-   Review comments and threads are addressed before merge.
-   The docs and current-state claims for the change are already updated.

## Step 1: Merge The Feature PR

-   Squash-merge the feature PR into `main`.
-   Do not push directly to `main`.
-   Do not hand-edit tags or run `pnpm version`.

The merge commit on `main` triggers `release.yml`.

## Step 2: Let release-please Open Or Update The Release PR

The first `release.yml` run after a normal feature merge usually does one of two
things:

-   updates an existing release-please PR, or
-   opens a new one such as `chore(release): 0.3.2`

If `release_created` is `false`, this is expected. No versioned artifacts are
built yet.

## Step 3: Merge The Release PR

The release PR should be squash-merged after its checks pass. Our current setup
allows trusted release-please PRs to enroll in auto-merge, but the important
fact is the result: the release PR must land on `main`.

That merge triggers a second `release.yml` run. This is the artifact-producing
run where `release_created == true`.

## Step 4: Watch The Artifact-Producing `release.yml` Run

That run must complete these jobs successfully:

-   `release-please`
-   `build versioned web bundle`
-   `build debug APK`
-   `publish release metadata`

Artifacts produced:

-   `release-metadata`
-   `web-bundle-<tag>`
-   `android-debug-apk-<tag>`

Expected release asset file names:

-   `rivers-reckoning-web-<tag>.tar.gz`
-   `rivers-reckoning-<tag>-debug.apk`

## Step 5: Watch `cd.yml`

`cd.yml` must trigger from `workflow_run`, not from the release page race.

It should:

1. download `release-metadata` from the completed `release.yml` run
2. download the web bundle and debug APK from that same run
3. attach both files to the GitHub release for the tag
4. untar the web bundle into `dist/`
5. deploy GitHub Pages

## Step 6: Verify The Release

Use `docs/RELEASE_QA.md` and `docs/MOBILE_QA.md`.

Minimum post-release verification:

-   the GitHub release exists for the expected tag
-   both release assets are attached
-   Pages responds from `https://arcade-cabinet.github.io/poki-soweli/`
-   the deployed Pages build does not request root-level `/default-bundle.json` or
    `/revoltfx-spritesheet.json`
    because those root requests indicate a fallback to engine-default RevoltFX
    asset URLs instead of the app's Pages-base-aware asset paths
-   the release-attached debug APK downloads and unzips with the expected web
    payload under `assets/public/`

## Useful Commands

```sh
gh run list --workflow release.yml
gh run list --workflow cd.yml
gh run view <run-id>
gh run watch <run-id>
gh release view <tag>
gh release download <tag> --pattern 'rivers-reckoning-*'
pnpm release:smoke-artifacts "$RELEASE_TAG"
```

## Current Open Release Risks

-   `googleapis/release-please-action` still emits a Node 20 deprecation warning.
-   Signed Android release builds are not part of this runbook yet.
-   Native iOS packaging is not part of this runbook yet.
