import { describe, expect, it, vi } from 'vitest';
import {
    COMBAT_FAINT_ANIMATION_ID,
    playCombatFaintVisual,
    playCombatHurtVisual,
    updateCombatDamageVisuals,
    type CombatVisualEvent,
} from '../../src/modules/main/combat-visuals';
import { COMBAT_FAINT_EFFECT_MS, COMBAT_HIT_EFFECT_MS } from '../../src/modules/main/combat-chrome';

function fakeEvent(overrides: Partial<CombatVisualEvent> = {}) {
    const showComponentAnimation = vi.fn();
    const event: CombatVisualEvent = {
        hp: 60,
        x: () => 64,
        y: () => 96,
        hitbox: () => ({ w: 40, h: 32 }),
        graphics: () => ['combatant_rogue_hooded'],
        getCurrentMap: () => ({ showComponentAnimation }),
        setGraphicAnimation: vi.fn(),
        flash: vi.fn(),
        ...overrides,
    };
    return { event, showComponentAnimation };
}

describe('combat body visuals', () => {
    it('plays the body hurt animation and white flash for nonlethal HP drops', () => {
        const { event } = fakeEvent();

        updateCombatDamageVisuals(event);
        event.hp = 44;
        updateCombatDamageVisuals(event);

        expect(event.setGraphicAnimation).toHaveBeenCalledWith('hurt', 1);
        expect(event.flash).toHaveBeenCalledWith({
            type: 'both',
            tint: 0xffffff,
            alpha: 0.45,
            duration: COMBAT_HIT_EFFECT_MS,
            cycles: 1,
        });
    });

    it('emits a faint clone animation at the hitbox center before the event is removed', () => {
        const { event, showComponentAnimation } = fakeEvent();

        updateCombatDamageVisuals(event);
        event.hp = 0;
        updateCombatDamageVisuals(event);

        expect(showComponentAnimation).toHaveBeenCalledWith(
            COMBAT_FAINT_ANIMATION_ID,
            { x: 84, y: 112 },
            {
                graphic: 'combatant_rogue_hooded',
                animationName: 'hurt',
                duration: COMBAT_FAINT_EFFECT_MS,
                dropPx: 40,
                fadeStart: 0.35,
            },
        );
    });

    it('supports explicit final-boss death animation params', () => {
        const { event, showComponentAnimation } = fakeEvent();

        expect(playCombatFaintVisual(event, {
            graphic: 'green_dragon_death',
            animationName: 'death',
            durationMs: 1200,
            dropPx: 12,
            fadeStart: 0.78,
        })).toBe(true);

        expect(showComponentAnimation).toHaveBeenCalledWith(
            COMBAT_FAINT_ANIMATION_ID,
            { x: 84, y: 112 },
            {
                graphic: 'green_dragon_death',
                animationName: 'death',
                duration: 1200,
                dropPx: 12,
                fadeStart: 0.78,
            },
        );
    });

    it('does not emit duplicate faint clones for the same defeated event', () => {
        const { event, showComponentAnimation } = fakeEvent();

        expect(playCombatFaintVisual(event)).toBe(true);
        expect(playCombatFaintVisual(event)).toBe(false);

        expect(showComponentAnimation).toHaveBeenCalledTimes(1);
    });

    it('can suppress hurt animation while keeping body flash feedback', () => {
        const { event } = fakeEvent();

        expect(playCombatHurtVisual(event, false)).toBe(true);

        expect(event.setGraphicAnimation).not.toHaveBeenCalled();
        expect(event.flash).toHaveBeenCalled();
    });
});
