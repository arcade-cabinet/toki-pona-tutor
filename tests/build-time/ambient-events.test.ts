import { describe, it, expect } from 'vitest';
import { phaseAt, tintForPhase, weatherFor, ambientAt } from '../../src/modules/main/ambient-events';

const at = (isoMinuteSecond: string) => new Date(`2026-04-20T${isoMinuteSecond}Z`);

describe('phaseAt — 6-minute day cycle', () => {
    it('minute 0 of cycle is dawn', () => {
        expect(phaseAt(at('00:00:30'))).toBe('dawn');
    });

    it('minute 2 of cycle is day', () => {
        expect(phaseAt(at('00:02:00'))).toBe('day');
    });

    it('minute 3.5 of cycle is dusk', () => {
        expect(phaseAt(at('00:03:30'))).toBe('dusk');
    });

    it('minute 5 of cycle is night', () => {
        expect(phaseAt(at('00:05:00'))).toBe('night');
    });

    it('wraps around every 6 minutes — minute 6 is same as 0', () => {
        expect(phaseAt(at('00:06:00'))).toBe(phaseAt(at('00:00:00')));
    });

    it('every second within a phase returns that phase', () => {
        // Day phase is minute 1.000..2.999
        for (let s = 60; s < 180; s += 5) {
            const mm = Math.floor(s / 60).toString().padStart(2, '0');
            const ss = (s % 60).toString().padStart(2, '0');
            expect(phaseAt(at(`00:${mm}:${ss}`))).toBe('day');
        }
    });
});

describe('tintForPhase — day is transparent, others tint', () => {
    it('day has a=0 (no tint)', () => {
        expect(tintForPhase('day').a).toBe(0);
    });

    it('dawn and dusk are warm', () => {
        expect(tintForPhase('dawn').r).toBeGreaterThan(200);
        expect(tintForPhase('dusk').r).toBeGreaterThan(200);
    });

    it('night is cool-blue', () => {
        const night = tintForPhase('night');
        expect(night.b).toBeGreaterThan(night.r);
        expect(night.a).toBeGreaterThan(0.3);
    });
});

describe('weatherFor — deterministic per (biome, hour)', () => {
    it('indoor is always clear', () => {
        for (let h = 0; h < 24; h++) {
            expect(weatherFor('indoor', h)).toBe('clear');
        }
    });

    it('same (biome, hour) returns same weather every call', () => {
        for (let h = 0; h < 24; h++) {
            expect(weatherFor('kasi', h)).toBe(weatherFor('kasi', h));
            expect(weatherFor('lete', h)).toBe(weatherFor('lete', h));
        }
    });

    it('seli biome never produces rain or snow', () => {
        const seen = new Set<string>();
        for (let h = 0; h < 24; h++) seen.add(weatherFor('seli', h));
        expect(seen.has('rain')).toBe(false);
        expect(seen.has('snow')).toBe(false);
    });

    it('lete biome produces snow on at least some hours', () => {
        const snowHours = [];
        for (let h = 0; h < 24; h++) {
            if (weatherFor('lete', h) === 'snow') snowHours.push(h);
        }
        expect(snowHours.length).toBeGreaterThan(0);
    });

    it('every weather result is a valid enum value', () => {
        const valid = new Set(['clear', 'rain', 'snow', 'fog']);
        const biomes = ['village', 'kasi', 'lete', 'seli', 'telo', 'nena', 'indoor'] as const;
        for (const b of biomes) {
            for (let h = 0; h < 24; h++) {
                expect(valid.has(weatherFor(b, h))).toBe(true);
            }
        }
    });
});

describe('ambientAt — full bundle', () => {
    it('bundles phase + tint + weather consistently', () => {
        const state = ambientAt(at('00:05:00'), 'lete');
        expect(state.phase).toBe('night');
        expect(state.tint.a).toBeGreaterThan(0.3);
        expect(['clear', 'snow', 'fog']).toContain(state.weather);
    });

    it('indoor stays clear even at night', () => {
        const state = ambientAt(at('00:05:00'), 'indoor');
        expect(state.weather).toBe('clear');
    });
});
