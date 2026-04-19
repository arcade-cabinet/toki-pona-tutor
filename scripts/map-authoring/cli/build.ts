/**
 * pnpm author:build <map-id> — spec → .tmj
 *
 * Reads scripts/map-authoring/specs/<map-id>.ts (default export: MapSpec),
 * loads every tileset it references, emits public/assets/maps/<map-id>.tmj.
 */
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { emitTmj, loadTilesetsForSpec } from '../lib/index';
import type { MapSpec } from '../lib/index';

const __dirname = dirname(fileURLToPath(import.meta.url));

function assertSafeMapId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    console.error(
      `invalid map id "${id}" — only alphanumerics, underscore, and dash are allowed`,
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const [, , mapId] = process.argv;
  if (!mapId) {
    console.error('usage: pnpm author:build <map-id>');
    process.exit(1);
  }
  assertSafeMapId(mapId);

  const worktreeRoot = resolve(__dirname, '..', '..', '..');
  const specPath = join(worktreeRoot, 'scripts', 'map-authoring', 'specs', `${mapId}.ts`);
  // ESM dynamic import requires a file:// URL on Windows (filesystem paths
  // with backslashes fail with ERR_UNSUPPORTED_ESM_URL_SCHEME).
  const mod = (await import(pathToFileURL(specPath).href)) as { default?: MapSpec };
  const spec = mod.default;
  if (!spec) {
    console.error(`spec "${specPath}" has no default export`);
    process.exit(1);
  }

  const tilesets = await loadTilesetsForSpec(spec, worktreeRoot);
  const outDir = join(worktreeRoot, 'public', 'assets', 'maps');
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, `${spec.id}.tmj`);

  const tmj = emitTmj(spec, tilesets, outPath);
  await writeFile(outPath, JSON.stringify(tmj, null, 2) + '\n', 'utf-8');

  console.log(`✓ built ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
