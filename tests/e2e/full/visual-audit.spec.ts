import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';

type MapsConfig = {
    maps: Record<string, {
        label: string;
        safe_spawn?: { x: number; y: number };
    }>;
};

type TmjObject = {
    type?: string;
    x?: number;
    y?: number;
};

type TmjLayer = {
    type?: string;
    name?: string;
    objects?: TmjObject[];
};

type TmjMap = {
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    tilesets?: Array<{ source: string }>;
    layers?: TmjLayer[];
};

type VisualsConfig = {
    combat_target_reticle: {
        primary_color: string;
    };
};

const mapsConfig = JSON.parse(
    readFileSync(new URL('../../../src/content/gameplay/maps.json', import.meta.url), 'utf-8'),
) as MapsConfig;
const visualsConfig = JSON.parse(
    readFileSync(new URL('../../../src/content/gameplay/visuals.json', import.meta.url), 'utf-8'),
) as VisualsConfig;
const reticlePrimary = Number.parseInt(visualsConfig.combat_target_reticle.primary_color.slice(1), 16);
const RETICLE_PRIMARY_RGB = {
    r: (reticlePrimary >> 16) & 0xff,
    g: (reticlePrimary >> 8) & 0xff,
    b: reticlePrimary & 0xff,
};
const RETICLE_TOLERANCE = 16;
const IDLE_MAP_RETICLE_PIXEL_LIMIT = 8;

const mapVisualTargets = Object.entries(mapsConfig.maps)
    .map(([mapId, map]) => {
        const tmj = JSON.parse(
            readFileSync(new URL(`../../../public/assets/maps/${mapId}.tmj`, import.meta.url), 'utf-8'),
        ) as TmjMap;
        const preview = PNG.sync.read(
            readFileSync(new URL(`../../../public/assets/maps/${mapId}.preview.png`, import.meta.url)),
        );
        const spawn = tmj.layers
            ?.find((layer) => layer.type === 'objectgroup' && layer.name === 'Objects')
            ?.objects?.find((object) => object.type === 'SpawnPoint');
        const fallback = {
            x: Math.floor((tmj.width * tmj.tilewidth) / 2),
            y: Math.floor((tmj.height * tmj.tileheight) / 2),
        };

        return {
            mapId,
            label: map.label,
            position: map.safe_spawn
                ?? (typeof spawn?.x === 'number' && typeof spawn.y === 'number'
                    ? { x: spawn.x, y: spawn.y }
                    : fallback),
            previewSize: `${preview.width}x${preview.height}`,
            tmjDimensions: {
                width: tmj.width,
                height: tmj.height,
                tilewidth: tmj.tilewidth,
                tileheight: tmj.tileheight,
                pixelWidth: tmj.width * tmj.tilewidth,
                pixelHeight: tmj.height * tmj.tileheight,
            },
            layers: {
                tile: tmj.layers
                    ?.filter((layer) => layer.type === 'tilelayer')
                    .map((layer) => layer.name)
                    .filter((name): name is string => typeof name === 'string') ?? [],
                object: tmj.layers
                    ?.filter((layer) => layer.type === 'objectgroup')
                    .map((layer) => layer.name)
                    .filter((name): name is string => typeof name === 'string') ?? [],
            },
            tilesetFamilies: Array.from(
                new Set(tmj.tilesets?.map((tileset) => tilesetFamily(tileset.source)) ?? []),
            ).sort(),
            tilesetSources: tmj.tilesets?.map((tileset) => tileset.source) ?? [],
        };
    })
    .sort((a, b) => a.mapId.localeCompare(b.mapId));

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rr-title-entry').nth(index);
}

async function visibleMapId(page: Page): Promise<string | null> {
    return page.evaluate(async () => {
        const state = await window.__POKI__!.testing.getState();
        return state.serverMapId
            ?? state.currentMapId
            ?? (typeof state.saves[0]?.map === 'string' ? state.saves[0].map : null);
    });
}

async function resetToFreshTitle(page: Page): Promise<void> {
    await page.goto('/');
    await waitForReady(page);
    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);
    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText('Rivers Reckoning');
}

async function captureCanvasPixels(
    page: Page,
    testInfo: TestInfo,
    selector: string,
    name: string,
    metadata: Record<string, unknown> = {},
): Promise<string> {
    const path = testInfo.outputPath(`${name}.png`);
    const dataUrl = await page.locator(selector).evaluate(async (element) => {
        if (!(element instanceof HTMLCanvasElement)) {
            throw new Error(`captureCanvasPixels: ${selector} is not a canvas`);
        }
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const width = Math.max(1, element.width);
        const height = Math.max(1, element.height);
        const copy = document.createElement('canvas');
        copy.width = width;
        copy.height = height;
        const context = copy.getContext('2d');
        if (!context) throw new Error(`captureCanvasPixels: canvas context unavailable for ${selector}`);
        context.drawImage(element, 0, 0, width, height);
        return copy.toDataURL('image/png');
    });
    const [, base64] = dataUrl.split(',');
    if (!base64) throw new Error(`captureCanvasPixels: failed to read ${name}`);
    await writeFile(path, Buffer.from(base64, 'base64'));
    await testInfo.attach(name, {
        path,
        contentType: 'image/png',
    });
    await attachPngDiagnostics(testInfo, name, path, metadata);
    return path;
}

