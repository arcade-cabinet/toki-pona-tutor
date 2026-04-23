/**
 * pnpm author:verify — enforcement gate for the map-authoring contract.
 *
 * The rule: every .tmx in src/tiled/ and .tmj in public/assets/maps/ MUST be
 * a build artifact of a spec under scripts/map-authoring/specs/. Hand-edited
 * map artifacts are forbidden.
 *
 * This script is the prebuild + CI gate. Fails (exit 1) if:
 *   (a) src/tiled/<id>.tmx or public/assets/maps/<id>.tmj exists with no
 *       corresponding specs/<id>.ts
 *   (b) specs/<id>.ts exists with no emitted .tmx or .tmj
 *   (c) the current spec would emit a .tmx or .tmj that differs from what's on
 *       disk — meaning someone hand-edited the file or forgot to rebuild
 *
 * Silence is success. To fix drift, run `pnpm author:all --all`.
 */
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
// Import from specific modules (not the barrel) so verify does not pull in
// the renderer — which depends on `canvas` (native bindings). CI runs this
// script during `pnpm validate` without building canvas.
import { emitTmj } from '../lib/emitter';
import { emitTmx } from '../lib/tmx-emitter';
import { loadTilesetsForSpec } from '../lib/loader';
import type { MapSpec } from '../lib/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const worktreeRoot = resolve(__dirname, '..', '..', '..');
const specsDir = join(worktreeRoot, 'scripts', 'map-authoring', 'specs');
const tiledDir = join(worktreeRoot, 'src', 'tiled');
const mapsDir = join(worktreeRoot, 'public', 'assets', 'maps');

async function main(): Promise<void> {
    const errors: string[] = [];

    const specFiles = existsSync(specsDir)
        ? (await readdir(specsDir)).filter((f) => f.endsWith('.ts'))
        : [];
    const tmxFiles = existsSync(tiledDir)
        ? (await readdir(tiledDir)).filter((f) => f.endsWith('.tmx'))
        : [];
    const tmjFiles = existsSync(mapsDir)
        ? (await readdir(mapsDir)).filter((f) => f.endsWith('.tmj'))
        : [];

    const specIds = new Set(specFiles.map((f) => basename(f, '.ts')));
    const tmxIds = new Set(tmxFiles.map((f) => basename(f, '.tmx')));
    const tmjIds = new Set(tmjFiles.map((f) => basename(f, '.tmj')));

    // (a) emitted artifact with no spec — hand-authored/stale map
    for (const id of tmxIds) {
        if (!specIds.has(id)) {
            errors.push(
                `src/tiled/${id}.tmx has no matching spec at scripts/map-authoring/specs/${id}.ts — hand-authored maps are forbidden. Author a spec + run pnpm author:build ${id}, or delete the .tmx if the map is retired.`,
            );
        }
    }
    for (const id of tmjIds) {
        if (!specIds.has(id)) {
            errors.push(
                `public/assets/maps/${id}.tmj has no matching spec at scripts/map-authoring/specs/${id}.ts — hand-authored map archives are forbidden. Author a spec + run pnpm author:build ${id}, or delete the .tmj if the map is retired.`,
            );
        }
    }

    // (b) spec with missing emitted artifacts — stale spec, or forgot to build
    for (const id of specIds) {
        if (!tmxIds.has(id)) {
            errors.push(
                `scripts/map-authoring/specs/${id}.ts exists but src/tiled/${id}.tmx is missing. Run \`pnpm author:build ${id}\`.`,
            );
        }
        if (!tmjIds.has(id)) {
            errors.push(
                `scripts/map-authoring/specs/${id}.ts exists but public/assets/maps/${id}.tmj is missing. Run \`pnpm author:build ${id}\`.`,
            );
        }
    }

    // (c) drift — spec would emit different artifacts than what's on disk
    for (const id of specIds) {
        if (!tmxIds.has(id) && !tmjIds.has(id)) continue;
        const specPath = join(specsDir, `${id}.ts`);
        const mod = (await import(pathToFileURL(specPath).href)) as { default?: MapSpec };
        const spec = mod.default;
        if (!spec) {
            errors.push(`specs/${id}.ts has no default export`);
            continue;
        }
        if (spec.id !== id) {
            errors.push(`specs/${id}.ts declares spec.id="${spec.id}" — must match filename`);
            continue;
        }
        const tilesets = await loadTilesetsForSpec(spec, worktreeRoot);
        if (tmjIds.has(id)) {
            const tmjPath = join(mapsDir, `${id}.tmj`);
            const expected = JSON.stringify(emitTmj(spec, tilesets, tmjPath), null, 2) + '\n';
            const actual = await readFile(tmjPath, 'utf-8');
            if (expected !== actual) {
                errors.push(
                    `public/assets/maps/${id}.tmj is out of sync with its spec. Run \`pnpm author:build ${id}\` to regenerate. If you hand-edited the .tmj — STOP, those edits belong in scripts/map-authoring/specs/${id}.ts.`,
                );
            }
        }
        if (tmxIds.has(id)) {
            const tmxPath = join(tiledDir, `${id}.tmx`);
            const tmjForTmx = emitTmj(spec, tilesets, tmxPath, {
                tilesetSourceMode: 'runtime',
            });
            const expected = emitTmx(tmjForTmx);
            const actual = await readFile(tmxPath, 'utf-8');
            if (expected !== actual) {
                errors.push(
                    `src/tiled/${id}.tmx is out of sync with its spec. Run \`pnpm author:build ${id}\` to regenerate. If you hand-edited the .tmx — STOP, those edits belong in scripts/map-authoring/specs/${id}.ts.`,
                );
            }
        }
    }

    if (errors.length > 0) {
        console.error('[author:verify] FAIL — map-authoring contract violated:');
        for (const e of errors) console.error(`  • ${e}`);
        process.exit(1);
    }

    console.log(
        `[author:verify] ✓ ${specIds.size} spec(s) in sync with src/tiled/*.tmx and public/assets/maps/*.tmj — map contract holds`,
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
