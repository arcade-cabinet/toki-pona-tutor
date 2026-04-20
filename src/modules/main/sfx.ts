/**
 * SFX events + balanced volumes — T5-04.
 *
 * Twelve named events covering combat, traversal, catch flow, and
 * UI. Each has a canonical asset path (/audio/sfx/<kebab>.ogg) and
 * a balanced base volume in [0, 1]. The runtime owns playback via
 * Howler/Web-Audio; this module owns the decision layer:
 *
 *   sfxFile(event)                   → '/audio/sfx/xxx.ogg'
 *   sfxBaseVolume(event)             → 0 < v ≤ 1 (per-event level)
 *   effectiveSfxVolume(event, bus)   → base × bus/100 (final volume)
 *
 * Pure — tests don't need an audio backend. Sibling of audio.ts
 * which owns BGM selection.
 */

export const SFX_EVENTS = [
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
] as const;

export type SfxEvent = typeof SFX_EVENTS[number];

/**
 * Per-event base volume. The design goal is feedback hierarchy:
 * big moments (catch success, level up) punch over ambient ticks
 * (footstep, menu tick) even before the user's bus setting.
 */
const BASE_VOLUMES: Record<SfxEvent, number> = {
    sfx_menu_open:        0.55,
    sfx_menu_tick:        0.30,
    sfx_menu_confirm:     0.60,
    sfx_footstep:         0.35,
    sfx_warp:             0.70,
    sfx_encounter_appear: 0.75,
    sfx_hit:              0.75,
    sfx_catch_throw:      0.70,
    sfx_catch_success:    0.95,
    sfx_catch_fail:       0.65,
    sfx_level_up:         0.90,
    sfx_faint:            0.70,
};

/**
 * Canonical asset path for a SFX event. Strips the `sfx_` prefix
 * and converts snake_case → kebab-case so the filename on disk is
 * the player-facing /audio/sfx/menu-open.ogg rather than the
 * internal sfx_menu_open symbol.
 */
export function sfxFile(event: SfxEvent): string {
    const slug = event.replace(/^sfx_/, '').replace(/_/g, '-');
    return `/audio/sfx/${slug}.ogg`;
}

export function sfxBaseVolume(event: SfxEvent): number {
    return BASE_VOLUMES[event];
}

/**
 * Final volume the platform should actually play at. The user's
 * bus setting lives in preferences as an integer 0-100 to match
 * the existing settings UI; we normalize and clamp here so bad
 * persisted values can't blow the channel.
 */
export function effectiveSfxVolume(event: SfxEvent, bus: number): number {
    if (!Number.isFinite(bus) || bus <= 0) return 0;
    const normalized = Math.min(Math.max(bus / 100, 0), 1);
    return sfxBaseVolume(event) * normalized;
}
