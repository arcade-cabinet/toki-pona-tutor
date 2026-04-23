import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';

const ROOT = resolve(__dirname, '../..');
const EXPECTED_SIZES = [16, 32, 48, 192, 512] as const;

describe('favicon and web manifest', () => {
    const manifest = JSON.parse(
        readFileSync(resolve(ROOT, 'public/manifest.json'), 'utf-8'),
    ) as {
        name: string;
        short_name: string;
        icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
    };

    it('declares the Rivers Reckoning app manifest metadata', () => {
        expect(manifest.name).toBe('Rivers Reckoning');
        expect(manifest.short_name).toBe('Rivers');
        expect(manifest.icons.map((icon) => icon.sizes)).toEqual([
            '16x16',
            '32x32',
            '48x48',
            '192x192',
            '512x512',
        ]);
    });

    it('ships each declared PNG at the exact advertised size', () => {
        for (const size of EXPECTED_SIZES) {
            const icon = manifest.icons.find((entry) => entry.sizes === `${size}x${size}`);
            expect(icon, `${size}x${size} manifest entry`).toBeDefined();
            expect(icon?.type).toBe('image/png');

            const png = PNG.sync.read(readFileSync(resolve(ROOT, 'public', icon!.src)));
            expect(png.width, icon!.src).toBe(size);
            expect(png.height, icon!.src).toBe(size);
        }
    });

    it('uses maskable large icons for install surfaces', () => {
        expect(manifest.icons.find((icon) => icon.sizes === '192x192')?.purpose).toContain('maskable');
        expect(manifest.icons.find((icon) => icon.sizes === '512x512')?.purpose).toContain('maskable');
    });
});
