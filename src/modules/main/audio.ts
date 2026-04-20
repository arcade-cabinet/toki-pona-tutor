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

export type MapContext = {
    mapId: string;
    inCombat: boolean;
    /** Optional day phase — influences ambient village/forest tracks. */
    timePhase?: 'dawn' | 'day' | 'dusk' | 'night';
};

export type BgmId =
    | 'bgm_village'
    | 'bgm_forest'
    | 'bgm_mountain'
    | 'bgm_water'
    | 'bgm_snow'
    | 'bgm_battle'
    | 'bgm_gym'
    | 'bgm_boss'
    | 'bgm_lesson'
    | 'bgm_victory'
    | 'bgm_gameover'
    | 'bgm_menu';

/**
 * Canonical file path for a BGM id. Matches public/audio/ contents.
 * Returns `.ogg` since every BGM ships both `.ogg` and `.mp3` — the
 * runtime adapter picks the right one per platform.
 *
 * @example
 * bgmFile('bgm_village')  // → '/audio/bgm-village.ogg'
 */
export function bgmFile(id: BgmId): string {
    const name = id.replace(/^bgm_/, 'bgm-').replace(/_/g, '-');
    return `/audio/${name}.ogg`;
}

/**
 * Map mapId → ambient BGM. Village maps get bgm_village; route maps
 * get bgm_forest / bgm_mountain / bgm_water depending on the biome
 * hint in the mapId. Unknown maps fall back to bgm_menu.
 */
function ambientBgmForMap(mapId: string): BgmId {
    if (mapId.startsWith('ma_tomo') || mapId.startsWith('ma_telo')) return 'bgm_village';
    if (mapId.startsWith('ma_lete') || mapId.startsWith('nasin_pi_telo')) return 'bgm_snow';
    if (mapId.startsWith('nasin_')) return 'bgm_forest';
    if (mapId.startsWith('nena_')) return 'bgm_mountain';
    if (mapId.startsWith('lupa_') || mapId === 'secret_underwater') return 'bgm_water';
    return 'bgm_menu';
}

/**
 * Top-level BGM selection. Combat overrides ambient. Gym leaders get
 * the higher-intensity `bgm_gym` variant; final boss gets `bgm_boss`.
 *
 * @example
 * bgmForContext({ mapId: 'ma_tomo_lili', inCombat: false })
 * // → 'bgm_village'
 * bgmForContext({ mapId: 'nena_sewi', inCombat: true })
 * // → 'bgm_battle'
 */
export function bgmForContext(ctx: MapContext): BgmId {
    if (ctx.inCombat) {
        if (ctx.mapId === 'nasin_pi_telo') return 'bgm_boss'; // final boss only here
        if (ctx.mapId.startsWith('nena_') || ctx.mapId.startsWith('ma_')) {
            // gym maps are village/mountain maps during combat
            return 'bgm_gym';
        }
        return 'bgm_battle';
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
