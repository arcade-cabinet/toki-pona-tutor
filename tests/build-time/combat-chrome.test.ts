import { describe, expect, it } from "vitest";
import {
    combatChromeDependenciesForObject,
    combatChromePropsForObject,
    type CombatSpriteObject,
} from "../../src/config/combat-chrome-props";
import { COMBAT_TARGET_PARAM } from "../../src/modules/main/combat-visuals";
import {
    COMBAT_DAMAGE_POPUP_MS,
    COMBAT_FAINT_EFFECT_MS,
    COMBAT_HIT_EFFECT_MS,
    COMBAT_HP_BAR_WIDTH,
    COMBAT_HP_TWEEN_MS,
    COMBAT_TARGET_RETICLE_CONFIG,
    buildCombatFeedbackModel,
    buildCombatHpBarModel,
    buildCombatHpBarTweenFrame,
    buildCombatTargetReticleModel,
    combatTargetReticleAlpha,
    shouldShowCombatHpBar,
    shouldShowCombatTargetReticle,
} from "../../src/modules/main/combat-chrome";

describe("combat chrome HP bar model", () => {
    it("uses the canonical HP thresholds and brand colors", () => {
        expect(buildCombatHpBarModel(60, 100)).toMatchObject({
            hpClass: "hp-healthy",
            fillColor: 0x4a9d5a,
            label: "HP 60 / 100",
        });
        expect(buildCombatHpBarModel(50, 100)).toMatchObject({
            hpClass: "hp-wounded",
            fillColor: 0xd98a3f,
            label: "HP 50 / 100",
        });
        expect(buildCombatHpBarModel(20, 100)).toMatchObject({
            hpClass: "hp-critical",
            fillColor: 0xc85a4a,
            label: "HP 20 / 100",
        });
    });

    it("clamps malformed combat HP without overflowing the bar", () => {
        expect(buildCombatHpBarModel(999, 60)).toMatchObject({
            currentHp: 60,
            maxHp: 60,
            ratio: 1,
            fillWidth: COMBAT_HP_BAR_WIDTH - 2,
        });
        expect(buildCombatHpBarModel(-4, 60)).toMatchObject({
            currentHp: 0,
            maxHp: 60,
            ratio: 0,
            fillWidth: 0,
        });
    });

    it("only renders meaningful live combatant HP bars", () => {
        expect(shouldShowCombatHpBar(60, 60)).toBe(true);
        expect(shouldShowCombatHpBar(0, 60)).toBe(false);
        expect(shouldShowCombatHpBar(1, 1)).toBe(false);
    });

    it("interpolates HP width and threshold color for tween frames", () => {
        expect(COMBAT_HP_TWEEN_MS).toBe(400);
        expect(
            buildCombatHpBarTweenFrame(
                { fillWidth: 56, fillColor: 0x4a9d5a },
                { fillWidth: 0, fillColor: 0xc85a4a },
                0.5,
            ),
        ).toEqual({
            fillWidth: 28,
            fillColor: 0x897c52,
        });
    });

    it("clamps HP tween progress outside the animation range", () => {
        expect(
            buildCombatHpBarTweenFrame(
                { fillWidth: 56, fillColor: 0x4a9d5a },
                { fillWidth: 0, fillColor: 0xc85a4a },
                -1,
            ),
        ).toEqual({ fillWidth: 56, fillColor: 0x4a9d5a });
        expect(
            buildCombatHpBarTweenFrame(
                { fillWidth: 56, fillColor: 0x4a9d5a },
                { fillWidth: 0, fillColor: 0xc85a4a },
                2,
            ),
        ).toEqual({ fillWidth: 0, fillColor: 0xc85a4a });
    });

    it("models hit feedback as a short shake and white flash", () => {
        expect(buildCombatFeedbackModel(60, 44, 80)).toMatchObject({
            kind: "hit",
            label: "-16",
            damage: 16,
            popupDurationMs: COMBAT_DAMAGE_POPUP_MS,
            effectDurationMs: COMBAT_HIT_EFFECT_MS,
            shakePx: 5,
            flashAlpha: 0.45,
            dropPx: 0,
        });
    });

    it("models faint feedback as a longer fade/drop cue", () => {
        expect(buildCombatFeedbackModel(12, 0, 80)).toMatchObject({
            kind: "faint",
            label: "-12",
            damage: 12,
            popupDurationMs: COMBAT_DAMAGE_POPUP_MS,
            effectDurationMs: COMBAT_FAINT_EFFECT_MS,
            shakePx: 2,
            flashAlpha: 0.5,
            dropPx: 40,
        });
    });

    it("does not emit combat feedback for healing or unchanged HP", () => {
        expect(buildCombatFeedbackModel(40, 40, 80).kind).toBe("none");
        expect(buildCombatFeedbackModel(40, 52, 80).kind).toBe("none");
    });

    it("models a sprite-local target reticle for live combat events", () => {
        expect(COMBAT_TARGET_RETICLE_CONFIG.primaryColor).toBe(0x4fd8ff);
        expect(buildCombatTargetReticleModel(40, 32)).toMatchObject({
            width: 54,
            height: 46,
            cornerLength: 9,
            strokeWidth: 3,
            pulseMs: 900,
        });
        expect(shouldShowCombatTargetReticle(44, 60, true)).toBe(true);
        expect(shouldShowCombatTargetReticle(0, 60, true)).toBe(false);
        expect(shouldShowCombatTargetReticle(0, 0, true)).toBe(true);
        expect(shouldShowCombatTargetReticle(44, 60, false)).toBe(false);
        expect(combatTargetReticleAlpha(0)).toBeCloseTo(COMBAT_TARGET_RETICLE_CONFIG.alphaMax);
        expect(combatTargetReticleAlpha(0.5)).toBeCloseTo(COMBAT_TARGET_RETICLE_CONFIG.alphaMin);
    });
});

