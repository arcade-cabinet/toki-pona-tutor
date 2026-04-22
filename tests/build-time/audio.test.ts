import { describe, it, expect } from 'vitest';
import { AUDIO_BGM_OVERRIDE_EVENT, bgmFile, bgmForContext, effectiveVolume } from '../../src/modules/main/audio';

describe('AUDIO_BGM_OVERRIDE_EVENT', () => {
    it('uses the configured socket event contract', () => {
        expect(AUDIO_BGM_OVERRIDE_EVENT).toBe('poki-soweli:audio:bgm-override');
    });
});

describe('bgmFile — canonical file path', () => {
    it('bgm_village → shipped village loop', () => {
        expect(bgmFile('bgm_village')).toBe('/rpg/audio/bgm-village.ogg');
    });

    it('bgm_lesson → Kenney lesson loop', () => {
        expect(bgmFile('bgm_lesson')).toBe('/audio/bgm-lesson-kenney.ogg');
    });

    it('bgm_gameover → Kenney gameover loop', () => {
        expect(bgmFile('bgm_gameover')).toBe('/audio/bgm-gameover-kenney.ogg');
    });
});

describe('bgmForContext — context → BGM resolver', () => {
    it('ma_tomo_lili (starter village) → bgm_village', () => {
        expect(bgmForContext({ mapId: 'ma_tomo_lili', inCombat: false })).toBe('bgm_village');
    });

    it('ma_telo (lake village) → bgm_village', () => {
        expect(bgmForContext({ mapId: 'ma_telo', inCombat: false })).toBe('bgm_village');
    });

    it('ma_lete (cold village) → bgm_snow', () => {
        expect(bgmForContext({ mapId: 'ma_lete', inCombat: false })).toBe('bgm_snow');
    });

    it('nasin_wan (forest path) → bgm_forest', () => {
        expect(bgmForContext({ mapId: 'nasin_wan', inCombat: false })).toBe('bgm_forest');
    });

    it('nena_sewi (mountain pass) → bgm_mountain', () => {
        expect(bgmForContext({ mapId: 'nena_sewi', inCombat: false })).toBe('bgm_mountain');
    });

    it('nena_suli (great peak) → bgm_mountain', () => {
        expect(bgmForContext({ mapId: 'nena_suli', inCombat: false })).toBe('bgm_mountain');
    });

    it('nasin_pi_telo (riverside) → bgm_water', () => {
        expect(bgmForContext({ mapId: 'nasin_pi_telo', inCombat: false })).toBe('bgm_water');
    });

    it('unknown map → bgm_menu fallback', () => {
        expect(bgmForContext({ mapId: 'mysterious_nowhere', inCombat: false })).toBe('bgm_menu');
    });

    it('inCombat on village map → bgm_gym', () => {
        expect(bgmForContext({ mapId: 'ma_telo', inCombat: true })).toBe('bgm_gym');
    });

    it('inCombat on mountain → bgm_gym', () => {
        expect(bgmForContext({ mapId: 'nena_sewi', inCombat: true })).toBe('bgm_gym');
    });

    it('inCombat on nasin_pi_telo → configured boss override', () => {
        expect(bgmForContext({ mapId: 'nasin_pi_telo', inCombat: true })).toBe('bgm_boss');
    });

    it('inCombat on unknown map → bgm_battle generic', () => {
        expect(bgmForContext({ mapId: 'unknown', inCombat: true })).toBe('bgm_battle');
    });
});

describe('effectiveVolume — user pref × duck factor', () => {
    it('70 / undefined duck → 0.7', () => {
        expect(effectiveVolume({ userVol: 70 })).toBe(0.7);
    });

    it('70 × 0.4 duck → 0.28', () => {
        expect(effectiveVolume({ userVol: 70, duck: 0.4 })).toBeCloseTo(0.28, 5);
    });

    it('0 volume → 0 (muted)', () => {
        expect(effectiveVolume({ userVol: 0 })).toBe(0);
    });

    it('100 volume → 1.0', () => {
        expect(effectiveVolume({ userVol: 100 })).toBe(1);
    });

    it('clamps userVol to [0, 100]', () => {
        expect(effectiveVolume({ userVol: 150 })).toBe(1);
        expect(effectiveVolume({ userVol: -10 })).toBe(0);
    });

    it('clamps duck to [0, 1]', () => {
        expect(effectiveVolume({ userVol: 100, duck: 2 })).toBe(1);
        expect(effectiveVolume({ userVol: 100, duck: -1 })).toBe(0);
    });
});