async function captureElementPixels(
    page: Page,
    testInfo: TestInfo,
    selector: string,
    name: string,
    metadata: Record<string, unknown> = {},
): Promise<string> {
    const path = testInfo.outputPath(`${name}.png`);
    const dataUrl = await page.locator(selector).evaluate(async (element) => {
        const rect = element.getBoundingClientRect();
        const width = Math.max(1, Math.ceil(rect.width));
        const height = Math.max(1, Math.ceil(rect.height));
        const clone = element.cloneNode(true) as HTMLElement;

        function inlineStyles(source: Element, target: Element): void {
            const style = window.getComputedStyle(source);
            const cssText = Array.from(style)
                .map((prop) => `${prop}:${style.getPropertyValue(prop)};`)
                .join('');
            target.setAttribute('style', cssText);
            for (let index = 0; index < source.children.length; index += 1) {
                inlineStyles(source.children[index], target.children[index]);
            }
        }

        inlineStyles(element, clone);
        clone.style.position = 'static';
        clone.style.inset = 'auto';
        clone.style.left = 'auto';
        clone.style.top = 'auto';
        clone.style.right = 'auto';
        clone.style.bottom = 'auto';
        clone.style.transform = 'none';
        clone.style.margin = '0';
        clone.style.width = `${width}px`;
        clone.style.height = `${height}px`;
        clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        const markup = new XMLSerializer().serializeToString(clone);
        const svg = [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
            `<foreignObject width="100%" height="100%">${markup}</foreignObject>`,
            '</svg>',
        ].join('');
        const image = new Image();
        image.decoding = 'sync';
        const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error(`captureElementPixels: failed to render ${selector}`));
            image.src = encoded;
        });
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error(`captureElementPixels: canvas context unavailable for ${selector}`);
        context.drawImage(image, 0, 0);
        return canvas.toDataURL('image/png');
    });
    const [, base64] = dataUrl.split(',');
    if (!base64) throw new Error(`captureElementPixels: failed to read ${name}`);
    await writeFile(path, Buffer.from(base64, 'base64'));
    await testInfo.attach(name, {
        path,
        contentType: 'image/png',
    });
    await attachPngDiagnostics(testInfo, name, path, metadata);
    return path;
}

async function attachPngDiagnostics(
    testInfo: TestInfo,
    name: string,
    path: string,
    metadata: Record<string, unknown>,
): Promise<void> {
    const diagnosticPath = testInfo.outputPath(`${name}.diagnostics.json`);
    await writeFile(
        diagnosticPath,
        `${JSON.stringify({ name, path, metadata, image: pngDiagnostics(path) }, null, 2)}\n`,
    );
    await testInfo.attach(`${name} diagnostics`, {
        path: diagnosticPath,
        contentType: 'application/json',
    });
}

function pngDiagnostics(path: string) {
    const png = PNG.sync.read(readFileSync(path));
    const sampledColors = new Set<string>();
    let opaquePixels = 0;
    let transparentPixels = 0;
    let darkPixels = 0;
    let blackishPixels = 0;
    const stride = Math.max(1, Math.floor((png.width * png.height) / 12_000));
    for (let pixel = 0; pixel < png.width * png.height; pixel += stride) {
        const index = pixel * 4;
        const r = png.data[index];
        const g = png.data[index + 1];
        const b = png.data[index + 2];
        const a = png.data[index + 3];
        if (a === 0) {
            transparentPixels += 1;
            continue;
        }
        opaquePixels += 1;
        if ((r + g + b) / 3 < 24) darkPixels += 1;
        if (r < 8 && g < 8 && b < 8) blackishPixels += 1;
        sampledColors.add(`${r >> 4},${g >> 4},${b >> 4},${a >> 4}`);
    }
    const sampledPixels = opaquePixels + transparentPixels;

    return {
        width: png.width,
        height: png.height,
        sampledPixels,
        sampledColorBuckets: sampledColors.size,
        darkPixelRatio: sampledPixels > 0 ? darkPixels / sampledPixels : 1,
        blackishPixelRatio: sampledPixels > 0 ? blackishPixels / sampledPixels : 1,
        transparentPixelRatio: sampledPixels > 0 ? transparentPixels / sampledPixels : 1,
    };
}

function tilesetFamily(source: string): string {
    const normalized = source.replaceAll('\\', '/');
    const match = normalized.match(/(?:^|\/)tilesets\/([^/]+)/);
    return match?.[1] ?? 'unknown';
}

