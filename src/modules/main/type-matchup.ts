import { TYPE_MATCHUP_CONFIG, type ConfiguredCombatType } from "../../content/gameplay";

export type CombatType = ConfiguredCombatType;

export const COMBAT_TYPES: readonly CombatType[] = TYPE_MATCHUP_CONFIG.types;

/**
 * Look up the damage multiplier when a move of `attacker` type hits a
 * defender with primary type `defender` and optional species tags.
 */
export function typeMultiplier(
    attacker: CombatType,
    defender: CombatType,
    defenderIsBird = false,
): number {
    const defenderTags = defenderIsBird ? ["waso"] : [];
    const tagOverride = TYPE_MATCHUP_CONFIG.defenderTagOverrides.find(
        (override) =>
            override.attacker === attacker && defenderTags.includes(override.defender_tag),
    );
    if (tagOverride) return tagOverride.multiplier;

    return (
        TYPE_MATCHUP_CONFIG.matrix[attacker]?.[defender] ??
        TYPE_MATCHUP_CONFIG.attackerDefaults[attacker] ??
        TYPE_MATCHUP_CONFIG.defaultMultiplier
    );
}
