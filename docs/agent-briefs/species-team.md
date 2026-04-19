---
title: Agent Brief — Species Team
updated: 2026-04-19
status: current
domain: ops
---

# Species team agent brief

You're authoring creature species JSON for Toki Town. You write files under `src/content/spine/species/` that validate against `src/content/schema/species.ts`.

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

- `id` — snake_case, unique across all species
- `name` — `{ en: <single-word> }` using a canonical TP dictionary word. Single-word `en` is dictionary-exempt; just pick a real word.
- `description` — `{ en: <short EN line> }`. Multi-word — must round-trip through Tatoeba. Keep it 3–6 words.
- `type` — one of the TypeId values
- `base_stats` — four integers; see per-tier guidance below
- `learnset` — array of `{ level, move_id }`, at least one at level 1. Move ids must match an actual move in `src/content/spine/moves/*.json`
- `catch_rate` — 0.05 (legendary) to 0.45 (common)
- `xp_yield` — 20 for common, 50 for set-piece guardians
- `sprite_frame` — pick a plausible frame from `dungeon_packed.png` (100–130 range for creatures)
- `portrait_src` — optional; omit if not sourcing an Animal-Pack portrait

### Stat tier guidance

| Tier | HP | Atk | Def | Spd | Use |
|------|----|-----|-----|-----|-----|
| common | 30–42 | 30–42 | 25–38 | 30–45 | tall-grass fodder |
| uncommon | 42–52 | 42–52 | 38–48 | 40–55 | mid-route |
| starter | 48–58 | 45–55 | 42–52 | 40–55 | jan Sewi's trio |
| guardian | 60–80 | 55–70 | 55–70 | 50–70 | jan-lawa's ace |

### Naming rules

- `id` is snake_case: `soweli_lili`, `pipi_loje`, `kala_suli`
- `name.en` is a **single Toki Pona word** — `soweli`, `waso`, `pipi`, `akesi`, `kala`, etc. These are dictionary-vetted; no Tatoeba lookup needed.
- Multi-word distinctions go in the id and description, not the name — so all foxy starters can share `name.en: "soweli"` while having distinct ids.

## Validate loop

After every few files:

```bash
pnpm validate-tp          # must be clean (your files, not the legacy warning)
node scripts/build-spine.mjs   # must compile
pnpm typecheck            # must be clean
```

If validate-tp flags an English line you wrote, rewrite it to match one of the printed suggestions from Tatoeba. The whole point: never hand-author TP.

## PR

```bash
git add -A
git commit -m "feat(content): species team <your-domain>"
git push -u origin "$BRANCH"
gh pr create --title "feat(content): species team <your-domain>" --body "<describe your 4-6 species>"
```

## Stall + self-review + merge

See `docs/AGENT_TEAMS.md`. Summary:

- Wait ≥ 10 min after green CI AND at least one non-rate-limit reviewer comment
- Self-review: re-read your diff against this brief. Stubs? TODOs? `pnpm validate-tp` + `pnpm build-spine` + `pnpm typecheck` all green?
- High-confidence: `gh pr merge <n> --squash --admin`, then `cd ../.. && git worktree remove .worktrees/$BRANCH`
- Low-confidence: add `needs-human-review` label, post specific question, stop

## Guardrails

- Edits only inside your worktree
- Never hand-author TP — always let the pipeline resolve it
- Never force-push to main
- Never skip hooks (`--no-verify`)
- Always squash-merge
