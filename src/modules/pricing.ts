/**
 * Shop sell price, inn heal price, faint penalty.
 * Per docs/ECONOMY.md § Shop pricing, Inn pricing, Faint penalty.
 */

export type ItemKind = "capture_pod" | "potion" | "gear" | "material" | "key";

const TYPE_MULT: Record<ItemKind, number> = {
    capture_pod: 1.0,
    potion: 0.8,
    gear: 2.5,
    material: 1.5,
    key: 5.0,
};

/**
 * Sell price for an item in a shop.
 * `floor(value × (1 + tier×0.3) × log2(playerLevel+2) × TYPE_MULT[kind])`
 */
export function shopSellPrice(
    baseValue: number,
    kind: ItemKind,
    chunkTier: number,
    playerLevel: number,
): number {
    return Math.floor(
        baseValue *
            (1 + chunkTier * 0.3) *
            Math.log2(playerLevel + 2) *
            TYPE_MULT[kind],
    );
}

/**
 * Inn heal price.
 * `floor(10 × log2(partyStrength+2) × (1 + tier×0.2))`
 */
export function innHealPrice(partyStrength: number, chunkTier: number): number {
    const BASE_HEAL_PRICE = 10;
    return Math.floor(
        BASE_HEAL_PRICE * Math.log2(partyStrength + 2) * (1 + chunkTier * 0.2),
    );
}

/**
 * Gold after faint penalty: `floor(gold × 0.9)`, never negative.
 */
export function faintPenalty(gold: number): number {
    return Math.max(0, Math.floor(gold * 0.9));
}