describe("combat chrome component wiring props", () => {
    it("passes live action-battle event HP, max HP, and hitbox width to chrome components", () => {
        const object = {
            _type: "event",
            hpSignal: () => 44,
            hitbox: () => ({ w: 40, h: 32 }),
            _param: () => ({ maxHp: 60, [COMBAT_TARGET_PARAM]: 1 }),
        } as CombatSpriteObject;

        expect(combatChromePropsForObject(object)).toEqual({
            currentHp: 44,
            maxHp: 60,
            hitboxWidth: 40,
            hitboxHeight: 32,
            isCombatEvent: true,
        });
        expect(combatChromeDependenciesForObject(object)).toHaveLength(3);
    });

    it("keeps non-battle events hidden from combat chrome even when they have engine HP", () => {
        const object = {
            _type: "event",
            hpSignal: () => 44,
            hitbox: () => ({ w: 40, h: 32 }),
            _param: () => ({ maxHp: 60 }),
        } as CombatSpriteObject;

        expect(combatChromePropsForObject(object).isCombatEvent).toBe(false);
    });

    it("accepts configured rival/gym/final event ids as combat targets on the client", () => {
        const object = {
            id: "jan-ike",
            _type: "event",
            hpSignal: () => 44,
            hitbox: () => ({ w: 40, h: 32 }),
            _param: () => ({ maxHp: 60 }),
        } as CombatSpriteObject;

        expect(combatChromePropsForObject(object).isCombatEvent).toBe(true);
    });

    it("keeps non-event sprites hidden from combat chrome while preserving stable dependencies", () => {
        const object = {
            _type: "player",
            hpSignal: () => 44,
            hitbox: () => ({ w: 40, h: 32 }),
            _param: () => ({ maxHp: 60 }),
        } as CombatSpriteObject;

        expect(combatChromePropsForObject(object)).toMatchObject({
            isCombatEvent: false,
            currentHp: 44,
            maxHp: 60,
            hitboxHeight: 32,
        });
        expect(combatChromeDependenciesForObject(object)).toEqual([undefined]);
    });
});
