import { WILD_COMBAT_CONFIG } from "../../content/gameplay";
import { catchProbability } from "./catch-math";

export type WildCombatState = {
    targetHp: number;
    targetMaxHp: number;
};

export type WildDamageTone = "super" | "resisted" | "neutral" | "miss";

export function wildTargetMaxHp(baseHp: number | null | undefined, level: number): number {
    const rawBase = Number(baseHp);
    const rawLevel = Number(level);
    const config = WILD_COMBAT_CONFIG.targetHp;
    const base = Number.isFinite(rawBase)
        ? Math.max(config.baseFloor, Math.round(rawBase))
        : config.baseFloor;
    const lvl = Number.isFinite(rawLevel)
        ? Math.max(config.levelFloor, Math.round(rawLevel))
        : config.levelFloor;
    return Math.max(config.baseFloor, base + lvl * config.levelMultiplier);
}

export function wildFightDamage(params: {
    attackerLevel: number;
    attackerAttack?: number | null;
    defenderDefense?: number | null;
    typeMultiplier?: number | null;
}): number {
    const level = Number.isFinite(params.attackerLevel)
        ? Math.max(
              WILD_COMBAT_CONFIG.fightDamage.attackerLevelFloor,
              Math.round(params.attackerLevel),
          )
        : WILD_COMBAT_CONFIG.fightDamage.attackerLevelFloor;
    const attack = Number(params.attackerAttack ?? 0);
    const defense = Number(params.defenderDefense ?? 0);
    const statDelta =
        Number.isFinite(attack) && Number.isFinite(defense)
            ? Math.floor((attack - defense) / WILD_COMBAT_CONFIG.fightDamage.statDeltaDivisor)
            : 0;
    const rawMultiplier = Number(
        params.typeMultiplier ?? WILD_COMBAT_CONFIG.fightDamage.multiplierFallback,
    );
    const multiplier = Number.isFinite(rawMultiplier)
        ? Math.max(WILD_COMBAT_CONFIG.fightDamage.multiplierMin, rawMultiplier)
        : WILD_COMBAT_CONFIG.fightDamage.multiplierFallback;
    const base = Math.max(
        WILD_COMBAT_CONFIG.fightDamage.preMultiplierFloor,
        WILD_COMBAT_CONFIG.fightDamage.baseDamage +
            level * WILD_COMBAT_CONFIG.fightDamage.levelMultiplier +
            statDelta,
    );
    return Math.max(WILD_COMBAT_CONFIG.fightDamage.outputMin, Math.round(base * multiplier));
}

export function applyWildFight(
    state: WildCombatState,
    damage: number,
): { state: WildCombatState; damage: number } {
    const config = WILD_COMBAT_CONFIG.applyDamage;
    const targetMaxHp = Math.max(config.targetMaxHpFloor, Math.round(state.targetMaxHp));
    const currentHp = Math.max(
        config.currentHpFloor,
        Math.min(targetMaxHp, Math.round(state.targetHp)),
    );
    const applied = Math.max(config.appliedDamageFloor, Math.round(damage));
    return {
        state: {
            targetMaxHp,
            targetHp: Math.max(config.targetHpFloorAfterAttack, currentHp - applied),
        },
        damage: Math.min(currentHp - config.targetHpFloorAfterAttack, applied),
    };
}

export function wildCatchChance(params: {
    targetHp: number;
    targetMaxHp: number;
    catchRate: number;
    pokiPower: number;
}): number {
    return catchProbability({
        hp: params.targetHp,
        hpMax: params.targetMaxHp,
        catchRate: params.catchRate,
        pokiPower: params.pokiPower,
    });
}

export function wildDamageTone(multiplier: number): WildDamageTone {
    if (multiplier <= 0) return "miss";
    if (multiplier > 1) return "super";
    if (multiplier < 1) return "resisted";
    return "neutral";
}
