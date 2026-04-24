import { describe, expect, it } from 'vitest';
import { formatVictoryRewardToast } from '../../src/modules/main/victory-rewards';

describe('formatVictoryRewardToast', () => {
    it('formats XP gain as a victory toast', () => {
        expect(formatVictoryRewardToast({
            kind: 'xp',
            speciesId: 'ashcat',
            amount: 27,
        })).toBe('Ashcat +27 XP');
    });

    it('formats level-up boundaries without blocking dialog input', () => {
        expect(formatVictoryRewardToast({
            kind: 'level',
            speciesId: 'ashcat',
            from: 5,
            to: 6,
        })).toBe('Ashcat L5 -> L6');
    });

    it('formats newly learned moves with display labels', () => {
        expect(formatVictoryRewardToast({
            kind: 'move',
            speciesId: 'ashcat',
            moveId: 'utala_wawa',
        })).toBe('Ashcat learned utala wawa');
    });
});
