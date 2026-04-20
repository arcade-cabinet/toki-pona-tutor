/**
 * Wild-capture probability per ARCHITECTURE.md §Catch mechanic:
 *
 *     p = (1 - hp / hpMax) * species.catch_rate * poki.power
 *
 * - At full HP → `p = 0` regardless of poki — must whittle first.
 * - At 1 HP → `p ≈ species.catch_rate * poki.power`.
 * - poki_lili has power 1.0; poki_wawa has power 1.5. `p` is clamped to [0, 1]
 *   so a high-power poki against a low-catch species never overflows.
 *
 * Pure function. No Math.random here — callers roll separately so this is
 * deterministic and testable.
 */
/**
 * @example
 * catchProbability({ hp: 50, hpMax: 50, catchRate: 0.45, pokiPower: 1.0 })
 * // → 0 (full HP, can't catch)
 * catchProbability({ hp: 25, hpMax: 50, catchRate: 0.5, pokiPower: 1.0 })
 * // → 0.25 (half HP × 50% catch rate × 1.0 power)
 * catchProbability({ hp: 2, hpMax: 50, catchRate: 0.65, pokiPower: 1.5 })
 * // → 0.936 (near-dead target, poki_wawa)
 * catchProbability({ hp: 0, hpMax: 50, catchRate: 0.9, pokiPower: 1.5 })
 * // → 1 (clamped — can't exceed 1.0)
 */
export function catchProbability(params: {
    hp: number;
    hpMax: number;
    catchRate: number;
    pokiPower: number;
}): number {
    const { hp, hpMax, catchRate, pokiPower } = params;
    if (hpMax <= 0) return 0;
    const clampedHp = Math.max(0, Math.min(hp, hpMax));
    const hpFactor = 1 - clampedHp / hpMax;
    const raw = hpFactor * catchRate * pokiPower;
    return Math.max(0, Math.min(1, raw));
}

/** Roll a single catch attempt. Returns true if caught. */
export function rollCatch(
    params: Parameters<typeof catchProbability>[0],
    rng: () => number = Math.random,
): boolean {
    return rng() < catchProbability(params);
}
