import { describe, expect, it } from 'vitest';
import { Animation, Direction } from '@rpgjs/common';
import {
    COMBATANT_SPRITESHEETS,
    MAGE_FEM_RED,
    MAGE_HOODED_BROWN,
    ROGUE_HOODED,
    WARRIOR_AXE,
    WARRIOR_PALADIN,
} from '../../src/config/combatant-sprites';

describe('combatant spritesheets', () => {
    it('register the extended 31-row trainer layout instead of the 8-row RMS preset', () => {
        for (const sheet of COMBATANT_SPRITESHEETS) {
            expect(sheet.framesWidth).toBe(4);
            expect(sheet.framesHeight).toBe(31);
        }
    });

    it('maps stand and walk to the correct directional overworld rows', () => {
        const idleLeft = ROGUE_HOODED.textures.idle.animations({ direction: Direction.Left })[0];
        const standLeft = ROGUE_HOODED.textures[Animation.Stand].animations({ direction: Direction.Left })[0];
        const walkUp = ROGUE_HOODED.textures[Animation.Walk].animations({ direction: Direction.Up })[0];

        expect(idleLeft).toEqual([{ time: 0, frameX: 1, frameY: 4 }]);
        expect(standLeft).toEqual([{ time: 0, frameX: 1, frameY: 4 }]);
        expect(walkUp).toEqual([
            { time: 0, frameX: 0, frameY: 9 },
            { time: 10, frameX: 1, frameY: 9 },
            { time: 20, frameX: 2, frameY: 9 },
            { time: 30, frameX: 3, frameY: 9 },
            { time: 40 },
        ]);
    });

    it('exposes an attack strip for every trainer used by action-battle AI', () => {
        for (const [sheet, expectedRow] of [
            [MAGE_FEM_RED, 21],
            [MAGE_HOODED_BROWN, 21],
            [ROGUE_HOODED, 21],
            [WARRIOR_AXE, 21],
            [WARRIOR_PALADIN, 21],
        ] as const) {
            expect(sheet.textures[Animation.Attack]).toBeDefined();
            expect(sheet.textures[Animation.Attack].animations({ direction: Direction.Down })[0]).toEqual([
                { time: 0, frameX: 0, frameY: expectedRow },
                { time: 6, frameX: 1, frameY: expectedRow },
                { time: 12, frameX: 2, frameY: expectedRow },
                { time: 18, frameX: 3, frameY: expectedRow },
                { time: 24 },
            ]);
        }
    });

    it('keeps the caster and paladin aliases needed by future skill/defense hooks', () => {
        expect(MAGE_FEM_RED.textures[Animation.Skill]).toBeDefined();
        expect(MAGE_HOODED_BROWN.textures[Animation.Skill]).toBeDefined();
        expect(WARRIOR_PALADIN.textures[Animation.Defense]).toBeDefined();
    });
});
