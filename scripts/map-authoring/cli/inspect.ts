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
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
/**
 * `inspect` consumes TMJs from two sources: our own emitter (which writes
 * embedded tilesets) and `tiled --export-map json` (which writes external
 * tilesets with a `source` field). The shape we look at here is the
 * loose union of both — type it locally instead of constraining to our
 * own TmjMap.
 */
type LooseTmjTilesetRef = { firstgid: number; source?: string; name?: string };
type LooseTmjLayer =
  | { type: 'tilelayer'; data: number[] }
  | { type: 'objectgroup' };
interface LooseTmj {
  tilesets: LooseTmjTilesetRef[];
  layers: LooseTmjLayer[];
}

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
  // Find the .tmx — walk every pack dir under tilemapsRoot so we don't
  // drift as packs are added/removed. Same strategy as loader.ts.
  const packs = existsSync(tilemapsRoot)
    ? (await readdir(tilemapsRoot)).filter((d) => !d.startsWith('.')).sort()
    : [];
  let tmxPath: string | undefined;
  for (const pack of packs) {
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

  // Convert to .tmj in an OS-appropriate temp dir that we clean up on exit.
  // /tmp is hard-coded on POSIX — Windows uses %TEMP%; tmpdir() handles both.
  const scratchDir = mkdtempSync(join(tmpdir(), 'poki-inspect-'));
  const tmpTmj = join(
    scratchDir,
    `${sampleMap.replace(/\s+/g, '_')}.tmj`,
  );
  let tmj: LooseTmj;
  try {
    const res = spawnSync('tiled', ['--export-map', 'json', tmxPath, tmpTmj], {
      stdio: 'inherit',
    });
    if (res.error || res.status === null) {
      console.error(
        `could not execute \`tiled\` — is Tiled installed? \`brew install --cask tiled\``,
      );
      if (res.error) console.error(`  cause: ${res.error.message}`);
      process.exit(1);
    }
    if (res.status !== 0) {
      console.error(`tiled CLI exited with status ${res.status} converting ${tmxPath}`);
      process.exit(res.status);
    }
    tmj = JSON.parse(await readFile(tmpTmj, 'utf-8'));
  } finally {
    // Remove the scratch dir regardless of outcome. `force: true` swallows
    // ENOENT if something deleted it already.
    rmSync(scratchDir, { recursive: true, force: true });
  }
  // Find the firstgid for the tileset. `tiled --export-map json` writes
  // external tilesets as `{ firstgid, source }`, while our own emitter
  // embeds them as `{ firstgid, name, image, ... }` — handle both shapes.
  const refStem = (t: { source?: string; name?: string }) =>
    t.source ? basename(t.source, '.tsx') : (t.name ?? '');
  const tsRef = tmj.tilesets.find((t) => refStem(t) === tilesetName);
  if (!tsRef) {
    console.error(`tileset "${tilesetName}" not referenced in sample "${sampleMap}"`);
    console.error('  available:', tmj.tilesets.map(refStem).join(', '));
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
