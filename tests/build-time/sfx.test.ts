import { describe, it, expect } from 'vitest';
import {
    sfxFile,
    sfxBaseVolume,
    effectiveSfxVolume,
    SFX_EVENTS,
    type SfxEvent,
} from '../../src/modules/main/sfx';

/**
 * T5-04: 12 SFX events, balanced volumes, pure mapping.
 *
 * The runtime owns Howler/Web-Audio playback; this module owns the
 * decision layer — event → file path + base volume. Base volumes
 * encode relative loudness (catch succeed is a big moment, footstep
 * is ambient, menu_tick is a whisper). Runtime multiplies by the
 * user's SFX bus setting.
 */

describe('SFX_EVENTS', () => {
    it('lists exactly 12 events per T5-04 acceptance', () => {
        expect(SFX_EVENTS).toHaveLength(12);
    });

    it('has no duplicates', () => {
        expect(new Set(SFX_EVENTS).size).toBe(SFX_EVENTS.length);
    });

    it('includes the canonical combat + UI + traversal events', () => {
        // Assertion list is explicit so the vocabulary can't silently
        // drift — a gym-leader "shoom" SFX rename would have to update
        // this test.
        for (const id of [
            'sfx_menu_open',
            'sfx_menu_tick',
            'sfx_menu_confirm',
            'sfx_footstep',
            'sfx_warp',
            'sfx_encounter_appear',
            'sfx_hit',
            'sfx_catch_throw',
            'sfx_catch_success',
            'sfx_catch_fail',
            'sfx_level_up',
            'sfx_faint',
        ]) {
            expect(SFX_EVENTS).toContain(id);
        }
    });
});

describe('sfxFile', () => {
    it('returns the shipped source asset path for an event', () => {
        expect(sfxFile('sfx_menu_open')).toBe('/rpg/sfx/dialog-open.ogg');
    });

    it('allows event ids to alias shared source files until dedicated SFX land', () => {
        expect(sfxFile('sfx_catch_success')).toBe('/rpg/sfx/pickup.ogg');
    });

    it('uses the error cue for failed/high-alert moments', () => {
        expect(sfxFile('sfx_encounter_appear')).toBe('/sfx/error.ogg');
    });
});

describe('sfxBaseVolume — balanced levels', () => {
    it('catch_success is louder than menu_tick (feedback hierarchy)', () => {
        expect(sfxBaseVolume('sfx_catch_success'))
            .toBeGreaterThan(sfxBaseVolume('sfx_menu_tick'));
    });

    it('level_up and catch_success are the loudest moments', () => {
        const loud = [sfxBaseVolume('sfx_catch_success'), sfxBaseVolume('sfx_level_up')];
        const quiet = [
            sfxBaseVolume('sfx_footstep'),
            sfxBaseVolume('sfx_menu_tick'),
        ];
        for (const l of loud) for (const q of quiet) {
            expect(l).toBeGreaterThan(q);
        }
    });

    it('menu_tick is quietest (ambient tick, not an event)', () => {
        const all = SFX_EVENTS.map(sfxBaseVolume);
        const tick = sfxBaseVolume('sfx_menu_tick');
        expect(tick).toBe(Math.min(...all));
    });

    it('every event has a base volume in [0, 1]', () => {
        for (const id of SFX_EVENTS) {
            const v = sfxBaseVolume(id);
            expect(v).toBeGreaterThan(0);
            expect(v).toBeLessThanOrEqual(1);
        }
    });
});

describe('effectiveSfxVolume — bus × event', () => {
    it('product of base and bus setting, clamped', () => {
        // bus in [0, 100] → normalized to [0, 1] and multiplied
        expect(effectiveSfxVolume('sfx_hit', 100)).toBeCloseTo(sfxBaseVolume('sfx_hit'), 5);
    });

    it('bus at 0 mutes everything', () => {
        expect(effectiveSfxVolume('sfx_catch_success', 0)).toBe(0);
    });

    it('bus at 50 halves the base volume', () => {
        expect(effectiveSfxVolume('sfx_hit', 50))
            .toBeCloseTo(sfxBaseVolume('sfx_hit') * 0.5, 5);
    });

    it('bus above 100 clamps (platform may try to overdrive)', () => {
        const full = sfxBaseVolume('sfx_hit');
        expect(effectiveSfxVolume('sfx_hit', 200)).toBe(full);
    });

    it('negative bus clamps to 0', () => {
        expect(effectiveSfxVolume('sfx_hit', -5)).toBe(0);
    });
});

describe('exhaustiveness', () => {
    it('every event has a file path and a base volume (no missing cases)', () => {
        for (const id of SFX_EVENTS as ReadonlyArray<SfxEvent>) {
            expect(sfxFile(id)).toMatch(/^\/(?:rpg\/)?sfx\/[a-z-]+\.ogg$/);
            expect(Number.isFinite(sfxBaseVolume(id))).toBe(true);
        }
    });
});
