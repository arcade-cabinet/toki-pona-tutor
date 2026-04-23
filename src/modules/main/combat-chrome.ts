import { hpClassFor, hpRatio, type HpClass } from "../../styles/hp-bar";
import { COMBAT_CHROME_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

export const COMBAT_HP_BAR_WIDTH = COMBAT_CHROME_CONFIG.hpBar.width;
export const COMBAT_HP_BAR_HEIGHT = COMBAT_CHROME_CONFIG.hpBar.height;
export const COMBAT_HP_BAR_PADDING = COMBAT_CHROME_CONFIG.hpBar.padding;
export const COMBAT_HIT_EFFECT_MS = COMBAT_CHROME_CONFIG.hpBar.hitEffectMs;
export const COMBAT_FAINT_EFFECT_MS = COMBAT_CHROME_CONFIG.hpBar.faintEffectMs;
export const COMBAT_DAMAGE_POPUP_MS = COMBAT_CHROME_CONFIG.hpBar.damagePopupMs;
export const COMBAT_HP_TWEEN_MS = COMBAT_CHROME_CONFIG.hpBar.hpTweenMs;
export const COMBAT_TARGET_RETICLE_CONFIG = COMBAT_CHROME_CONFIG.targetReticle;
const COMBAT_HP_LABEL_TEMPLATE = COMBAT_CHROME_CONFIG.hpBar.hpLabelTemplate;
const COMBAT_DAMAGE_LABEL_TEMPLATE = COMBAT_CHROME_CONFIG.hpBar.damageLabelTemplate;

export const COMBAT_HP_COLORS = COMBAT_CHROME_CONFIG.hpBar.colors as Record<HpClass, number>;

export type CombatHpBarModel = {
    currentHp: number;
    maxHp: number;
    ratio: number;
    hpClass: HpClass;
    fillWidth: number;
    fillColor: number;
    label: string;
};

export type CombatHpBarTweenPoint = {
    fillWidth: number;
    fillColor: number;
};

export type CombatFeedbackKind = "none" | "hit" | "faint";

export type CombatFeedbackModel = {
    kind: CombatFeedbackKind;
    label: string;
    damage: number;
    popupDurationMs: number;
    effectDurationMs: number;
    shakePx: number;
    flashAlpha: number;
    dropPx: number;
};

export type CombatTargetReticleModel = {
    width: number;
    height: number;
    cornerLength: number;
    strokeWidth: number;
    primaryColor: number;
    shadowColor: number;
    alphaMin: number;
    alphaMax: number;
    pulseMs: number;
};

export function buildCombatHpBarModel(current: number, max: number): CombatHpBarModel {
    const maxHp = normalizeMaxHp(max);
    const currentHp = normalizeCurrentHp(current, maxHp);
    const ratio = hpRatio(currentHp, maxHp);
    const hpClass = hpClassFor(currentHp, maxHp);
    const fillWidth = Math.round((COMBAT_HP_BAR_WIDTH - COMBAT_HP_BAR_PADDING * 2) * ratio);

    return {
        currentHp,
        maxHp,
        ratio,
        hpClass,
        fillWidth,
        fillColor: COMBAT_HP_COLORS[hpClass],
        label: formatGameplayTemplate(COMBAT_HP_LABEL_TEMPLATE, { current: currentHp, max: maxHp }),
    };
}

export function buildCombatTargetReticleModel(
    hitboxWidth: number,
    hitboxHeight: number,
): CombatTargetReticleModel {
    const width = Math.max(
        COMBAT_TARGET_RETICLE_CONFIG.minWidth,
        normalizeDimension(hitboxWidth, 32) + COMBAT_TARGET_RETICLE_CONFIG.padding * 2,
    );
    const height = Math.max(
        COMBAT_TARGET_RETICLE_CONFIG.minHeight,
        normalizeDimension(hitboxHeight, 32) + COMBAT_TARGET_RETICLE_CONFIG.padding * 2,
    );
    return {
        width,
        height,
        cornerLength: Math.min(
            COMBAT_TARGET_RETICLE_CONFIG.cornerLength,
            Math.floor(Math.min(width, height) / 2),
        ),
        strokeWidth: COMBAT_TARGET_RETICLE_CONFIG.strokeWidth,
        primaryColor: COMBAT_TARGET_RETICLE_CONFIG.primaryColor,
        shadowColor: COMBAT_TARGET_RETICLE_CONFIG.shadowColor,
        alphaMin: COMBAT_TARGET_RETICLE_CONFIG.alphaMin,
        alphaMax: COMBAT_TARGET_RETICLE_CONFIG.alphaMax,
        pulseMs: COMBAT_TARGET_RETICLE_CONFIG.pulseMs,
    };
}

export function shouldShowCombatTargetReticle(
    current: number,
    max: number,
    isCombatEvent: boolean,
): boolean {
    if (!isCombatEvent) return false;
    if (!Number.isFinite(max) || max <= 1) return true;
    return shouldShowCombatHpBar(current, max);
}

export function combatTargetReticleAlpha(progress: number): number {
    const t = clamp01(progress);
    const pulse = (1 - Math.cos(t * Math.PI * 2)) / 2;
    return lerp(
        COMBAT_TARGET_RETICLE_CONFIG.alphaMax,
        COMBAT_TARGET_RETICLE_CONFIG.alphaMin,
        pulse,
    );
}

export function buildCombatHpBarTweenFrame(
    from: CombatHpBarTweenPoint,
    to: CombatHpBarTweenPoint,
    progress: number,
): CombatHpBarTweenPoint {
    const t = clamp01(progress);
    return {
        fillWidth: Math.round(lerp(from.fillWidth, to.fillWidth, t)),
        fillColor: interpolateColor(from.fillColor, to.fillColor, t),
    };
}

export function shouldShowCombatHpBar(current: number, max: number): boolean {
    return normalizeMaxHp(max) > 1 && normalizeCurrentHp(current, normalizeMaxHp(max)) > 0;
}

export function buildCombatFeedbackModel(
    previous: number,
    current: number,
    max: number,
): CombatFeedbackModel {
    const maxHp = normalizeMaxHp(max);
    const previousHp = normalizeCurrentHp(previous, maxHp);
    const currentHp = normalizeCurrentHp(current, maxHp);
    const damage = Math.max(0, previousHp - currentHp);

    if (damage <= 0) {
        return {
            kind: "none",
            label: "",
            damage: 0,
            popupDurationMs: 0,
            effectDurationMs: 0,
            shakePx: 0,
            flashAlpha: 0,
            dropPx: 0,
        };
    }

    if (currentHp <= 0) {
        return {
            kind: "faint",
            label: formatGameplayTemplate(COMBAT_DAMAGE_LABEL_TEMPLATE, { damage }),
            damage,
            popupDurationMs: COMBAT_DAMAGE_POPUP_MS,
            effectDurationMs: COMBAT_FAINT_EFFECT_MS,
            shakePx: 2,
            flashAlpha: 0.5,
            dropPx: 40,
        };
    }

    return {
        kind: "hit",
        label: formatGameplayTemplate(COMBAT_DAMAGE_LABEL_TEMPLATE, { damage }),
        damage,
        popupDurationMs: COMBAT_DAMAGE_POPUP_MS,
        effectDurationMs: COMBAT_HIT_EFFECT_MS,
        shakePx: 5,
        flashAlpha: 0.45,
        dropPx: 0,
    };
}

function normalizeMaxHp(value: number): number {
    return Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1;
}

function normalizeCurrentHp(value: number, maxHp: number): number {
    const current = Number.isFinite(value) ? Math.round(value) : 0;
    return Math.max(0, Math.min(maxHp, current));
}

function normalizeDimension(value: number, fallback: number): number {
    return Number.isFinite(value) ? Math.max(1, Math.round(value)) : fallback;
}

function clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, progress: number): number {
    return from + (to - from) * progress;
}

function interpolateColor(from: number, to: number, progress: number): number {
    const fromRgb = splitRgb(from);
    const toRgb = splitRgb(to);
    const r = Math.round(lerp(fromRgb.r, toRgb.r, progress));
    const g = Math.round(lerp(fromRgb.g, toRgb.g, progress));
    const b = Math.round(lerp(fromRgb.b, toRgb.b, progress));
    return (r << 16) | (g << 8) | b;
}

function splitRgb(color: number): { r: number; g: number; b: number } {
    const value = Number.isFinite(color) ? Math.max(0, Math.min(0xffffff, Math.round(color))) : 0;
    return {
        r: (value >> 16) & 0xff,
        g: (value >> 8) & 0xff,
        b: value & 0xff,
    };
}
