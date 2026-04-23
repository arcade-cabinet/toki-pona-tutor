/**
 * HP-bar threshold helper — T2-02 / BRAND.md §HP.
 *
 * Runtime adapter for the JSON-authored three-tier HP color language.
 * Components that render HP — party panel, combat overlay, trainer
 * pre-fight reveals — all call `hpClassFor(current, max)` and apply
 * the returned class name to the bar wrapper element. brand.css
 * already defines `.hp-healthy` / `.hp-wounded` / `.hp-critical`
 * fills and pulse animation.
 *
 * Hard-coding these cutoffs or labels in any component is a bug — the
 * HP language belongs in src/content/gameplay/visuals.json.
 */

import { COMBAT_CHROME_CONFIG, type RuntimeHpTierConfig } from "../content/gameplay";

export type HpClass = RuntimeHpTierConfig["className"];

export const HP_TIERS = COMBAT_CHROME_CONFIG.hpBar.tiers;
export const HP_WOUNDED_THRESHOLD = thresholdFor("hp-healthy");
export const HP_CRITICAL_THRESHOLD = thresholdFor("hp-wounded");

const HP_TERMINAL_TIER = HP_TIERS[HP_TIERS.length - 1];
const HP_STATUS_LABELS = Object.fromEntries(
    HP_TIERS.map((tier) => [tier.className, tier.label]),
) as Record<HpClass, string>;

/**
 * Clamped ratio in [0, 1]. Returns 0 for non-positive max so callers
 * never divide by zero, and clamps over/undershoot so an off-by-one
 * combat state never renders a negative-width bar or overflows.
 */
export function hpRatio(current: number, max: number): number {
    if (max <= 0) return 0;
    if (current <= 0) return 0;
    if (current >= max) return 1;
    return current / max;
}

/**
 * Threshold-based class selection. The `>` vs `<=` choice matters:
 *   - exactly 50% is "wounded" — you just lost enough to warrant concern
 *   - exactly 20% is "critical" — the pulse kicks in to prompt healing
 */
export function hpClassFor(current: number, max: number): HpClass {
    const r = hpRatio(current, max);
    if (max <= 0) return HP_TERMINAL_TIER.className;
    for (const tier of HP_TIERS) {
        if (tier.aboveRatio === undefined || r > tier.aboveRatio) return tier.className;
    }
    return HP_TERMINAL_TIER.className;
}

/**
 * Single-word status label for the HP tier. Used by accessibility
 * readouts + status tooltips. Labels map 1:1 to the threshold classes
 * so the text reinforces the color, not duplicates it.
 */
export function hpStatusLabel(current: number, max: number): string {
    const cls = hpClassFor(current, max);
    return HP_STATUS_LABELS[cls];
}

function thresholdFor(className: HpClass): number {
    const tier = HP_TIERS.find((entry) => entry.className === className);
    if (tier?.aboveRatio === undefined) {
        throw new Error(`Missing HP threshold for ${className}`);
    }
    return tier.aboveRatio;
}
