#!/usr/bin/env bash
# task-batch-orient.sh — SessionStart hook.
#
# On every new session in this repo, prints the current batch state so
# the session has immediate context without re-reading every file.
# Exits 0 always; stdout is surfaced to the agent via the hook output.

set -euo pipefail

REPO="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
STATE_DIR="$REPO/.claude/state/task-batch"
NOW_FILE="$REPO/.remember/now.md"

echo "=== Rivers Reckoning — batch orient ==="

# Prefer the cached snapshot; fall back to jq directly over state.
if [ -f "$NOW_FILE" ]; then
  cat "$NOW_FILE"
  exit 0
fi

LATEST_STATE="$(ls -t "$STATE_DIR"/*.json 2>/dev/null | head -1 || true)"
if [ -z "${LATEST_STATE}" ] || [ ! -f "$LATEST_STATE" ]; then
  echo "No active batch state."
  exit 0
fi

if command -v jq >/dev/null 2>&1; then
  jq -r '
    "batch_id: \(.batch_id)",
    "completed: \(.completed | length)",
    "pending: \(.pending | length)",
    "failed: \(.failed | length)",
    "blocked: \(.blocked_on_external // [] | length)",
    "\nPENDING:",
    (.pending[]? | "  - \(.id): \(.description)"),
    "\nBLOCKED:",
    (.blocked_on_external[]? | "  - \(.id): \(.reason)")
  ' "$LATEST_STATE"
fi

exit 0
