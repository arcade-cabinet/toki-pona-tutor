import { TYPE_MATCHUP_CONFIG, type ConfiguredTpType } from "../../content/gameplay";

export type TpType = ConfiguredTpType;

export const TP_TYPES: readonly TpType[] = TYPE_MATCHUP_CONFIG.types;

/**
 * Look up the damage multiplier when a move of `attacker` type hits a
 * defender with primary type `defender` and optional species tags.
 */
export function typeMultiplier(attacker: TpType, defender: TpType, defenderIsWaso = false): number {
    const defenderTags = defenderIsWaso ? ["waso"] : [];
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
