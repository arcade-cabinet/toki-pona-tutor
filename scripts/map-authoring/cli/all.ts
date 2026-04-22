/**
 * pnpm author:all <map-id> [--dry-run]
 * Runs validate → build → render for one map (or every spec with --all).
 */
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readdir, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { PNG } from 'pngjs';
import {
  emitTmj,
  emitTmx,
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
const tiledDir = join(worktreeRoot, 'src', 'tiled');
const speciesDir = join(worktreeRoot, 'src', 'content', 'spine', 'species');

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const allSpecs = args.includes('--all');
  const requestedSpecs = args.filter((a) => !a.startsWith('--'));
  const specs =
    allSpecs
      ? (await readdir(specsDir))
          .filter((f) => f.endsWith('.ts'))
          .map((f) => basename(f, '.ts'))
      : requestedSpecs;
  if (specs.length === 0) {
    console.error('usage: pnpm author:all <map-id> [<map-id>...] [--dry-run] | --all [--dry-run]');
    process.exit(1);
  }
  for (const id of specs) assertSafeMapId(id);

  if (!dryRun) {
    await mkdir(mapsDir, { recursive: true });
    await mkdir(tiledDir, { recursive: true });
  }
  let hadError = false;

  for (const id of specs) {
    console.log(`\n── ${id} ─────────────────────`);
    try {
      await processOne(id, { dryRun });
      console.log(dryRun ? `  ✓ dry-run done` : `  ✓ done`);
    } catch (err) {
      console.error(`  ✗ ${id} failed: ${(err as Error).message}`);
      hadError = true;
      // Continue to next map — --all mode should not abort on one broken spec.
    }
  }

  process.exit(hadError ? 1 : 0);
}

async function processOne(id: string, options: { dryRun: boolean }): Promise<void> {
  const specPath = join(specsDir, `${id}.ts`);
  // ESM dynamic import requires a file:// URL on Windows.
  const mod = (await import(pathToFileURL(specPath).href)) as { default?: MapSpec };
  if (!mod.default) {
    throw new Error(`spec "${specPath}" has no default export`);
  }
  const spec = mod.default;
  // Require the spec's id to match the requested id (which was already
  // validated by assertSafeMapId). This prevents an author from setting
  // spec.id = "../escape" and having the emitted TMJ land outside mapsDir.
  if (spec.id !== id) {
    throw new Error(
      `spec.id "${spec.id}" does not match requested id "${id}"; they must match`,
    );
  }
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

  // Build .tmj (human-editable archive under public/assets/maps/)
  const tmjPath = join(mapsDir, `${spec.id}.tmj`);
  const tmj = emitTmj(spec, tilesets, tmjPath);
  const tmjJson = JSON.stringify(tmj, null, 2) + '\n';
  if (!options.dryRun) {
    await writeFile(tmjPath, tmjJson, 'utf-8');
  }
  console.log(`  ✓ ${options.dryRun ? 'would build' : 'built'} ${basename(tmjPath)}`);

  // Build .tmx (consumed by RPG.js v5 tiledMapFolderPlugin)
  const tmxPath = join(tiledDir, `${spec.id}.tmx`);
  const tmjForTmx = emitTmj(spec, tilesets, tmxPath, {
    tilesetSourceMode: 'runtime',
  });
  const tmxXml = emitTmx(tmjForTmx);
  if (!options.dryRun) {
    await writeFile(tmxPath, tmxXml, 'utf-8');
  }
  console.log(`  ✓ ${options.dryRun ? 'would build' : 'built'} src/tiled/${basename(tmxPath)}`);

  // Render
  const pngPath = join(mapsDir, `${spec.id}.preview.png`);
  const png = options.dryRun
    ? await renderDryRunPreview(spec.id, tmjJson, tilesets)
    : await renderTmj(tmjPath, tilesets, { overlay: true });
  if (!options.dryRun) {
    await writeFile(pngPath, PNG.sync.write(png));
  }
  console.log(`  ✓ ${options.dryRun ? 'would render' : 'rendered'} ${basename(pngPath)} (${png.width}×${png.height})`);
}

async function renderDryRunPreview(
  id: string,
  tmjJson: string,
  tilesets: Awaited<ReturnType<typeof loadTilesetsForSpec>>,
): Promise<PNG> {
  const scratchDir = await mkdtemp(join(tmpdir(), `poki-author-${id}-`));
  try {
    const scratchTmjPath = join(scratchDir, `${id}.tmj`);
    await writeFile(scratchTmjPath, tmjJson, 'utf-8');
    return await renderTmj(scratchTmjPath, tilesets, { overlay: true });
  } finally {
    await rm(scratchDir, { recursive: true, force: true });
  }
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
