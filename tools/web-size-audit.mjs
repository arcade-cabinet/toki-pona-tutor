#!/usr/bin/env node
/**
 * T6-13: Web bundle size audit.
 *
 * Walks dist/ (the Vite build output), gzips each file, sums totals.
 * Fails with non-zero exit if the gzipped aggregate exceeds BUDGET_MB.
 *
 * Wired into ci.yml as the last step of the validate job, after `pnpm
 * build` so dist/ is populated. Local usage: `node tools/web-size-audit.mjs`.
 *
 * Tuning BUDGET_MB: the Phase-6 acceptance criterion is ≤ 10 MB gzip.
 * Startup-time cost scales roughly linearly with compressed wire size
 * on constrained mobile networks; aim well below the budget.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Current budget: soft gate at 40 MB gzip while the asset pile is still
// raw. Ratchet downward as T6-14 (asset compression) lands. The Phase-6
// goal per docs/ROADMAP.md is ≤ 10 MB gzip; TARGET_MB stays at 10 so the
// audit log always nags us about the gap until we close it.
const BUDGET_MB = 40;
const TARGET_MB = 10;
const BUDGET_BYTES = BUDGET_MB * 1024 * 1024;
const TARGET_BYTES = TARGET_MB * 1024 * 1024;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');

function walk(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else out.push(full);
    }
    return out;
}

try {
    statSync(DIST);
} catch {
    console.error(`[size-audit] dist/ missing — run \`pnpm build\` first`);
    process.exit(1);
}

const files = walk(DIST);
let totalGz = 0;
let totalRaw = 0;
const rows = [];

for (const f of files) {
    const raw = readFileSync(f);
    const gz = gzipSync(raw, { level: 9 });
    totalGz += gz.length;
    totalRaw += raw.length;
    rows.push({ path: relative(DIST, f), raw: raw.length, gz: gz.length });
}

rows.sort((a, b) => b.gz - a.gz);

const mb = (n) => (n / 1024 / 1024).toFixed(2);

console.log(`\n[size-audit] top 20 files by gzipped size:\n`);
console.log(`  ${'file'.padEnd(56)} ${'raw'.padStart(10)} ${'gzip'.padStart(10)}`);
console.log(`  ${'-'.repeat(56)} ${'-'.repeat(10)} ${'-'.repeat(10)}`);
for (const r of rows.slice(0, 20)) {
    console.log(`  ${r.path.padEnd(56)} ${mb(r.raw).padStart(10)} ${mb(r.gz).padStart(10)}`);
}

console.log(`\n[size-audit] total files: ${files.length}`);
console.log(`[size-audit] total raw:    ${mb(totalRaw)} MB`);
console.log(`[size-audit] total gzip:   ${mb(totalGz)} MB`);
console.log(`[size-audit] budget:       ${BUDGET_MB}.00 MB gzip  (CI hard fail above this)`);
console.log(`[size-audit] target:       ${TARGET_MB}.00 MB gzip  (ROADMAP T6-14 goal)`);

if (totalGz > BUDGET_BYTES) {
    console.error(`\n[size-audit] FAIL — gzipped bundle exceeds ${BUDGET_MB} MB budget by ${mb(totalGz - BUDGET_BYTES)} MB`);
    process.exit(1);
}
if (totalGz > TARGET_BYTES) {
    console.warn(`\n[size-audit] PASS (soft) — under ${BUDGET_MB} MB budget, ${mb(totalGz - TARGET_BYTES)} MB over the ${TARGET_MB} MB target (T6-14 pending)`);
} else {
    console.log(`\n[size-audit] PASS — under target by ${mb(TARGET_BYTES - totalGz)} MB`);
}
