/**
 * Map preview visual regression.
 *
 * The TMJ/TMX map artifacts already prove structural sync through
 * `pnpm author:verify`; this test covers the visual artifact side by
 * re-rendering every committed TMJ preview and pixel-diffing it against
 * the checked-in PNG.
 */
import { describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import {
    loadTilesetsForSpec,
    renderTmj,
    type MapSpec,
} from '../../scripts/map-authoring/lib';

const worktreeRoot = resolve(__dirname, '../..');
const specsDir = join(worktreeRoot, 'scripts/map-authoring/specs');
const mapsDir = join(worktreeRoot, 'public/assets/maps');

type PngDiff = {
    diffPixels: number;
    maxChannelDelta: number;
};

async function loadSpec(id: string): Promise<MapSpec> {
    const specPath = join(specsDir, `${id}.ts`);
    const mod = (await import(pathToFileURL(specPath).href)) as { default?: MapSpec };
    if (!mod.default) {
        throw new Error(`map-preview-regression: ${specPath} has no default export`);
    }
    return mod.default;
}

function diffPng(actual: PNG, expected: PNG): PngDiff {
    if (actual.width !== expected.width || actual.height !== expected.height) {
        return {
            diffPixels: Number.POSITIVE_INFINITY,
            maxChannelDelta: Number.POSITIVE_INFINITY,
        };
    }

    let diffPixels = 0;
    let maxChannelDelta = 0;
    for (let offset = 0; offset < actual.data.length; offset += 4) {
        let pixelDelta = 0;
        for (let channel = 0; channel < 4; channel += 1) {
            const delta = Math.abs(actual.data[offset + channel] - expected.data[offset + channel]);
            pixelDelta += delta;
            maxChannelDelta = Math.max(maxChannelDelta, delta);
        }
        if (pixelDelta > 0) {
            diffPixels += 1;
        }
    }

    return { diffPixels, maxChannelDelta };
}

describe('map preview visual regression', () => {
    it('keeps every committed preview PNG in sync with the renderer output', async () => {
        const [specFiles, previewFiles] = await Promise.all([
            readdir(specsDir),
            readdir(mapsDir),
        ]);
        const specIds = specFiles
            .filter((file) => file.endsWith('.ts'))
            .map((file) => basename(file, '.ts'))
            .sort();
        const previewIds = previewFiles
            .filter((file) => file.endsWith('.preview.png'))
            .map((file) => file.replace(/\.preview\.png$/, ''))
            .sort();

        expect(previewIds).toEqual(specIds);

        const failures: string[] = [];
        for (const id of specIds) {
            const spec = await loadSpec(id);
            const tilesets = await loadTilesetsForSpec(spec, worktreeRoot);
            const actual = await renderTmj(join(mapsDir, `${id}.tmj`), tilesets, { overlay: true });
            const expected = PNG.sync.read(await readFile(join(mapsDir, `${id}.preview.png`)));
            const diff = diffPng(actual, expected);

            if (actual.width !== expected.width || actual.height !== expected.height) {
                failures.push(
                    `${id}: expected ${expected.width}x${expected.height}, rendered ${actual.width}x${actual.height}`,
                );
                continue;
            }

            if (diff.diffPixels > 0) {
                failures.push(
                    `${id}: ${diff.diffPixels} pixel(s) differ, max channel delta ${diff.maxChannelDelta}`,
                );
            }
        }

        expect(
            failures,
            `map previews drifted from renderer output; run pnpm author:all --all and inspect the preview PNG diff:\n${failures.join('\n')}`,
        ).toEqual([]);
    });
});
