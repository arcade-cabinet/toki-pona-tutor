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
import {
    SFX_BASE_VOLUMES,
    SFX_EVENTS as CONFIGURED_SFX_EVENTS,
    SFX_FILES,
} from "../../content/gameplay";

export const SFX_EVENTS = CONFIGURED_SFX_EVENTS;

export type SfxEvent = (typeof SFX_EVENTS)[number];

/**
 * Canonical asset path for a SFX event. Several events intentionally
 * share source files until the final dedicated SFX pack lands; the
 * event id still stays stable so gameplay code does not care.
 */
export function sfxFile(event: SfxEvent): string {
    return SFX_FILES[event];
}

export function isSfxEvent(value: string): value is SfxEvent {
    return Object.prototype.hasOwnProperty.call(SFX_FILES, value);
}

export function sfxBaseVolume(event: SfxEvent): number {
    return SFX_BASE_VOLUMES[event];
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
