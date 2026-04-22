---
title: Corpus Sources Brief
updated: 2026-04-22
status: current
domain: content
---

# Corpus Sources Brief

Use this brief only when a needed user-facing line cannot be rewritten to pass `pnpm validate-tp` under `docs/WRITING_RULES.md`.

## Current Corpus

The current source is the vendored Tatoeba Toki Pona ↔ English corpus:

- Data: `src/content/corpus/tatoeba.json`
- Attribution: `src/content/corpus/LICENSE.md`
- Fetch script: `scripts/fetch-tatoeba-corpus.mjs`
- Current pair count: 37,666
- License: CC BY 2.0 FR, with attribution recorded in `src/content/corpus/LICENSE.md`

## Adding A Source

1. Confirm the source is a published Toki Pona ↔ English parallel corpus.
2. Confirm the license permits redistribution in this repository and document the exact license.
3. Add or update a deterministic fetch/build script under `scripts/`.
4. Record attribution in `src/content/corpus/LICENSE.md`.
5. Regenerate the corpus artifact.
6. Run `pnpm validate-tp`, `pnpm build-spine`, and `pnpm test:unit`.

## Rejection Rules

- Do not add a source without explicit redistribution rights.
- Do not copy ad hoc translations from chats, forums, or private notes.
- Do not hand-author Toki Pona just to satisfy a line.
- Do not loosen the validator without first updating `docs/WRITING_RULES.md` and tests.
