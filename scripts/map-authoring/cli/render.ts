/**
 * pnpm author:render <map-id> [--grid] [--no-overlay]
 * Renders public/assets/maps/<map-id>.tmj → public/assets/maps/<map-id>.preview.png
 */
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { renderTmj, loadTilesetsForSpec } from '../lib/index';
import type { MapSpec } from '../lib/index';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Reject map ids that contain path separators or traversal sequences.
 * Keeps CLI inputs from reaching outside scripts/map-authoring/specs/.
 */
function assertSafeMapId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    console.error(
      `invalid map id "${id}" — only alphanumerics, underscore, and dash are allowed`,
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mapId = args.find((a) => !a.startsWith('--'));
  const grid = args.includes('--grid');
  const overlay = !args.includes('--no-overlay');

  if (!mapId) {
    console.error('usage: pnpm author:render <map-id> [--grid] [--no-overlay]');
    process.exit(1);
  }
  assertSafeMapId(mapId);

  const worktreeRoot = resolve(__dirname, '..', '..', '..');
  const specPath = join(worktreeRoot, 'scripts', 'map-authoring', 'specs', `${mapId}.ts`);
  const mod = (await import(specPath)) as { default?: MapSpec };
  if (!mod.default) {
    console.error(`spec "${specPath}" has no default export`);
    process.exit(1);
  }
  const tilesets = await loadTilesetsForSpec(mod.default, worktreeRoot);

  const tmjPath = join(worktreeRoot, 'public', 'assets', 'maps', `${mapId}.tmj`);
  const png = await renderTmj(tmjPath, tilesets, { grid, overlay });

  const outPath = join(worktreeRoot, 'public', 'assets', 'maps', `${mapId}.preview.png`);
  const buf = PNG.sync.write(png);
  await writeFile(outPath, buf);
  console.log(`✓ rendered ${outPath} (${png.width}×${png.height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
