import { COMBAT_TARGET_PARAM } from "../modules/main/combat-visuals";

export type CombatSpriteObject = {
    id?: string;
    name?: string;
    _type?: string;
    _param?: () => Record<string, unknown>;
    hpSignal?: () => unknown;
    hitbox?: () => { w?: unknown; h?: unknown };
};

export type CombatChromeProps = {
    currentHp: number;
    maxHp: number;
    hitboxWidth: number;
    hitboxHeight: number;
    isCombatEvent: boolean;
};

export function combatChromePropsForObject(object: CombatSpriteObject): CombatChromeProps {
    const hitbox = object.hitbox?.() ?? { w: 32, h: 32 };
    const params = (object._param?.() ?? {}) as Record<string, unknown>;
    const currentHp = Number(object.hpSignal?.() ?? 0);
    const maxHp = Number(params.maxHp ?? currentHp);
    const hitboxWidth = Number(hitbox.w ?? 32);
    const hitboxHeight = Number(hitbox.h ?? 32);

    return {
        currentHp: Number.isFinite(currentHp) ? currentHp : 0,
        maxHp: Number.isFinite(maxHp) ? maxHp : 0,
        hitboxWidth: Number.isFinite(hitboxWidth) ? hitboxWidth : 32,
        hitboxHeight: Number.isFinite(hitboxHeight) ? hitboxHeight : 32,
        isCombatEvent: object._type === "event" && isCombatTargetObject(object, params),
    };
}

export function combatChromeDependenciesForObject(object: CombatSpriteObject): unknown[] {
    if (object._type !== "event") return [undefined];
    return [object.hpSignal, object.hitbox, object._param];
}

function isCombatTargetObject(
    object: CombatSpriteObject,
    params: Record<string, unknown>,
): boolean {
    return Number(params[COMBAT_TARGET_PARAM] ?? 0) === 1;
}
