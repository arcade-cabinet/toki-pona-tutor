import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import worldRaw from '../../src/content/generated/world.json';

const __dirname = dirname(fileURLToPath(import.meta.url));

type WorldSign = {
    region: string;
    at: [number, number];
    title: string;
    body: { en: string };
};

const world = worldRaw as unknown as { signs: WorldSign[] };

describe('T61: region signs compiled into world.json', () => {
    it('ships at least one sign per region dossier', () => {
        const regionsWithSigns = new Set(world.signs.map((s) => s.region));
        for (const region of [
            'riverside_home',
            'greenwood_road',
            'highridge_pass',
            'lakehaven',
            'frostvale',
            'dreadpeak_cavern',
            'rivergate_approach',
        ]) {
            expect(regionsWithSigns.has(region), `${region} should ship at least one sign`).toBe(
                true,
            );
        }
    });

    it('every sign has non-empty English body copy', () => {
        for (const sign of world.signs) {
            expect(sign.body.en, `${sign.region} sign "${sign.title}" body`).toMatch(
                /\S/,
            );
            expect(sign.title, `${sign.region} sign title`).toMatch(/\S/);
        }
    });

    it('sign coordinates are non-negative tile-units', () => {
        for (const sign of world.signs) {
            expect(sign.at[0]).toBeGreaterThanOrEqual(0);
            expect(sign.at[1]).toBeGreaterThanOrEqual(0);
        }
    });

    it('at least 35 signs shipped across all regions (approaches Pokémon-Kanto density)', () => {
        // Pokémon Red ships ~40 signs across Kanto. 35 is the T62
        // density target — minimum 5 signs per region.
        expect(world.signs.length).toBeGreaterThanOrEqual(35);
    });

    it('every region ships at least 5 signs', () => {
        const perRegion = new Map<string, number>();
        for (const sign of world.signs) {
            perRegion.set(sign.region, (perRegion.get(sign.region) ?? 0) + 1);
        }
        for (const [region, count] of perRegion) {
            expect(count, `${region} signs`).toBeGreaterThanOrEqual(5);
        }
    });
});

describe('T69: signs emit as Tiled objects for authoring visibility', () => {
    it('every world.signs record surfaces as a Sign object in its map .tmj', () => {
        const tmjDir = resolve(__dirname, '../../public/assets/maps');
        const signsByRegion = new Map<string, WorldSign[]>();
        for (const sign of world.signs) {
            if (!signsByRegion.has(sign.region)) signsByRegion.set(sign.region, []);
            signsByRegion.get(sign.region)!.push(sign);
        }
        for (const [region, signs] of signsByRegion) {
            const tmj = JSON.parse(readFileSync(resolve(tmjDir, `${region}.tmj`), 'utf-8')) as {
                layers: Array<{
                    name: string;
                    type: string;
                    objects?: Array<{
                        type: string;
                        name: string;
                        x: number;
                        y: number;
                        properties: Array<{ name: string; value: unknown }>;
                    }>;
                }>;
            };
            const objectLayer = tmj.layers.find((l) => l.type === 'objectgroup');
            const tiledSigns = (objectLayer?.objects ?? []).filter((o) => o.type === 'Sign');
            expect(tiledSigns.length, `${region} .tmj Sign count`).toBe(signs.length);
            for (const sign of signs) {
                const match = tiledSigns.find((s) => s.name === `sign-${sign.at[0]}-${sign.at[1]}`);
                expect(match, `${region} sign at (${sign.at[0]},${sign.at[1]}) missing .tmj object`).toBeDefined();
                const text = match?.properties.find((p) => p.name === 'text')?.value;
                expect(text).toBe(sign.body.en);
            }
        }
    });
});
