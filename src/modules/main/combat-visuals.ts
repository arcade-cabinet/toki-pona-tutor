import { COMBAT_FAINT_EFFECT_MS, COMBAT_HIT_EFFECT_MS } from "./combat-chrome";
import { COMBAT_UI_CONFIG } from "../../content/gameplay";

export const COMBAT_FAINT_ANIMATION_ID = COMBAT_UI_CONFIG.combatFaintAnimationId;
export const COMBAT_TARGET_PARAM = "pokiCombatTarget";

const previousHpKey = Symbol.for("poki-soweli.combat.previous-hp");
const faintVisualPlayedKey = Symbol.for("poki-soweli.combat.faint-visual-played");

export type CombatVisualMap = {
    showComponentAnimation?: (
        id: string,
        position: { x: number; y: number },
        params: Record<string, unknown>,
    ) => void;
};

export type CombatVisualEvent = {
    hp?: number;
    x?: () => number;
    y?: () => number;
    hitbox?: () => { w?: unknown; h?: unknown };
    graphics?: () => unknown;
    getCurrentMap?: () => CombatVisualMap | undefined;
    setGraphicAnimation?: (animationName: string, nbTimes?: number) => void;
    flash?: (options: {
        type?: "alpha" | "tint" | "both";
        duration?: number;
        cycles?: number;
        alpha?: number;
        tint?: number | string;
    }) => void;
    [previousHpKey]?: number;
    [faintVisualPlayedKey]?: boolean;
};

export type CombatDamageVisualOptions = {
    hurtAnimation?: string | false;
    faint?: CombatFaintVisualOptions;
};

export type CombatFaintVisualOptions = {
    graphic?: string;
    animationName?: string;
    durationMs?: number;
    dropPx?: number;
    fadeStart?: number;
};

export function updateCombatDamageVisuals(
    event: CombatVisualEvent,
    options: CombatDamageVisualOptions = {},
): void {
    if (typeof event.hp !== "number" || !Number.isFinite(event.hp)) return;
    const previousHp = event[previousHpKey];
    event[previousHpKey] = event.hp;

    if (typeof previousHp !== "number" || event.hp >= previousHp) return;

    if (event.hp <= 0) {
        playCombatFaintVisual(event, options.faint);
        return;
    }

    playCombatHurtVisual(event, options.hurtAnimation ?? "hurt");
}

export function playCombatHurtVisual(
    event: CombatVisualEvent,
    animationName: string | false = "hurt",
): boolean {
    if (animationName && typeof event.setGraphicAnimation === "function") {
        event.setGraphicAnimation(animationName, 1);
    }

    if (typeof event.flash === "function") {
        event.flash({
            type: "both",
            tint: 0xffffff,
            alpha: 0.45,
            duration: COMBAT_HIT_EFFECT_MS,
            cycles: 1,
        });
    }

    return Boolean(animationName || event.flash);
}

export function playCombatFaintVisual(
    event: CombatVisualEvent,
    options: CombatFaintVisualOptions = {},
): boolean {
    if (event[faintVisualPlayedKey]) return false;
    const map = event.getCurrentMap?.();
    if (typeof map?.showComponentAnimation !== "function") return false;

    const graphic = options.graphic ?? currentGraphic(event);
    if (!graphic) return false;

    event[faintVisualPlayedKey] = true;
    map.showComponentAnimation(COMBAT_FAINT_ANIMATION_ID, combatVisualPosition(event), {
        graphic,
        animationName: options.animationName ?? "hurt",
        duration: options.durationMs ?? COMBAT_FAINT_EFFECT_MS,
        dropPx: options.dropPx ?? 40,
        fadeStart: options.fadeStart ?? 0.35,
    });

    return true;
}

function currentGraphic(event: CombatVisualEvent): string | undefined {
    const graphics = event.graphics?.();
    if (Array.isArray(graphics)) {
        return graphics.find((graphic): graphic is string => typeof graphic === "string");
    }
    return typeof graphics === "string" ? graphics : undefined;
}

function combatVisualPosition(event: CombatVisualEvent): { x: number; y: number } {
    const x = typeof event.x === "function" ? event.x() : 0;
    const y = typeof event.y === "function" ? event.y() : 0;
    const hitbox = event.hitbox?.();
    const width = Number(hitbox?.w ?? 32);
    const height = Number(hitbox?.h ?? 32);
    return {
        x: x + (Number.isFinite(width) ? width / 2 : 16),
        y: y + (Number.isFinite(height) ? height / 2 : 16),
    };
}
