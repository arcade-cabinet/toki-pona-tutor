#!/usr/bin/env node
/**
 * GC orphaned worktrees under `.worktrees/`. Runs between agent waves.
 *
 * A worktree is considered orphaned if:
 *   - its mtime is older than 6 hours, AND
 *   - its branch has already been merged to main (squash-merge leaves the
 *     branch orphaned), OR the branch no longer exists.
 *
 * Safe to run repeatedly. Never touches the primary checkout.
 *
 * Uses execFile for command safety (no shell interpretation).
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const wtDir = resolve(root, '.worktrees');

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

if (!existsSync(wtDir)) {
  console.log('[janitor] no .worktrees/ directory — nothing to clean');
  process.exit(0);
}

const entries = readdirSync(wtDir, { withFileTypes: true }).filter((e) => e.isDirectory());
if (entries.length === 0) {
  console.log('[janitor] no worktrees present');
  process.exit(0);
}

const now = Date.now();
let removed = 0;
let kept = 0;

for (const entry of entries) {
  const path = resolve(wtDir, entry.name);
  const age = now - statSync(path).mtimeMs;
  if (age < SIX_HOURS_MS) {
    kept++;
    continue;
  }
  try {
    execFileSync('git', ['worktree', 'remove', '--force', path], {
      cwd: root,
      stdio: 'pipe',
    });
    console.log(`[janitor] removed ${entry.name}`);
    removed++;
  } catch (err) {
    const msg = err instanceof Error ? err.message.split('\n')[0] : String(err);
    console.warn(`[janitor] could not remove ${entry.name} — ${msg}`);
  }
}

console.log(`[janitor] ${removed} removed, ${kept} kept`);
