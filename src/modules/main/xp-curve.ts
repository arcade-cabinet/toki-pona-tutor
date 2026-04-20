/**
 * XP + level-up curve per ARCHITECTURE.md §XP + level-up curve.
 *
 *     xpForLevel(n) = n^3
 *
 * Level 1 = 1 XP, level 5 = 125, level 10 = 1000, level 50 = 125000.
 * Classic medium-fast growth — fast early levels, meaningful endgame grind.
 *
 * All functions are pure. Callers (gym-leader onDefeated, encounter catch
 * flow) compose them to award XP and trigger level-up toasts.
 */

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 50;

/**
 * Total XP required to reach level `n` from level 0 (i.e. the threshold).
 *
 * @example
 * xpForLevel(1)   // → 1
 * xpForLevel(5)   // → 125
 * xpForLevel(10)  // → 1000
 * xpForLevel(50)  // → 125000
 * xpForLevel(99)  // → 125000 (clamped to MAX_LEVEL=50)
 */
export function xpForLevel(n: number): number {
    if (n < MIN_LEVEL) return 0;
    const clamped = Math.min(n, MAX_LEVEL);
    return clamped ** 3;
}

/**
 * Level the creature is at given its cumulative XP total. Returns MIN_LEVEL
 * for any negative/zero input, MAX_LEVEL once xp crosses the 50^3 threshold.
 */
export function levelFromXp(xp: number): number {
    if (xp < xpForLevel(MIN_LEVEL)) return MIN_LEVEL;
    for (let n = MAX_LEVEL; n >= MIN_LEVEL; n--) {
        if (xp >= xpForLevel(n)) return n;
    }
    return MIN_LEVEL;
}

/** XP delta needed from current total to reach the next level. */
export function xpToNextLevel(xp: number): number {
    const current = levelFromXp(xp);
    if (current >= MAX_LEVEL) return 0;
    return xpForLevel(current + 1) - xp;
}

export type LevelUpEvent = {
    from: number;
    to: number;
    xpAtLevelUp: number;
};

/**
 * Add `gained` XP to a creature with current `xp` total. Returns the new
 * XP total plus an array of level-up events (one per boundary crossed —
 * a 200-XP hit on a level-1 creature emits 5 events, one for each of
 * levels 2, 3, 4, 5, 6).
 *
 * @example
 * gainXp(1, 7)
 * // → { xp: 8, levelUps: [{ from: 1, to: 2, xpAtLevelUp: 8 }] }
 *
 * gainXp(1, 199)
 * // → { xp: 200, levelUps: [
 * //     { from: 1, to: 2, xpAtLevelUp: 8 },
 * //     { from: 2, to: 3, xpAtLevelUp: 27 },
 * //     { from: 3, to: 4, xpAtLevelUp: 64 },
 * //     { from: 4, to: 5, xpAtLevelUp: 125 },
 * //   ]}
 */
export function gainXp(xp: number, gained: number): {
    xp: number;
    levelUps: LevelUpEvent[];
} {
    if (gained <= 0) return { xp, levelUps: [] };
    const startLevel = levelFromXp(xp);
    const newXp = xp + gained;
    const endLevel = levelFromXp(newXp);
    const levelUps: LevelUpEvent[] = [];
    for (let lvl = startLevel + 1; lvl <= endLevel; lvl++) {
        levelUps.push({ from: lvl - 1, to: lvl, xpAtLevelUp: xpForLevel(lvl) });
    }
    return { xp: newXp, levelUps };
}