function countReticlePrimaryPixels(path: string): number {
    const png = PNG.sync.read(readFileSync(path));
    let count = 0;
    for (let index = 0; index < png.data.length; index += 4) {
        const r = png.data[index];
        const g = png.data[index + 1];
        const b = png.data[index + 2];
        const a = png.data[index + 3];
        if (a <= 0) continue;
        if (
            Math.abs(r - RETICLE_PRIMARY_RGB.r) <= RETICLE_TOLERANCE
            && Math.abs(g - RETICLE_PRIMARY_RGB.g) <= RETICLE_TOLERANCE
            && Math.abs(b - RETICLE_PRIMARY_RGB.b) <= RETICLE_TOLERANCE
        ) {
            count += 1;
        }
    }
    return count;
}

function expectNoIdleCombatReticle(path: string, label: string): void {
    expect(
        countReticlePrimaryPixels(path),
        `${label} should not render combat target reticle pixels while the lead movebar is closed`,
    ).toBeLessThanOrEqual(IDLE_MAP_RETICLE_PIXEL_LIMIT);
}

async function advanceDialog(page: Page, expectedText: string | RegExp): Promise<void> {
    await expect(page.locator('.rr-dialog')).toContainText(expectedText);
    await page.evaluate(() => window.__POKI__!.testing.closeGui());
}

test('captures desktop title and starter-map canvas for visual audit', async ({ page }, testInfo) => {
    await resetToFreshTitle(page);
    await expect(titleEntry(page, 0)).toContainText('New Game');
    await expect(titleEntry(page, 1)).toContainText('Settings');
    await expect(titleEntry(page, 2)).toContainText('Quit');
    await captureElementPixels(page, testInfo, '.rr-title-screen', 'desktop-title-choices', {
        surface: 'title',
    });

    await titleEntry(page, 0).click();
    await expect.poll(async () => visibleMapId(page)).toBe('riverside_home');
    await expect(page.locator('#rpg canvas')).toBeVisible();
    await page.waitForTimeout(500);
    await captureCanvasPixels(page, testInfo, '#rpg canvas', 'desktop-starter-map-canvas', {
        mapId: 'riverside_home',
        surface: 'starter-map',
    });
});

test('captures mobile starter choice dialog and pause HUD for visual audit', async ({ browser, baseURL }, testInfo) => {
    const context = await browser.newContext({
        baseURL,
        viewport: { width: 390, height: 844 },
        isMobile: false,
        hasTouch: true,
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    try {
        await resetToFreshTitle(page);

        await titleEntry(page, 0).tap();
        await expect.poll(async () => visibleMapId(page)).toBe('riverside_home');
        await expect(page.locator('[data-testid="hud-menu-toggle"]')).toBeVisible();

        const starterTask = await page.evaluate(() => window.__POKI__!.testing.beginEvent('jan-sewi'));
        await advanceDialog(page, 'Rivers, today you start your own investigation.');
        await advanceDialog(page, 'Three creatures answered the call.');
        await advanceDialog(page, 'Choose the partner you trust at your side.');
        await expect(page.locator('.rr-dialog-choice')).toHaveCount(3);
        await captureElementPixels(
            page,
            testInfo,
            '.rr-dialog-stage',
            'mobile-starter-choice-dialog',
            { surface: 'mobile-starter-dialog' },
        );
        await page.getByTestId('dialog-choice-0').tap();
        await expect.poll(async () => page.evaluate((id) => window.__POKI__!.testing.getTaskStatus(id), starterTask))
            .toMatchObject({ done: true });

        await page.locator('[data-testid="hud-menu-toggle"]').tap();
        await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
        await expect(page.getByTestId('pause-party')).toContainText('Party');
        await expect(page.getByTestId('pause-save')).toContainText('Save');
        await captureElementPixels(
            page,
            testInfo,
            '[data-testid="pause-overlay"]',
            'mobile-pause-overlay',
            { surface: 'mobile-pause-overlay' },
        );
    } finally {
        await context.close();
    }
});

test('captures every authored map canvas for visual audit', async ({ page }, testInfo) => {
    await resetToFreshTitle(page);
    await titleEntry(page, 0).click();
    await expect.poll(async () => visibleMapId(page)).toBe('riverside_home');
    await expect(page.locator('#rpg canvas')).toBeVisible();

    for (const target of mapVisualTargets) {
        await page.evaluate(({ mapId, position }) => {
            return window.__POKI__!.testing.moveServerPlayer(position, mapId);
        }, { mapId: target.mapId, position: target.position });
        await expect.poll(async () => visibleMapId(page), {
            message: `${target.mapId} should be the active map before screenshot capture`,
        }).toBe(target.mapId);
        await page.waitForTimeout(400);
        await expect(page.getByTestId('lead-movebar')).toHaveCount(0);
        const path = await captureCanvasPixels(
            page,
            testInfo,
            '#rpg canvas',
            `map-${target.mapId}-${target.previewSize}`,
            {
                mapId: target.mapId,
                label: target.label,
                previewSize: target.previewSize,
                capturePosition: target.position,
                tmj: target.tmjDimensions,
                layers: target.layers,
                tilesetFamilies: target.tilesetFamilies,
                tilesetSources: target.tilesetSources,
            },
        );
        expectNoIdleCombatReticle(path, target.mapId);
    }
});
