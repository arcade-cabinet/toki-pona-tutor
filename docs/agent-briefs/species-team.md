---
title: Agent Brief — Species Team
updated: 2026-04-22
status: current
domain: ops
---

# Species team agent brief

You're authoring creature species JSON for poki soweli. You write files under `src/content/spine/species/` that validate against `src/content/schema/species.ts`.

## Worktree prologue

Run this before any edits. Non-negotiable — `isolation: "worktree"` is silently ignored for team members (bug #37549), so YOU are responsible for creating your worktree.

```bash
BRANCH="content/species-<your-domain>"
WT_PATH=".worktrees/${BRANCH}"
cd /Users/jbogaty/src/arcade-cabinet/toki-pona-tutor
if [[ "$(git rev-parse --show-toplevel)" == "$(pwd)" && ! "$(pwd)" == *"/.worktrees/"* ]]; then
  git fetch origin main
  git worktree add -B "$BRANCH" "$WT_PATH" origin/main
  cd "$WT_PATH" || exit 1
fi
pnpm install --ignore-workspace
```

Confirm with `pwd` before any file edit. If you see the main checkout path, stop and redo the prologue.

## What to author

Your brief will name a type (seli / telo / kasi / lete / wawa) or a habitat (village / route / mountain / lake / ...). Write **4–6 species** that fit that bucket.

Every species JSON must include all required fields from the Zod schema:

-   `id` — snake_case, unique across all species
-   `name` — `{ en: <single-word> }` using a canonical TP dictionary word. Single-word `en` is dictionary-exempt; just pick a real word.
-   `description` — `{ en: <short EN line> }`. Multi-word — must round-trip through Tatoeba **and** pass the writing-rules complexity scorer (rank ≤ 40). Read `docs/WRITING_RULES.md` first. Keep it 3–6 words, single clause, ends in `.`/`?`/`!`, vocabulary in the corpus top-1000.
-   `type` — one of the TypeId values
-   `base_stats` — four integers; see per-tier guidance below
-   `learnset` — array of `{ level, move_id }`, at least one at level 1. Move ids must match an actual move in `src/content/spine/moves/*.json`
-   `catch_rate` — 0.05 (legendary) to 0.45 (common)
-   `xp_yield` — current authored range is 42-95 for common, 82-120 for uncommon, and 62-300 for legendary/final-route creatures. Use the existing roster in `src/content/spine/species/` as the balance reference before adding new values.
-   `sprite` — preferred for newly curated species; include `src`, `frame_width`, `frame_height`, and at least an `idle` animation strip so `src/config/creature-sprites.ts` can register the species for encounter faces and future battler use.
-   `sprite_frame` / `portrait_src` — legacy optional fields only. Do not add them to new species unless you are deliberately preserving an old content entry while the sprite sheet is not curated yet.

### Stat tier guidance

| Tier      | HP     | Atk    | Def    | Spd   | Use                                        |
| --------- | ------ | ------ | ------ | ----- | ------------------------------------------ |
| common    | 34-62  | 34-60  | 20-72  | 18-68 | tall-grass and starter-adjacent roster     |
| uncommon  | 52-80  | 62-88  | 36-62  | 26-76 | rarer route creatures                      |
| legendary | 52-140 | 44-118 | 42-100 | 28-75 | boss/deep-route creatures, still catchable |

### Naming rules

-   `id` is snake_case: `soweli_kili`, `akesi_linja`, `kala_luka`
-   `name.en` is a **single Toki Pona word** — `soweli`, `waso`, `akesi`, `kala`, etc. These are dictionary-vetted; no Tatoeba lookup needed.
-   Multi-word distinctions go in the id and description, not the name — so all foxy starters can share `name.en: "soweli"` while having distinct ids.

## Validate loop

After every few files:

```bash
pnpm validate-tp          # must be clean
pnpm build-spine          # must compile
pnpm typecheck            # must be clean
```

If validate-tp flags an English line you wrote:

-   **Complexity flag** (rank > 40) — the message names the axes (rare words, compound clause, length). Rewrite to the rules in `docs/WRITING_RULES.md`.
-   **Corpus miss** — pick one of the printed suggestions verbatim.

Never hand-author TP. If you can't express the idea within the rules, pick a different idea.

## PR

```bash
git add -A
git commit -m "feat(content): species team <your-domain>"
git push -u origin "$BRANCH"
gh pr create --title "feat(content): species team <your-domain>" --body "<describe your 4-6 species>"
```

## Stall + self-review + merge

See `docs/AGENT_TEAMS.md`. Summary:

-   Wait ≥ 10 min after green CI AND at least one non-rate-limit reviewer comment
-   Self-review: re-read your diff against this brief. Stubs? TODOs? `pnpm validate-tp` + `pnpm build-spine` + `pnpm typecheck` all green?
-   High-confidence: `gh pr merge <n> --squash`, then `cd ../.. && git worktree remove .worktrees/$BRANCH`
-   Low-confidence: add `needs-human-review` label, post specific question, stop

## Guardrails

-   Edits only inside your worktree
-   Never hand-author TP — always let the pipeline resolve it
-   Never force-push to main
-   Never skip hooks (`--no-verify`)
-   Always squash-merge
