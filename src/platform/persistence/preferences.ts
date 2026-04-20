/**
 * Typed wrapper over Capacitor Preferences (key/value durable storage).
 *
 * Contract:
 * - Same API on web, iOS, Android. On native: UserDefaults / SharedPreferences.
 * - Web fallback: localStorage shim lives only inside this wrapper. Feature
 *   code must never use localStorage directly.
 *
 * The `createPreferences()` factory detects Capacitor at boot and swaps
 * to the real plugin. Until `@capacitor/preferences` is initialised the
 * localStorage shim is active (safe for dev/web builds).
 */

export interface IPreferences {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
}

/** Well-known keys. Add here; never scatter string literals across the codebase. */
export const KEYS = {
    currentMapId: 'poki-soweli.world.current_map_id',
    journeyBeat: 'poki-soweli.world.journey_beat',
    partySlot: 'poki-soweli.world.party_slot',
    starterChosen: 'poki-soweli.progress.starter_chosen',
    sfxVolume: 'poki-soweli.settings.sfx_volume',
    bgmVolume: 'poki-soweli.settings.bgm_volume',
    theme: 'poki-soweli.settings.theme',
} as const;

export type PreferenceKey = (typeof KEYS)[keyof typeof KEYS];

class LocalStoragePreferences implements IPreferences {
    async get(key: string): Promise<string | null> {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    async set(key: string, value: string): Promise<void> {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    }
    async remove(key: string): Promise<void> {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    }
    async clear(): Promise<void> {
        if (typeof localStorage !== 'undefined') localStorage.clear();
    }
    async keys(): Promise<string[]> {
        return typeof localStorage !== 'undefined' ? Object.keys(localStorage) : [];
    }
}

let impl: IPreferences = new LocalStoragePreferences();

export function setPreferencesImpl(next: IPreferences): void {
    impl = next;
}

export const preferences: IPreferences = {
    get: (k) => impl.get(k),
    set: (k, v) => impl.set(k, v),
    remove: (k) => impl.remove(k),
    clear: () => impl.clear(),
    keys: () => impl.keys(),
};
