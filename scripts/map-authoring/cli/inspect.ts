/**
 * pnpm author:inspect <tileset-name> <sample-map>
 *
 * Loads a sample .tmj and prints which local_id in <tileset-name> is used
 * at every non-zero cell. Harvest data for new palette entries.
 *
 * See docs/build-time/MAP_AUTHORING.md § "Palette seed data".
 */
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import type { TmjMap } from '../lib/index';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const [, , tilesetName, sampleMap] = process.argv;
  if (!tilesetName || !sampleMap) {
    console.error('usage: pnpm author:inspect <tileset-name> <sample-map>');
    console.error('  example: pnpm author:inspect Tileset_Ground "Village Bridge"');
    process.exit(1);
  }

  const worktreeRoot = resolve(__dirname, '..', '..', '..');
  const tilemapsRoot = join(worktreeRoot, 'public', 'assets', 'tilesets');
  // Find the .tmx
  let tmxPath: string | undefined;
  for (const pack of ['core', 'seasons', 'snow', 'desert', 'fortress', 'indoor']) {
    const candidate = join(tilemapsRoot, pack, 'Tiled', 'Tilemaps', `${sampleMap}.tmx`);
    if (existsSync(candidate)) {
      tmxPath = candidate;
      break;
    }
  }
  if (!tmxPath) {
    console.error(`sample map "${sampleMap}.tmx" not found in any pack`);
    process.exit(1);
  }

  // Convert to .tmj in /tmp
  const tmpTmj = `/tmp/inspect-${sampleMap.replace(/\s+/g, '_')}-${Date.now()}.tmj`;
  const res = spawnSync('tiled', ['--export-map', 'json', tmxPath, tmpTmj], { stdio: 'inherit' });
  if (res.status !== 0) {
    console.error('tiled CLI failed');
    process.exit(1);
  }

  const tmj: TmjMap = JSON.parse(await readFile(tmpTmj, 'utf-8'));
  // Find the firstgid for the tileset
  const tsRef = tmj.tilesets.find((t) => basename(t.source, '.tsx') === tilesetName);
  if (!tsRef) {
    console.error(`tileset "${tilesetName}" not referenced in sample "${sampleMap}"`);
    console.error('  available:', tmj.tilesets.map((t) => basename(t.source, '.tsx')).join(', '));
    process.exit(1);
  }

  const usages = new Map<number, number>(); // local_id → count
  for (const layer of tmj.layers) {
    if (layer.type !== 'tilelayer') continue;
    for (const gid of layer.data) {
      if (gid === 0) continue;
      const local = gid - tsRef.firstgid;
      if (local < 0) continue;
      const nextRef = tmj.tilesets.find(
        (t) => t.firstgid > tsRef.firstgid && t.firstgid <= gid,
      );
      if (nextRef) continue; // gid belongs to a later tileset
      usages.set(local, (usages.get(local) ?? 0) + 1);
    }
  }

  const sorted = Array.from(usages.entries()).sort((a, b) => b[1] - a[1]);
  console.log(
    `${tilesetName} in "${sampleMap}" — firstgid=${tsRef.firstgid}, ${sorted.length} distinct tiles used`,
  );
  for (const [local, count] of sorted.slice(0, 25)) {
    console.log(`  local_id=${local.toString().padStart(5)}  used ${count}x`);
  }
  if (sorted.length > 25) {
    console.log(`  ...and ${sorted.length - 25} more`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
