import { describe, it, expect } from 'vitest';
import {
    type BestiaryRecord,
    type BestiaryState,
    bestiaryTier,
    markSeen,
    markCaught,
    isFullyDiscovered,
    progressRatio,
    listByTier,
    emptyBestiary,
} from '../../src/modules/main/bestiary';

/**
 * T4-14: bestiary seen/caught tracker.
 *
 * Pure state machine over { seenAt, caughtAt } per species. The
 * runtime (encounter.ts onAppear, encounter catch-resolve) calls
 * markSeen / markCaught with a species id and a timestamp; the
 * bestiary view reads tier(species) to decide what to render:
 *
 *   'unknown'  — never encountered         (silhouette only)
 *   'seen'     — witnessed, not captured   (sprite + "?" stats)
 *   'caught'   — captured at least once    (full dex entry)
 *
 * Everything is pure: markSeen/markCaught return a NEW state; callers
 * persist the returned state to SQLite. Input is never mutated.
 */

const t1 = new Date('2026-04-01T00:00:00Z');
const t2 = new Date('2026-04-02T00:00:00Z');
const t3 = new Date('2026-04-03T00:00:00Z');

describe('emptyBestiary', () => {
    it('returns an empty record set', () => {
        expect(emptyBestiary()).toEqual({});
    });
});

describe('bestiaryTier', () => {
    it('returns "unknown" for species never recorded', () => {
        expect(bestiaryTier({}, 'applepup')).toBe('unknown');
    });

    it('returns "seen" when record has seenAt but no caughtAt', () => {
        const state: BestiaryState = {
            applepup: { seenAt: t1.toISOString() },
        };
        expect(bestiaryTier(state, 'applepup')).toBe('seen');
    });

    it('returns "caught" when record has caughtAt (regardless of seenAt)', () => {
        const state: BestiaryState = {
            applepup: { seenAt: t1.toISOString(), caughtAt: t2.toISOString() },
        };
        expect(bestiaryTier(state, 'applepup')).toBe('caught');
    });

    it('returns "caught" even if seenAt is missing but caughtAt set', () => {
        // Edge case: starter ceremony grants caught without a prior sighting.
        const state: BestiaryState = {
            mireling: { caughtAt: t1.toISOString() },
        };
        expect(bestiaryTier(state, 'mireling')).toBe('caught');
    });
});

describe('markSeen', () => {
    it('adds a new seen record with the given timestamp', () => {
        const next = markSeen({}, 'applepup', t1);
        expect(next['applepup']).toEqual({ seenAt: t1.toISOString() });
    });

    it('preserves caughtAt if already caught — no regression', () => {
        const prev: BestiaryState = {
            applepup: { seenAt: t1.toISOString(), caughtAt: t2.toISOString() },
        };
        const next = markSeen(prev, 'applepup', t3);
        expect(next['applepup'].caughtAt).toBe(t2.toISOString());
    });

    it('updates seenAt to earliest timestamp when re-seen earlier', () => {
        // Time-travel / migration edge: if we get an older sighting
        // (e.g. import from legacy save), keep the EARLIEST seenAt.
        const prev: BestiaryState = {
            applepup: { seenAt: t2.toISOString() },
        };
        const next = markSeen(prev, 'applepup', t1);
        expect(next['applepup'].seenAt).toBe(t1.toISOString());
    });

    it('keeps original seenAt when re-seen later', () => {
        const prev: BestiaryState = {
            applepup: { seenAt: t1.toISOString() },
        };
        const next = markSeen(prev, 'applepup', t3);
        expect(next['applepup'].seenAt).toBe(t1.toISOString());
    });

    it('does not mutate input state', () => {
        const prev: BestiaryState = { applepup: { seenAt: t2.toISOString() } };
        const snapshot = JSON.parse(JSON.stringify(prev));
        markSeen(prev, 'applepup', t1);
        expect(prev).toEqual(snapshot);
    });
});

