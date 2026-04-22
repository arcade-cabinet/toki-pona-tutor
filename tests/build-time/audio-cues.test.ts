import { describe, expect, it } from 'vitest';
import { isBattleAiTargetingPlayer, isBattleEventInRange } from '../../src/modules/main/audio-cues';

describe('isBattleEventInRange', () => {
    it('accepts live BattleAi events inside the action range', () => {
        expect(isBattleEventInRange(
            { x: 128, y: 128 },
            {
                battleAi: {},
                hp: 20,
                x: () => 160,
                y: () => 128,
            },
        )).toBe(true);
    });

    it('ignores defeated or non-battle events', () => {
        expect(isBattleEventInRange(
            { x: 128, y: 128 },
            {
                battleAi: {},
                hp: 0,
                x: () => 160,
                y: () => 128,
            },
        )).toBe(false);

        expect(isBattleEventInRange(
            { x: 128, y: 128 },
            {
                x: () => 160,
                y: () => 128,
            },
        )).toBe(false);
    });

    it('ignores BattleAi events outside the action range', () => {
        expect(isBattleEventInRange(
            { x: 128, y: 128 },
            {
                battleAi: {},
                hp: 20,
                x: () => 240,
                y: () => 128,
            },
        )).toBe(false);
    });
});

describe('isBattleAiTargetingPlayer', () => {
    it('accepts active BattleAi state targeting the current player', () => {
        const player = { id: 'player-1' };

        expect(isBattleAiTargetingPlayer(player, {
            battleAi: {
                getState: () => 'combat',
                getTarget: () => ({ id: 'player-1' }),
            },
        })).toBe(true);
    });

    it('rejects idle AI and other targets', () => {
        const player = { id: 'player-1' };

        expect(isBattleAiTargetingPlayer(player, {
            battleAi: {
                getState: () => 'idle',
                getTarget: () => ({ id: 'player-1' }),
            },
        })).toBe(false);

        expect(isBattleAiTargetingPlayer(player, {
            battleAi: {
                getState: () => 'combat',
                getTarget: () => ({ id: 'player-2' }),
            },
        })).toBe(false);
    });
});
