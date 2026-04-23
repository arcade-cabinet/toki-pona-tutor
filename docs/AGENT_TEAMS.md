---
title: Agent Teams
updated: 2026-04-22
status: current
domain: ops
---

# Agent Teams

Rivers Reckoning can be worked on by parallel agents only when ownership is explicit and file sets do not collide.

## Ground Rules

- Docs define scope before tests and code.
- Use feature branches and pull requests.
- Do not edit generated map/content artifacts by hand.
- Do not reintroduce the retired language/corpus layer.
- Do not revert another agent's changes unless explicitly asked.
- Keep write ownership disjoint when multiple workers are active.

## Useful Work Slices

- **Map worker:** owns one `scripts/map-authoring/specs/<map_id>.ts` plus regenerated artifacts for that map.
- **Content worker:** owns a bounded set of spine dialog/species/item/quest JSON files.
- **Runtime worker:** owns a narrow module or config adapter.
- **Docs worker:** owns specific docs and updates tests only when the documented contract changes.
- **Verification worker:** runs gates and reports exact failures without rewriting implementation files.

## Required Handoff

Each worker should report:

- files changed
- commands run
- failures or skipped gates
- remaining risks
- any generated artifacts that intentionally changed

If visual output changes, include the relevant visual-audit/golden-path artifact names.
