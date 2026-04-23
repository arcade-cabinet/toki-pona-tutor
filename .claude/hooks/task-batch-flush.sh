#!/usr/bin/env bash
# task-batch-flush.sh — flushes batch state to disk and publishes a
# human/agent-readable snapshot to .remember/now.md.
#
# Fires on PreCompact and Stop. Safe to re-run; idempotent.
# Exits 0 on every path — never block the hook pipeline.

set -euo pipefail

REPO="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
STATE_DIR="$REPO/.claude/state/task-batch"
REMEMBER_DIR="$REPO/.remember"
mkdir -p "$STATE_DIR" "$REMEMBER_DIR"

STAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "$STAMP" > "$STATE_DIR/.last-flush"

# Find the most recently modified batch state file.
LATEST_STATE="$(ls -t "$STATE_DIR"/*.json 2>/dev/null | head -1 || true)"
if [ -z "${LATEST_STATE}" ] || [ ! -f "$LATEST_STATE" ]; then
  exit 0
fi

# Publish a terse snapshot into .remember/now.md — this is what a fresh
# agent sees when it next enters the repo. Kept short.
{
  echo "# now — $(basename "$LATEST_STATE" .json)"
  echo ""
  echo "Last flushed: $STAMP"
  echo "State file: \`.claude/state/task-batch/$(basename "$LATEST_STATE")\`"
  echo ""
  if command -v jq >/dev/null 2>&1; then
    echo "## Progress"
    echo ""
    jq -r '
      "- Completed: \(.completed | length)",
      "- Pending:   \(.pending | length)",
      "- Failed:    \(.failed | length)",
      "- Blocked:   \(.blocked_on_external // [] | length)",
      "- Current:   \(.current_task_id // "none")"
    ' "$LATEST_STATE"
    echo ""
    echo "## Pending"
    echo ""
    jq -r '.pending[]? | "- **\(.id)** — \(.description)"' "$LATEST_STATE"
    echo ""
    echo "## Blocked on external"
    echo ""
    jq -r '.blocked_on_external[]? | "- **\(.id)** — \(.reason)"' "$LATEST_STATE"
  else
    echo "(jq not available — raw state at \`$LATEST_STATE\`)"
  fi
  echo ""
  echo "## Git"
  echo ""
  echo "- Branch: $(git branch --show-current 2>/dev/null || echo detached)"
  echo "- HEAD:   $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
  echo "- Open PRs: $(gh pr list --state open --json number --jq '. | length' 2>/dev/null || echo unknown)"
} > "$REMEMBER_DIR/now.md.tmp" 2>/dev/null || true

mv "$REMEMBER_DIR/now.md.tmp" "$REMEMBER_DIR/now.md" 2>/dev/null || true

exit 0
