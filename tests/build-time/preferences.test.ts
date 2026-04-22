import { describe, expect, it } from 'vitest';
import {
    KEYS,
    isPreferenceKey,
    preferences,
    setPreferencesImpl,
    type PreferencesAdapter,
} from '../../src/platform/persistence/preferences';

class InMemoryPrefs implements PreferencesAdapter {
    constructor(private readonly store = new Map<string, string>()) {}

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

describe('preferences key contract', () => {
    it('recognizes only declared game preference keys', () => {
        expect(isPreferenceKey(KEYS.currentMapId)).toBe(true);
        expect(isPreferenceKey('poki-soweli.world.unknown')).toBe(false);
    });

    it('filters raw adapter keys through the typed preference union', async () => {
        setPreferencesImpl(new InMemoryPrefs(new Map([
            [KEYS.currentMapId, 'nasin_wan'],
            ['poki-soweli.world.unknown', 'stale'],
        ])));

        expect(await preferences.keys()).toEqual([KEYS.currentMapId]);
        expect(await preferences.get(KEYS.currentMapId)).toBe('nasin_wan');
    });
});
