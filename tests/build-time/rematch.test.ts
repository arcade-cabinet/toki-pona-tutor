import { describe, it, expect } from 'vitest';
import {
    rematchStatus,
    scaledRematchXp,
    scaledRematchLevel,
    rematchReward,
    applyRematchOutcome,
    REMATCH_COOLDOWN_HOURS,
    type RematchRecord,
} from '../../src/modules/main/rematch';

const cleared = { flags: { game_cleared: '1' } };
const uncleared = { flags: {} };
const now = new Date('2026-04-20T00:00:00Z');

const record = (overrides: Partial<RematchRecord> = {}): RematchRecord => ({
    badgeFlag: 'badge_sewi',
    timesCleared: 0,
    ...overrides,
});

describe('rematchStatus', () => {
    it('locked when game not cleared', () => {
        expect(rematchStatus(record(), uncleared, now)).toBe('locked');
    });

    it('available for first-ever rematch after clear', () => {
        expect(rematchStatus(record(), cleared, now)).toBe('available');
    });

    it('on_cooldown within 12h of last victory', () => {
        const last = new Date(now.getTime() - 3 * 3_600_000).toISOString(); // 3h ago
        const r = record({ timesCleared: 1, lastVictoryAt: last });
        expect(rematchStatus(r, cleared, now)).toBe('on_cooldown');
    });

    it('available at exactly 12h', () => {
        const last = new Date(now.getTime() - REMATCH_COOLDOWN_HOURS * 3_600_000).toISOString();
        const r = record({ timesCleared: 1, lastVictoryAt: last });
        expect(rematchStatus(r, cleared, now)).toBe('available');
    });

    it('available > 12h later', () => {
        const last = new Date(now.getTime() - 24 * 3_600_000).toISOString();
        const r = record({ timesCleared: 5, lastVictoryAt: last });
        expect(rematchStatus(r, cleared, now)).toBe('available');
    });

    it('invalid lastVictoryAt falls through to available', () => {
        const r = record({ timesCleared: 1, lastVictoryAt: 'not a date' });
        expect(rematchStatus(r, cleared, now)).toBe('available');
    });
});

describe('scaledRematchXp — 50% per clear, cap 4×', () => {
    it('first rematch (timesCleared=0) → base', () => {
        expect(scaledRematchXp('badge_sewi', 0)).toBe(120);
    });

    it('second rematch (timesCleared=1) → 1.5×', () => {
        expect(scaledRematchXp('badge_sewi', 1)).toBe(180);
    });

    it('fourth rematch → 2.5×', () => {
        expect(scaledRematchXp('badge_sewi', 3)).toBe(300);
    });

    it('caps at 4× after 6+ clears', () => {
        expect(scaledRematchXp('badge_sewi', 6)).toBe(480);
        expect(scaledRematchXp('badge_sewi', 100)).toBe(480);
    });

    it('unknown badge defaults to 100 base', () => {
        expect(scaledRematchXp('badge_unknown', 0)).toBe(100);
    });

    it('negative timesCleared clamps to 0', () => {
        expect(scaledRematchXp('badge_sewi', -5)).toBe(120);
    });
});

describe('scaledRematchLevel — +10 per clear, cap 50', () => {
    it('first rematch: +0', () => {
        expect(scaledRematchLevel(10, 0)).toBe(10);
    });

    it('second rematch: +10', () => {
        expect(scaledRematchLevel(10, 1)).toBe(20);
    });

    it('caps at level 50', () => {
        expect(scaledRematchLevel(30, 5)).toBe(50);
        expect(scaledRematchLevel(10, 10)).toBe(50);
    });

    it('negative clamps to 0', () => {
        expect(scaledRematchLevel(10, -3)).toBe(10);
    });
});

describe('rematchReward — cycling drop table', () => {
    it('rematch #1 → heavy_capture_pod', () => {
        expect(rematchReward('badge_sewi', 1)).toEqual({ kind: 'item', itemId: 'heavy_capture_pod', count: 1 });
    });

    it('rematch #2 → 3× spring_tonic', () => {
        expect(rematchReward('badge_sewi', 2)).toEqual({ kind: 'item', itemId: 'spring_tonic', count: 3 });
    });

    it('rematch #3 → species_egg', () => {
        expect(rematchReward('badge_sewi', 3)).toEqual({ kind: 'item', itemId: 'species_egg', count: 1 });
    });

    it('rematch #4+ → trophy flag', () => {
        expect(rematchReward('badge_sewi', 4)).toEqual({ kind: 'flag', flagId: 'trophy_badge_sewi' });
        expect(rematchReward('badge_telo', 12)).toEqual({ kind: 'flag', flagId: 'trophy_badge_telo' });
    });
});

describe('applyRematchOutcome', () => {
    it('victory increments counter + stamps timestamp', () => {
        const r = applyRematchOutcome(record({ timesCleared: 1 }), 'victory', now);
        expect(r.timesCleared).toBe(2);
        expect(r.lastVictoryAt).toBe('2026-04-20T00:00:00.000Z');
    });

    it('defeat leaves record unchanged (no cooldown penalty)', () => {
        const input = record({ timesCleared: 1, lastVictoryAt: '2026-01-01T00:00:00Z' });
        const r = applyRematchOutcome(input, 'defeat', now);
        expect(r).toEqual(input);
    });

    it('victory from fresh (timesCleared=0) → 1', () => {
        const r = applyRematchOutcome(record(), 'victory', now);
        expect(r.timesCleared).toBe(1);
    });

    it('does not mutate input record', () => {
        const input = record({ timesCleared: 5 });
        const snapshot = { ...input };
        applyRematchOutcome(input, 'victory', now);
        expect(input).toEqual(snapshot);
    });
});
