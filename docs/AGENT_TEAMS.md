---
title: Agent Teams Playbook
updated: 2026-04-22
status: current
domain: ops
---

# Running agent teams in this repo

poki soweli is authored by a human orchestrator plus a small fleet of content-writing subagents running in parallel. This doc is the contract between the orchestrator and the teammates: how they isolate work, how they review, when they self-merge, when they escalate.

## Ground truth on the Claude Code team primitives

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set in `~/.claude/settings.json` on this machine. Verify `TeamCreate`, `TeamDelete`, and `SendMessage` are present in the active Claude Code session before starting a wave.
- **Known bug (#37549, observed locally with Claude Code 2.1.98):** spawning an `Agent` with both `team_name` and `isolation: "worktree"` can silently *ignore* the isolation flag. The teammate may land in the primary checkout on the current branch. Re-test after Claude Code upgrades, but keep the worktree prologue mandatory unless the bug is proven fixed.
- **Workaround (the policing model):** every teammate's brief opens with a worktree prologue they run before touching any files. The prologue creates a worktree from `origin/main` and `cd`s into it. The rest of the brief operates in that worktree.

This is acceptable. The isolation responsibility shifts from the framework to the teammate's opening checklist, and that checklist goes in every brief.

## The wave pattern

Content is landed in waves. Each wave is a small set of PRs that can be authored in parallel without stepping on each other.

1. **Wave 0 — Infra (orchestrator only).** Zod schemas, content pipeline, validate-tp prebuild, procgen delete. One big PR.
2. **Wave 1 — Schema audit (1 teammate).** Reads the schemas the orchestrator wrote, writes `docs/schema/*.md` reference docs, catches any holes.
3. **Wave 2 — Content fanout (up to 5 teammates parallel).**
   - species: creature species JSONs across the five types
   - moves: move JSONs keyed to types
   - region-1: ma tomo lili — starter village, jan Sewi's ceremony
   - region-2: nasin wan — first route, tall-grass encounter table
   - items: poki variants, healing items
3. **Wave 3 — Engine integration (orchestrator only).** Wire RPG.js modules to read `generated/world.json`, catch mechanics, party state, and `lipu soweli`.
4. **Wave 4 — Content fanout (more teammates).** Regions 3–6, dialog polish, balance pass, gym-master fights.

Max five teammates in flight at once. More than that strains context budgets, tangles the git remote, and multiplies review load.

## Every brief starts with the worktree prologue

Every agent brief this repo ships has this as its opening block. The agent must run it before any other work. Non-negotiable.

```bash
# WORKTREE PROLOGUE — run before any edits
BRANCH="<fill-in-your-branch-name>"
WT_PATH=".worktrees/${BRANCH}"

# Safety: confirm we are NOT operating in the main checkout
if [[ "$(git rev-parse --show-toplevel)" == "$(pwd)" && ! "$(pwd)" == *"/.worktrees/"* ]]; then
  echo "Setting up isolated worktree at $WT_PATH"
  git fetch origin main
  git worktree add -B "$BRANCH" "$WT_PATH" origin/main
  cd "$WT_PATH" || exit 1
fi

# Install deps (each worktree is its own pnpm install)
pnpm install --ignore-workspace

# Confirm
pwd
git branch --show-current
```

## Every brief ends with the merge checklist

Once the PR is open and CI is green, the agent runs through this before `gh pr merge`:

1. Every validator is green: `pnpm validate-tp && pnpm typecheck && pnpm build`
2. Every reviewer has either commented (with no blocking asks remaining) or rate-limited out
3. The agent has waited for 10 minutes of no new comments post-green-CI
4. Self-review: re-read the diff, check against the original brief, check for stubs/TODOs/dead code
5. Low-confidence flag? Post a comment tagging `@jbdevprimary`, add `needs-human-review` label, stop. Do not merge.
6. High-confidence? `gh pr merge <pr> --squash`, then back to the main checkout and `git worktree remove .worktrees/<branch>` to clean up.

## Stall detection heuristics

An agent knows reviewer feedback has stalled when:

- CI has been all-green for ≥ 10 minutes.
- No new comment bodies in that window (ignoring auto-generated rate-limit messages from CodeRabbit / Gemini quota notices).
- At least one reviewer from {CodeRabbit, Copilot, Amazon Q} has left actual review content (even "LGTM" counts).

If only rate-limit messages have appeared, that counts as immediate stall — move to self-review without the 10-minute wait.

## Escalation

Self-review produces two outcomes. The agent picks and commits:

- **High-confidence:** the diff matches the brief, all validators pass, nothing looks dubious. Merge.
- **Low-confidence:** something in the diff feels wrong and the agent can't resolve it alone. Post a PR comment with the specific question, add `needs-human-review` label, stop work. The orchestrator picks it up on their next check-in.

**Never ship work the agent is unsure about.** Unreviewed rollback is cheaper than merged regression.

## Orchestrator checklist for kicking off a wave

1. `git checkout main && git pull` — fresh baseline
2. `git worktree list` — confirm no orphans
3. Pick the wave's teammate briefs from `docs/agent-briefs/*.md`
4. `TeamCreate` a named team if one isn't active (name: `poki-soweli-wave-N`)
5. For each brief: `Agent({subagent_type, team_name, name, isolation: "worktree", prompt: <brief-with-worktree-prologue>})`
6. Watch PR URLs surface via SendMessage
7. Between waves, after confirming no teammate has unmerged work: `node scripts/worktree-janitor.mjs` to remove `.worktrees/` entries older than 6 hours, then `TeamDelete` the old team

## Global rules in force

The repo inherits `~/.claude/CLAUDE.md`. Every agent must respect:

- Conventional commit messages, squash-merge PRs, always PR to `main`
- Never force-push to `main`
- Never skip hooks (`--no-verify`) unless explicitly asked by a human
- Address all reviewer feedback before merge
- 300-LOC-per-file is a soft signal, not a hard cap — use judgment
- CI → release → CD workflow order
