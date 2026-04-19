/**
 * Per-tileset fixture tests.
 *
 * Each Fan-tasy pack ships ≥ 1 sample `.tmx` map. These are the golden
 * fixtures the toolchain must handle — if my parser or renderer breaks
 * on any tileset a sample uses, a test fails.
 *
 * Conversion uses the `tiled` CLI (homebrew cask). If tiled isn't on
 * PATH, conversion tests are skipped with a clear message; parse tests
 * still run against the .tmx via the parser directly.
 *
 * See docs/build-time/MAP_AUTHORING.md § "Fan-tasy sample maps are
 * per-tileset fixtures".
 */
import { afterAll, describe, expect, it } from 'vitest';
import { resolve, join } from 'node:path';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { renderTmj } from '../../scripts/map-authoring/lib/renderer';
import { parseTsx } from '../../scripts/map-authoring/lib/parser';
import type { TmjMap } from '../../scripts/map-authoring/lib/types';

const TILESETS_ROOT = resolve(__dirname, '../../public/assets/tilesets');
const TILED_AVAILABLE = (() => {
  try {
    const r = spawnSync('tiled', ['--version'], { encoding: 'utf-8' });
    return r.status === 0;
  } catch {
    return false;
  }
})();

// Track every temp dir created during this test file so we can clean up
// in afterAll. Keeps /tmp tidy across repeated runs.
const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

async function listSamples(pack: string): Promise<string[]> {
  const dir = join(TILESETS_ROOT, pack, 'Tiled', 'Tilemaps');
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  return entries
    .filter((f) => f.endsWith('.tmx'))
    .map((f) => join(dir, f));
}

describe('Fan-tasy pack discovery', () => {
  it('finds all 6 biome packs', async () => {
    const entries = await readdir(TILESETS_ROOT);
    const packs = entries.filter((e) => !e.startsWith('.'));
    for (const expected of ['core', 'seasons', 'snow', 'desert', 'fortress', 'indoor']) {
      expect(packs).toContain(expected);
    }
  });

  it('every pack has at least one .tmx sample', async () => {
    for (const pack of ['core', 'seasons', 'snow', 'desert', 'fortress', 'indoor']) {
      const samples = await listSamples(pack);
      expect(samples.length, `pack "${pack}" should have ≥ 1 sample`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Fan-tasy tileset parser coverage', () => {
  // For every pack, parse every .tsx in Tiled/Tilesets/. If any fails,
  // the parser has a gap — the sample maps may reference that tileset.
  for (const pack of ['core', 'seasons', 'snow', 'desert', 'fortress', 'indoor']) {
    it(`parses every .tsx in ${pack}`, async () => {
      const tsxDir = join(TILESETS_ROOT, pack, 'Tiled', 'Tilesets');
      if (!existsSync(tsxDir)) return;
      const entries = await readdir(tsxDir);
      const tsxFiles = entries.filter((f) => f.endsWith('.tsx'));
      expect(tsxFiles.length).toBeGreaterThan(0);
      for (const f of tsxFiles) {
        const path = join(tsxDir, f);
        const ts = await parseTsx(path);
        expect(ts.tileCount, `${pack}/${f}`).toBeGreaterThan(0);
        expect(ts.image.absolutePath, `${pack}/${f} image`).toBeTruthy();
        expect(existsSync(ts.image.absolutePath), `${pack}/${f} image on disk`).toBe(true);
      }
    });
  }
});

describe.skipIf(!TILED_AVAILABLE)('Fan-tasy sample round-trip', () => {
  // For each pack's first sample: convert .tmx → .tmj via tiled CLI,
  // render via our compositor, assert the PNG has expected dimensions
  // and is non-trivially populated (not entirely transparent).
  for (const pack of ['core', 'seasons', 'snow', 'desert', 'fortress', 'indoor']) {
    it(`renders a sample from ${pack}`, async () => {
      const samples = await listSamples(pack);
      if (samples.length === 0) return;
      const tmxPath = samples[0];
      const tmpDir = mkdtempSync(join(tmpdir(), `poki-fixture-${pack}-`));
      tmpDirs.push(tmpDir);
      const tmjPath = join(tmpDir, 'sample.tmj');

      const r = spawnSync('tiled', ['--export-map', 'json', tmxPath, tmjPath], {
        encoding: 'utf-8',
      });
      expect(r.status, `tiled exported ${tmxPath}`).toBe(0);
      expect(existsSync(tmjPath)).toBe(true);

      const tmj: TmjMap = JSON.parse(await readFile(tmjPath, 'utf-8'));
      // Load every tileset referenced by the .tmj
      const tilesets = [];
      for (const ref of tmj.tilesets) {
        // Tiled emits the source path relative to the .tmj; resolve it.
        const abs = resolve(tmpDir, ref.source);
        if (!existsSync(abs)) {
          // Fall back: the source path in the sample .tmx points "../Tilesets/"
          // which doesn't resolve from the tmp dir. Re-resolve relative to
          // the original .tmx location.
          const altAbs = resolve(tmxPath, '..', ref.source);
          if (existsSync(altAbs)) {
            tilesets.push(await parseTsx(altAbs));
            continue;
          }
          throw new Error(`tileset not found: ${ref.source}`);
        }
        tilesets.push(await parseTsx(abs));
      }

      // Write the .tmj to a location where the tileset paths can resolve,
      // then render.
      const fixedTmjPath = join(tmpDir, 'sample-fixed.tmj');
      // Rewrite tileset paths to absolute — the renderer looks up tilesets
      // by name, not by path, so paths don't strictly matter for this test.
      await writeFile(fixedTmjPath, JSON.stringify(tmj));

      const png = await renderTmj(fixedTmjPath, tilesets, { overlay: false });
      expect(png.width).toBe(tmj.width * tmj.tilewidth);
      expect(png.height).toBe(tmj.height * tmj.tileheight);

      // Assert the PNG is non-trivially populated: walk every pixel,
      // count opaque ones. Deterministic — no Math.random, so flaky CI
      // runs can't produce false positives from an unlucky sample set.
      let drawn = 0;
      const total = png.width * png.height;
      for (let i = 0; i < total; i++) {
        const alpha = png.data[(i << 2) + 3];
        if (alpha > 0) drawn++;
      }
      expect(drawn, `${pack} sample should have drawn pixels`).toBeGreaterThan(0);
      // Also assert a non-trivial fraction is opaque — a single lit pixel
      // would pass the above but indicate a rendering regression.
      expect(drawn / total, `${pack} sample opaque fraction`).toBeGreaterThan(0.01);
    }, 60_000);
  }
});

describe.skipIf(TILED_AVAILABLE)('tiled CLI unavailable', () => {
  it('is skipped — install `tiled` via `brew install --cask tiled` to enable round-trip tests', () => {
    expect(TILED_AVAILABLE).toBe(false);
  });
});

// Create the maps output dir so per-pack conversions don't fail setup.
await mkdir(join(TILESETS_ROOT, '..', 'maps'), { recursive: true });
