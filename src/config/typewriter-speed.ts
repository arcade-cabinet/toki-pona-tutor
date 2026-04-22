import { SETTINGS_CONFIG } from "../content/gameplay";

export const DEFAULT_TEXT_SPEED_CPS = SETTINGS_CONFIG.defaultTextSpeed;

/**
 * Convert the player-facing text-speed preference to a typewriter timer.
 * Returns null for instant text, which is how the Settings screen documents
 * the accessibility-friendly 0 cps mode.
 */
export function typewriterIntervalMsForCps(cps: number): number | null {
    if (!Number.isFinite(cps)) return Math.round(1000 / DEFAULT_TEXT_SPEED_CPS);
    const rounded = Math.round(cps);
    if (rounded <= 0) return null;
    return Math.max(1, Math.round(1000 / rounded));
}
