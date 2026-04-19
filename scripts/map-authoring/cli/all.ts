/**
 * pnpm author:all <map-id>
 * Runs validate → build → render for one map (or every spec with --all).
 */
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { PNG } from 'pngjs';
import {
  emitTmj,
  loadTilesetsForSpec,
  renderTmj,
  validateSpec,
} from '../lib/index';
import type { MapSpec, ValidationIssue } from '../lib/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const worktreeRoot = resolve(__dirname, '..', '..', '..');

function assertSafeMapId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    console.error(
      `invalid map id "${id}" — only alphanumerics, underscore, and dash are allowed`,
    );
    process.exit(1);
  }
}
const specsDir = join(worktreeRoot, 'scripts', 'map-authoring', 'specs');
const mapsDir = join(worktreeRoot, 'public', 'assets', 'maps');
const speciesDir = join(worktreeRoot, 'src', 'content', 'spine', 'species');

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const specs =
    args[0] === '--all'
      ? (await readdir(specsDir))
          .filter((f) => f.endsWith('.ts'))
          .map((f) => basename(f, '.ts'))
      : args.filter((a) => !a.startsWith('--'));
  if (specs.length === 0) {
    console.error('usage: pnpm author:all <map-id> [<map-id>...] | --all');
    process.exit(1);
  }
  for (const id of specs) assertSafeMapId(id);

  await mkdir(mapsDir, { recursive: true });
  let hadError = false;

  for (const id of specs) {
    console.log(`\n── ${id} ─────────────────────`);
    try {
      await processOne(id);
      console.log(`  ✓ done`);
    } catch (err) {
      console.error(`  ✗ ${id} failed: ${(err as Error).message}`);
      hadError = true;
      // Continue to next map — --all mode should not abort on one broken spec.
    }
  }

  process.exit(hadError ? 1 : 0);
}

async function processOne(id: string): Promise<void> {
  const specPath = join(specsDir, `${id}.ts`);
  // ESM dynamic import requires a file:// URL on Windows.
  const mod = (await import(pathToFileURL(specPath).href)) as { default?: MapSpec };
  if (!mod.default) {
    throw new Error(`spec "${specPath}" has no default export`);
  }
  const spec = mod.default;
  const tilesets = await loadTilesetsForSpec(spec, worktreeRoot);

  // Validate
  const speciesLookup = (sid: string): unknown | null =>
    existsSync(join(speciesDir, `${sid}.json`)) ? { id: sid } : null;
  const report = await validateSpec(spec, tilesets, speciesLookup);
  for (const issue of report.issues) printIssue(issue);
  if (!report.ok) {
    throw new Error('validation failed');
  }
  console.log(`  ✓ validated`);

  // Build
  const tmjPath = join(mapsDir, `${spec.id}.tmj`);
  const tmj = emitTmj(spec, tilesets, tmjPath);
  await writeFile(tmjPath, JSON.stringify(tmj, null, 2) + '\n', 'utf-8');
  console.log(`  ✓ built ${basename(tmjPath)}`);

  // Render
  const png = await renderTmj(tmjPath, tilesets, { overlay: true });
  const pngPath = join(mapsDir, `${spec.id}.preview.png`);
  await writeFile(pngPath, PNG.sync.write(png));
  console.log(`  ✓ rendered ${basename(pngPath)} (${png.width}×${png.height})`);
}

function printIssue(issue: ValidationIssue): void {
  const tag = issue.severity === 'error' ? '  ✗' : '  !';
  const loc = issue.at
    ? ` @ ${Object.entries(issue.at).map(([k, v]) => `${k}=${v}`).join(' ')}`
    : '';
  console[issue.severity === 'error' ? 'error' : 'warn'](
    `${tag} [${issue.code}] ${issue.message}${loc}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
