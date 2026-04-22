import { hpTpLabel } from "../../styles/hp-bar";
import { creatureSpriteId } from "../../config/creature-sprites";
import { COMBAT_UI_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { wildDamageTone, type WildCombatState, type WildDamageTone } from "./wild-combat";

export type WildCombatTarget = {
    id: string;
    name?: {
        en?: string;
        tp?: string;
    };
    sprite?: {
        src?: string;
        animations?: Record<string, unknown>;
    };
};

export function formatWildCombatPrompt(
    target: WildCombatTarget,
    level: number,
    combat: WildCombatState,
): string {
    const label = target.name?.tp ?? target.name?.en ?? target.id.replace(/_/g, " ");
    const hpLabel = hpTpLabel(combat.targetHp, combat.targetMaxHp);
    const config = COMBAT_UI_CONFIG.wildBattle;
    return formatGameplayTemplate(config.promptTemplate, {
        label,
        level: wildLevelLabel(level),
        hp: wildHpLabel(combat.targetHp, combat.targetMaxHp),
        tier: hpLabel,
    });
}

export function formatWildFightResult(
    damage: number,
    combat: WildCombatState,
    multiplier = 1,
): string {
    const config = COMBAT_UI_CONFIG.wildBattle;
    return formatGameplayTemplate(config.fightResultTemplate, {
        action: config.fightResultActionLabel,
        damage: formatWildDamagePopup(damage, multiplier),
        target: config.fightResultTargetLabel,
        hp: wildHpLabel(combat.targetHp, combat.targetMaxHp),
        tier: hpTpLabel(combat.targetHp, combat.targetMaxHp),
    });
}

export function formatWildDamagePopup(damage: number, multiplier = 1): string {
    const tone = wildDamageTone(multiplier);
    if (tone === "miss") return COMBAT_UI_CONFIG.wildBattle.damageMissLabel;
    const config = COMBAT_UI_CONFIG.wildBattle;
    return formatGameplayTemplate(config.damagePopupTemplate, {
        damage: formatGameplayTemplate(config.damageLabelTemplate, {
            damage: Math.max(0, Math.round(damage)),
            hp_label: config.hpLabelPrefix,
        }),
        tone: wildDamageToneLabel(tone),
    });
}

export function wildDamageToneLabel(tone: WildDamageTone): string {
    return COMBAT_UI_CONFIG.wildBattle.damageToneLabels[tone];
}

export function wildLevelLabel(level: number): string {
    const config = COMBAT_UI_CONFIG.wildBattle;
    return formatGameplayTemplate(config.levelLabelTemplate, {
        prefix: config.levelLabelPrefix,
        level: Math.max(1, Math.round(level)),
    });
}

export function wildHpLabel(current: number, max: number): string {
    const config = COMBAT_UI_CONFIG.wildBattle;
    return formatGameplayTemplate(config.hpLabelTemplate, {
        prefix: config.hpLabelPrefix,
        current,
        max,
    });
}

export function wildCombatFace(
    target: WildCombatTarget,
): { id: string; expression: string } | undefined {
    if (!target.sprite?.animations || Object.keys(target.sprite.animations).length === 0)
        return undefined;
    return {
        id: creatureSpriteId(target.id),
        expression: "idle",
    };
}
