/**
 * Typed wrapper over Capacitor Preferences (key/value durable storage).
 *
 * Contract:
 * - Same API on web, iOS, Android. On native: UserDefaults / SharedPreferences.
 * - Web fallback: localStorage shim lives only inside this wrapper. Feature
 *   code must never use localStorage directly.
 *
 * Boot wiring: call `setPreferencesImpl(new CapacitorPreferencesAdapter())`
 * from the Capacitor device-ready handler on native builds. Until then the
 * localStorage shim is active (safe for dev/web builds).
 */

/** Well-known keys. Add here; never scatter string literals across the codebase. */
export const KEYS = {
    currentMapId: "poki-soweli.world.current_map_id",
    journeyBeat: "poki-soweli.world.journey_beat",
    partySlot: "poki-soweli.world.party_slot",
    lastSafeMapId: "poki-soweli.world.last_safe_map_id",
    lastSafeSpawnX: "poki-soweli.world.last_safe_spawn_x",
    lastSafeSpawnY: "poki-soweli.world.last_safe_spawn_y",
    starterChosen: "poki-soweli.progress.starter_chosen",
    sfxVolume: "poki-soweli.settings.sfx_volume",
    bgmVolume: "poki-soweli.settings.bgm_volume",
    theme: "poki-soweli.settings.theme",
    // T8-04: optional sitelen-pona glyph overlay toggle during dialog.
    // Off by default (the game is diegetic TP). When on, each TP line
    // during dialog shows its sitelen-pona glyph row above the text.
    // Still never shows EN — this is a reading aid, not a translator.
    sitelenOverlay: "poki-soweli.settings.sitelen_overlay",
    // T3-06: text speed — characters per second for showText. Lower
    // = slower reveal. 0 disables animation (instant text).
    textSpeed: "poki-soweli.settings.text_speed",
    // T5-11 / accessibility: high-contrast UI mode for players with
    // low vision. Doubles border weights, flattens gradients.
    highContrast: "poki-soweli.settings.high_contrast",
    // T5-12 / accessibility: larger type + reduced motion, independent
    // from OS-level prefers-reduced-motion so players can opt in in-game.
    accessibleMode: "poki-soweli.settings.accessible_mode",
} as const;

export type PreferenceKey = (typeof KEYS)[keyof typeof KEYS];

const PREFERENCE_KEYS = Object.values(KEYS) as PreferenceKey[];
const PREFERENCE_KEY_SET: ReadonlySet<string> = new Set(PREFERENCE_KEYS);

export function isPreferenceKey(key: string): key is PreferenceKey {
    return PREFERENCE_KEY_SET.has(key);
}

export interface IPreferences {
    get(key: PreferenceKey): Promise<string | null>;
    set(key: PreferenceKey, value: string): Promise<void>;
    remove(key: PreferenceKey): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<PreferenceKey[]>;
}

export interface PreferencesAdapter {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
}

class LocalStoragePreferences implements PreferencesAdapter {
    async get(key: string): Promise<string | null> {
        return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    }
    async set(key: string, value: string): Promise<void> {
        if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    }
    async remove(key: string): Promise<void> {
        if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    }
    async clear(): Promise<void> {
        if (typeof localStorage !== "undefined") {
            // Only remove keys owned by this app — other libraries on the same
            // origin must not be affected.
            const keysToRemove = Object.keys(localStorage).filter((k) =>
                k.startsWith("poki-soweli."),
            );
            keysToRemove.forEach((k) => localStorage.removeItem(k));
        }
    }
    async keys(): Promise<string[]> {
        if (typeof localStorage === "undefined") return [];
        return Object.keys(localStorage).filter((k) => k.startsWith("poki-soweli."));
    }
}

let impl: PreferencesAdapter = new LocalStoragePreferences();

export function setPreferencesImpl(next: PreferencesAdapter): void {
    impl = next;
}

export const preferences: IPreferences = {
    get: (k) => impl.get(k),
    set: (k, v) => impl.set(k, v),
    remove: (k) => impl.remove(k),
    clear: () => impl.clear(),
    keys: async () => (await impl.keys()).filter(isPreferenceKey),
};
