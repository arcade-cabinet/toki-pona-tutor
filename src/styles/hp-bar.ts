/**
 * HP-bar threshold helper — T2-02 / BRAND.md §HP.
 *
 * Single source of truth for the three-tier HP color language.
 * Components that render HP — party panel, combat overlay, trainer
 * pre-fight reveals — all call `hpClassFor(current, max)` and apply
 * the returned class name to the bar wrapper element. brand.css
 * already defines `.hp-healthy` / `.hp-wounded` / `.hp-critical`
 * fills and pulse animation.
 *
 * Hard-coding these cutoffs in any component is a bug — the HP
 * color language would drift the first time someone tweaks BRAND.md.
 */

export const HP_WOUNDED_THRESHOLD = 0.5;
export const HP_CRITICAL_THRESHOLD = 0.2;

export type HpClass = 'hp-healthy' | 'hp-wounded' | 'hp-critical';

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
    if (max <= 0) return 'hp-critical';
    if (r > HP_WOUNDED_THRESHOLD) return 'hp-healthy';
    if (r > HP_CRITICAL_THRESHOLD) return 'hp-wounded';
    return 'hp-critical';
}

/**
 * Single-word TP status label for the HP tier. Used by accessibility
 * readouts + status tooltips. TP labels map 1:1 to the threshold
 * classes so the text reinforces the color, not duplicates it.
 */
export function hpTpLabel(current: number, max: number): string {
    const cls = hpClassFor(current, max);
    if (cls === 'hp-healthy') return 'wawa';
    if (cls === 'hp-wounded') return 'pakala';
    return 'moli';
}
