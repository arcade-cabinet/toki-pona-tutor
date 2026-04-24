import { describe, it, expect, beforeEach } from 'vitest';
import { setPreferencesImpl, type PreferencesAdapter } from '../../src/platform/persistence/preferences';
import {
    getGlyphOverlay,
    setGlyphOverlay,
    getTextSpeed,
    setTextSpeed,
    getHighContrast,
    setHighContrast,
    getAccessibleMode,
    setAccessibleMode,
    getBgmVolume,
    setBgmVolume,
    getSfxVolume,
    setSfxVolume,
    _internals,
} from '../../src/platform/persistence/settings';
import { buildSettingsSummary, settingsChoiceLabel } from '../../src/modules/main/settings-screen';

class InMemoryPrefs implements PreferencesAdapter {
    private store = new Map<string, string>();
    async get(key: string) {
        return this.store.get(key) ?? null;
    }
    async set(key: string, value: string) {
        this.store.set(key, value);
    }
    async remove(key: string) {
        this.store.delete(key);
    }
    async clear() {
        this.store.clear();
    }
    async keys() {
        return [...this.store.keys()];
    }
}

beforeEach(() => {
    setPreferencesImpl(new InMemoryPrefs());
});

describe('parseBool helper', () => {
    it('"1" → true, "0" → false', () => {
        expect(_internals.parseBool('1', false)).toBe(true);
        expect(_internals.parseBool('0', true)).toBe(false);
    });

    it('null falls back to default', () => {
        expect(_internals.parseBool(null, true)).toBe(true);
        expect(_internals.parseBool(null, false)).toBe(false);
    });

    it('junk falls back to default', () => {
        expect(_internals.parseBool('yes', true)).toBe(true);
        expect(_internals.parseBool('', false)).toBe(false);
    });
});

describe('parseNumber helper', () => {
    it('parses valid numbers', () => {
        expect(_internals.parseNumber('42', 0, 100, 0)).toBe(42);
    });

    it('clamps to min/max', () => {
        expect(_internals.parseNumber('150', 0, 100, 50)).toBe(100);
        expect(_internals.parseNumber('-5', 0, 100, 50)).toBe(0);
    });

    it('null returns default', () => {
        expect(_internals.parseNumber(null, 0, 100, 42)).toBe(42);
    });

    it('NaN / junk returns default', () => {
        expect(_internals.parseNumber('abc', 0, 100, 42)).toBe(42);
    });
});

describe('clue glyph overlay — T8-04', () => {
    it('defaults to false', async () => {
        expect(await getGlyphOverlay()).toBe(false);
    });

    it('round-trips through setGlyphOverlay', async () => {
        await setGlyphOverlay(true);
        expect(await getGlyphOverlay()).toBe(true);
        await setGlyphOverlay(false);
        expect(await getGlyphOverlay()).toBe(false);
    });
});

describe('text speed — T3-06', () => {
    it('defaults to 48 cps', async () => {
        expect(await getTextSpeed()).toBe(48);
    });

    it('clamps to [0, 120]', async () => {
        await setTextSpeed(200);
        expect(await getTextSpeed()).toBe(120);
        await setTextSpeed(-10);
        expect(await getTextSpeed()).toBe(0);
    });

    it('rounds to integer', async () => {
        await setTextSpeed(48.7);
        expect(await getTextSpeed()).toBe(49);
    });

    it('0 means instant (no animation)', async () => {
        await setTextSpeed(0);
        expect(await getTextSpeed()).toBe(0);
    });
});

describe('high-contrast — T5-11', () => {
    it('defaults to false', async () => {
        expect(await getHighContrast()).toBe(false);
    });

    it('round-trips', async () => {
        await setHighContrast(true);
        expect(await getHighContrast()).toBe(true);
    });
});

describe('accessible mode — T5-12', () => {
    it('defaults to false', async () => {
        expect(await getAccessibleMode()).toBe(false);
    });

    it('round-trips', async () => {
        await setAccessibleMode(true);
        expect(await getAccessibleMode()).toBe(true);
        await setAccessibleMode(false);
        expect(await getAccessibleMode()).toBe(false);
    });
});

describe('volumes — T5-01', () => {
    it('BGM defaults to 70', async () => {
        expect(await getBgmVolume()).toBe(70);
    });

    it('SFX defaults to 80', async () => {
        expect(await getSfxVolume()).toBe(80);
    });

    it('clamps to [0, 100]', async () => {
        await setBgmVolume(150);
        expect(await getBgmVolume()).toBe(100);
        await setSfxVolume(-20);
        expect(await getSfxVolume()).toBe(0);
    });

    it('mute → 0 round-trips', async () => {
        await setBgmVolume(0);
        await setSfxVolume(0);
        expect(await getBgmVolume()).toBe(0);
        expect(await getSfxVolume()).toBe(0);
    });
});

describe('settings screen copy', () => {
    const state = {
        sitelen: true,
        textSpeed: 48,
        highContrast: false,
        accessibleMode: true,
        bgm: 70,
        sfx: 80,
    };

    it('formats the settings summary from gameplay JSON', () => {
        expect(buildSettingsSummary(state)).toBe([
            'Settings:',
            '  glyphs    on',
            '  text      48 / sec',
            '  contrast       off',
            '  access       on',
            '  sound     bgm 70   sfx 80',
        ].join('\n'));
    });

    it('formats choice labels from gameplay JSON', () => {
        expect(settingsChoiceLabel('sitelen', { label: 'glyph overlay', ...state })).toBe('glyph overlay  [on]');
        expect(settingsChoiceLabel('text_speed', { label: 'text speed', ...state })).toBe('text speed   48 / sec');
        expect(settingsChoiceLabel('contrast', { label: 'high contrast', ...state })).toBe('high contrast  [off]');
        expect(settingsChoiceLabel('bgm', { label: 'music volume', ...state })).toBe('music volume 70');
    });
});