describe('markCaught', () => {
    it('adds a caught record (with seenAt filled in if absent)', () => {
        const next = markCaught({}, 'applepup', t1);
        expect(next['applepup']).toEqual({
            seenAt: t1.toISOString(),
            caughtAt: t1.toISOString(),
        });
    });

    it('preserves prior seenAt when caught later', () => {
        const prev: BestiaryState = { applepup: { seenAt: t1.toISOString() } };
        const next = markCaught(prev, 'applepup', t2);
        expect(next['applepup']).toEqual({
            seenAt: t1.toISOString(),
            caughtAt: t2.toISOString(),
        });
    });

    it('keeps earliest caughtAt when caught again earlier (migration edge)', () => {
        const prev: BestiaryState = {
            applepup: { seenAt: t1.toISOString(), caughtAt: t3.toISOString() },
        };
        const next = markCaught(prev, 'applepup', t2);
        expect(next['applepup'].caughtAt).toBe(t2.toISOString());
    });

    it('does not mutate input state', () => {
        const prev: BestiaryState = { applepup: { seenAt: t1.toISOString() } };
        const snapshot = JSON.parse(JSON.stringify(prev));
        markCaught(prev, 'applepup', t2);
        expect(prev).toEqual(snapshot);
    });
});

describe('isFullyDiscovered', () => {
    const all = ['applepup', 'drowsy_owl', 'green_dragon'];

    it('false when no species recorded', () => {
        expect(isFullyDiscovered({}, all)).toBe(false);
    });

    it('false when only some caught', () => {
        const state: BestiaryState = {
            applepup: { caughtAt: t1.toISOString() },
            drowsy_owl: { seenAt: t1.toISOString() },
        };
        expect(isFullyDiscovered(state, all)).toBe(false);
    });

    it('true when all species caught', () => {
        const state: BestiaryState = Object.fromEntries(
            all.map((id) => [id, { caughtAt: t1.toISOString() }]),
        );
        expect(isFullyDiscovered(state, all)).toBe(true);
    });

    it('seen-only species do not count as discovered', () => {
        const state: BestiaryState = Object.fromEntries(
            all.map((id) => [id, { seenAt: t1.toISOString() }]),
        );
        expect(isFullyDiscovered(state, all)).toBe(false);
    });

    it('empty species list trivially discovered', () => {
        expect(isFullyDiscovered({}, [])).toBe(true);
    });
});

describe('progressRatio', () => {
    const all = ['a', 'b', 'c', 'd'];

    it('0 when no species recorded', () => {
        expect(progressRatio({}, all)).toBe(0);
    });

    it('only counts caught (not seen)', () => {
        const state: BestiaryState = {
            a: { caughtAt: t1.toISOString() },
            b: { seenAt: t1.toISOString() },
        };
        expect(progressRatio(state, all)).toBe(0.25);
    });

    it('1 when all caught', () => {
        const state: BestiaryState = Object.fromEntries(
            all.map((id) => [id, { caughtAt: t1.toISOString() }]),
        );
        expect(progressRatio(state, all)).toBe(1);
    });

    it('0 when all-species list is empty (no divide-by-zero)', () => {
        expect(progressRatio({}, [])).toBe(0);
    });
});

describe('listByTier', () => {
    it('buckets species into unknown / seen / caught', () => {
        const state: BestiaryState = {
            a: { caughtAt: t1.toISOString() },
            b: { seenAt: t1.toISOString() },
        };
        const all = ['a', 'b', 'c'];
        expect(listByTier(state, all)).toEqual({
            caught: ['a'],
            seen: ['b'],
            unknown: ['c'],
        });
    });

    it('preserves input order within each bucket', () => {
        const state: BestiaryState = {
            a: { caughtAt: t1.toISOString() },
            c: { caughtAt: t1.toISOString() },
        };
        const all = ['a', 'b', 'c'];
        const grouped = listByTier(state, all);
        expect(grouped.caught).toEqual(['a', 'c']);
    });

    it('empty species list → all buckets empty', () => {
        expect(listByTier({}, [])).toEqual({ caught: [], seen: [], unknown: [] });
    });
});

describe('record shape — non-mutating helpers', () => {
    it('BestiaryRecord with only seenAt is valid', () => {
        const r: BestiaryRecord = { seenAt: t1.toISOString() };
        expect(r.seenAt).toBeDefined();
    });

    it('BestiaryRecord with both fields is valid', () => {
        const r: BestiaryRecord = {
            seenAt: t1.toISOString(),
            caughtAt: t2.toISOString(),
        };
        expect(r.caughtAt).toBeDefined();
    });
});
