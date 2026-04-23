#!/usr/bin/env bash
# keep-on-task.sh — Stop hook that keeps the batch advancing.
#
# On every Stop event:
#   1. Flush the batch state snapshot to .remember/now.md.
#   2. Check whether the current batch has pending tasks.
#   3. If yes, exit 2 with a stderr message that tells the agent
#      what the next task is. The Claude Code harness feeds the
#      stderr back to the model, blocking the Stop and forcing the
#      next turn to pick up the work.
#   4. If no pending tasks (batch is fully drained), exit 0 cleanly.
#
# Guards:
#   - Only engages when a git repo contains the batch state file.
#   - Only blocks if there's real work — never loops on an empty state.
#   - Reads a per-batch `keep_on_task: false` config key to let the
#     user opt out mid-batch without editing this script.
#   - Throttles: if the last hook message was emitted in the past 60s,
#     suppress so we don't spam a single turn.

set -uo pipefail

REPO="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
STATE_DIR="$REPO/.claude/state/task-batch"
REMEMBER_DIR="$REPO/.remember"
KOT_STAMP="$STATE_DIR/.last-keep-on-task"

# Always flush first so .remember/now.md is fresh for the next session
# even if we don't block this Stop.
if [ -x "$REPO/.claude/hooks/task-batch-flush.sh" ]; then
  bash "$REPO/.claude/hooks/task-batch-flush.sh" >/dev/null 2>&1 || true
fi

LATEST_STATE="$(ls -t "$STATE_DIR"/*.json 2>/dev/null | head -1 || true)"
if [ -z "${LATEST_STATE}" ] || [ ! -f "$LATEST_STATE" ]; then
  exit 0
fi

# Opt-out gate.
if command -v jq >/dev/null 2>&1; then
  OPTED_OUT="$(jq -r '.keep_on_task // true' "$LATEST_STATE" 2>/dev/null || echo true)"
  if [ "$OPTED_OUT" = "false" ]; then
    exit 0
  fi
fi

# Throttle to 60s between blocks so a single turn can't loop.
NOW="$(date -u +%s)"
if [ -f "$KOT_STAMP" ]; then
  LAST="$(cat "$KOT_STAMP" 2>/dev/null || echo 0)"
  if [ $((NOW - LAST)) -lt 60 ]; then
    exit 0
  fi
fi

# Count pending tasks. Exclude deps-blocked rows (their `dependencies`
# list contains IDs that aren't in .completed), and ignore rows marked
# superseded.
if ! command -v jq >/dev/null 2>&1; then
  # No jq → can't safely decide; let Stop pass.
  exit 0
fi

NEXT_TASK="$(jq -r '
  (.completed // []) as $done
  | (.pending // [])
  | map(select((.superseded_by // "") == ""))
  | map(select(
      (.dependencies // []) as $deps
      | ($deps | map(. as $d | $done | any(.id == $d)) | all)
    ))
  | sort_by(.priority // 99)
  | .[0] // empty
' "$LATEST_STATE" 2>/dev/null)"

if [ -z "$NEXT_TASK" ] || [ "$NEXT_TASK" = "null" ]; then
  # Batch is drained — no reason to block.
  exit 0
fi

TASK_ID="$(echo "$NEXT_TASK" | jq -r '.id')"
TASK_DESC="$(echo "$NEXT_TASK" | jq -r '.description')"
TASK_NOTE="$(echo "$NEXT_TASK" | jq -r '.note // ""')"

# Record when we blocked so the throttle above can engage next time.
echo "$NOW" > "$KOT_STAMP"

# Write the block message to stderr — this is what the harness feeds
# back to the next turn.
{
  echo "=== keep-on-task hook: batch is not done ==="
  echo ""
  echo "Next task: $TASK_ID — $TASK_DESC"
  if [ -n "$TASK_NOTE" ] && [ "$TASK_NOTE" != "null" ]; then
    echo "Note: $TASK_NOTE"
  fi
  echo ""
  echo "Batch state:  .claude/state/task-batch/$(basename "$LATEST_STATE")"
  echo "Snapshot:     .remember/now.md"
  echo ""
  echo "Claim the task:"
  echo "  1. branch off main"
  echo "  2. implement the change"
  echo "  3. run gates (pnpm validate && pnpm typecheck && pnpm test)"
  echo "  4. commit, push, open PR with gh pr create"
  echo "  5. enable auto-merge (gh pr merge <n> --squash --auto)"
  echo "  6. update the batch state file and re-run task-batch-flush.sh"
  echo ""
  echo "Direction: Rivers Reckoning 1.0. Story is the asset that lasts."
  echo "Architecture ownership is yours. The user sets direction, not tasks."
  echo ""
  echo "To opt out of keep-on-task for this batch, set keep_on_task=false"
  echo "in $LATEST_STATE."
} 1>&2

exit 2
