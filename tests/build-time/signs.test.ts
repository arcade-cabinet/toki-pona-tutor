import { describe, it, expect } from 'vitest';
import worldRaw from '../../src/content/generated/world.json';

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

    it('at least 21 signs shipped across all regions (Pokémon-town flavor bar)', () => {
        expect(world.signs.length).toBeGreaterThanOrEqual(21);
    });
});
