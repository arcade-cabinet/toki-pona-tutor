/**
 * Audio bus + BGM selection — T5-01 / T5-02.
 *
 * The runtime owns the actual Howler/Web-Audio playback. This module
 * owns the *decision* layer: given a map id + game state, which BGM
 * track should be playing? Given a sound event, which file and at
 * what volume?
 *
 * Pure functions so tests don't need an audio backend and so the same
 * logic runs identically on web, Android, and iOS. The runtime calls
 * `bgmForContext({ mapId, inCombat, timePhase })` after every scene
 * transition, diffs the result against current track, and swaps if
 * different. No polling — event-driven.
 *
 * Volume is always a float in [0, 1] internally; the platform adapters
 * convert to the right unit (Web Audio gain node expects 0-1, Android
 * AudioManager wants 0-100, etc.). This module stays in the canonical
 * [0, 1] space.
 */
import { mapMetadataFor } from "../../content/map-metadata";
import {
    AUDIO_RUNTIME_CONFIG,
    BGM_FILES as CONFIGURED_BGM_FILES,
    BGM_SELECTION_CONFIG,
    type ConfiguredBgmId,
} from "../../content/gameplay";

export type MapContext = {
    mapId: string;
    inCombat: boolean;
    /** Optional day phase — influences ambient village/forest tracks. */
    timePhase?: "dawn" | "day" | "dusk" | "night";
};

export type BgmId = ConfiguredBgmId;

export const AUDIO_BGM_OVERRIDE_EVENT = AUDIO_RUNTIME_CONFIG.bgmOverrideEvent;

export type BgmOverridePayload = {
    mapId: string;
    inCombat: boolean;
    userVol?: number;
};

const BGM_FILES = CONFIGURED_BGM_FILES as Record<BgmId, string>;

/**
 * Canonical public asset path for a BGM id. Returns `.ogg` because the
 * shipped audio set is OGG-first and Howler handles browser playback.
 *
 * @example
 * bgmFile('bgm_village')  // → '/rpg/audio/bgm-village.ogg'
 */
export function bgmFile(id: BgmId): string {
    return BGM_FILES[id];
}

export function isBgmId(value: string): value is BgmId {
    return Object.prototype.hasOwnProperty.call(BGM_FILES, value);
}

export function isBgmOverridePayload(value: unknown): value is BgmOverridePayload {
    if (!value || typeof value !== "object") return false;
    const payload = value as Record<string, unknown>;
    return (
        typeof payload.mapId === "string" &&
        typeof payload.inCombat === "boolean" &&
        (payload.userVol === undefined || typeof payload.userVol === "number")
    );
}

function ambientBgmForMap(mapId: string): BgmId {
    // Map metadata is the authoring/runtime contract; map-id prefixes are only
    // used below for combat intensity because those are encounter semantics.
    return mapMetadataFor(mapId)?.music_track ?? "bgm_menu";
}

/**
 * Top-level BGM selection. Combat overrides ambient. Gym leaders get
 * the higher-intensity `bgm_gym` variant; final boss gets `bgm_boss`.
 *
 * @example
 * bgmForContext({ mapId: 'ma_tomo_lili', inCombat: false })
 * // → 'bgm_village'
 * bgmForContext({ mapId: 'nena_sewi', inCombat: true })
 * // → 'bgm_gym'
 */
export function bgmForContext(ctx: MapContext): BgmId {
    if (ctx.inCombat) {
        const override = BGM_SELECTION_CONFIG.mapCombatOverrides[ctx.mapId];
        if (override) return override;
        if (BGM_SELECTION_CONFIG.gymMapPrefixes.some((prefix) => ctx.mapId.startsWith(prefix))) {
            return BGM_SELECTION_CONFIG.gymCombatTrack;
        }
        return BGM_SELECTION_CONFIG.defaultCombatTrack;
    }
    return ambientBgmForMap(ctx.mapId);
}

/**
 * Effective gain for a track given the user's BGM volume preference
 * and an optional duck factor (e.g. 0.4 during a cutscene VO).
 *
 * @example
 * effectiveVolume({ userVol: 70, duck: 1 })       // → 0.7
 * effectiveVolume({ userVol: 70, duck: 0.4 })     // → 0.28
 * effectiveVolume({ userVol: 0, duck: 1 })        // → 0 (muted)
 */
export function effectiveVolume(params: { userVol: number; duck?: number }): number {
    const clampedVol = Math.max(0, Math.min(100, params.userVol)) / 100;
    const duck = params.duck === undefined ? 1 : Math.max(0, Math.min(1, params.duck));
    return clampedVol * duck;
}
