/**
 * Typed settings accessors — T3-06 + T5-11 + T8-04.
 *
 * The Capacitor Preferences layer only stores strings. This module
 * wraps it with typed getters / setters for the game's known settings,
 * each with a documented default + validation.
 *
 * Why not just let callers cast? Because settings flow through save
 * migrations + platform-specific clamps (iOS volume is 0-1, Android
 * goes to 0-100, web to 0-1; this module normalizes). Also, typed
 * defaults here means tests don't need the Preferences backend at all
 * — the pure helpers can be exercised with in-memory shims.
 */

import { preferences, KEYS } from './preferences';

// ─── helpers ────────────────────────────────────────────────────────

/** Parse a stored "0" / "1" into a boolean. null / anything-else → default. */
function parseBool(raw: string | null, defaultValue: boolean): boolean {
    if (raw === '1') return true;
    if (raw === '0') return false;
    return defaultValue;
}

/** Parse a stored number, clamping to [min, max]. null / NaN → default. */
function parseNumber(raw: string | null, min: number, max: number, defaultValue: number): number {
    if (raw === null) return defaultValue;
    const n = Number(raw);
    if (!Number.isFinite(n)) return defaultValue;
    return Math.max(min, Math.min(max, n));
}

// ─── sitelen overlay (T8-04) ────────────────────────────────────────

/** Defaults to OFF — diegetic TP is the point. Players opt in. */
export async function getSitelenOverlay(): Promise<boolean> {
    return parseBool(await preferences.get(KEYS.sitelenOverlay), false);
}

export async function setSitelenOverlay(on: boolean): Promise<void> {
    await preferences.set(KEYS.sitelenOverlay, on ? '1' : '0');
}

// ─── text speed (T3-06) ─────────────────────────────────────────────

/**
 * Characters per second during showText. Range [0, 120]. 0 means instant
 * (no animation — accessibility preference for dyslexic readers who
 * prefer reading at their own pace). Default 48 cps = readable pace.
 */
export async function getTextSpeed(): Promise<number> {
    return parseNumber(await preferences.get(KEYS.textSpeed), 0, 120, 48);
}

export async function setTextSpeed(cps: number): Promise<void> {
    const clamped = Math.max(0, Math.min(120, Math.round(cps)));
    await preferences.set(KEYS.textSpeed, String(clamped));
}

// ─── high-contrast mode (T5-11 / a11y) ──────────────────────────────

export async function getHighContrast(): Promise<boolean> {
    return parseBool(await preferences.get(KEYS.highContrast), false);
}

export async function setHighContrast(on: boolean): Promise<void> {
    await preferences.set(KEYS.highContrast, on ? '1' : '0');
}

// ─── volumes (T5-01) ────────────────────────────────────────────────

/** Range [0, 100]. Default 70 — loud but not eardrum-piercing. */
export async function getBgmVolume(): Promise<number> {
    return parseNumber(await preferences.get(KEYS.bgmVolume), 0, 100, 70);
}

export async function setBgmVolume(vol: number): Promise<void> {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    await preferences.set(KEYS.bgmVolume, String(clamped));
}

/** Range [0, 100]. Default 80 — SFX slightly louder than BGM by default. */
export async function getSfxVolume(): Promise<number> {
    return parseNumber(await preferences.get(KEYS.sfxVolume), 0, 100, 80);
}

export async function setSfxVolume(vol: number): Promise<void> {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    await preferences.set(KEYS.sfxVolume, String(clamped));
}

// ─── pure helpers exported for tests ────────────────────────────────

export const _internals = { parseBool, parseNumber };
