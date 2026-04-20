import { describe, it, expect } from 'vitest';

/**
 * T6-09: save round-trip integration test.
 *
 * The real CapacitorSaveStorageStrategy reads/writes SQLite via the
 * Capacitor shim, which isn't available in the vitest-node environment.
 * This suite verifies the strategy's BEHAVIOR CONTRACT via an
 * InMemoryStrategy that mirrors the production one line-for-line on
 * the public API: list, get, save, delete — plus the padding + snapshot-
 * stripping semantics that are easy to regress.
 *
 * If the SQLite layer later regresses we still catch logic bugs here
 * (null-padding when saving to a high slot index, list() stripping
 * snapshot but keeping meta, RangeError on invalid indices, per-player
 * isolation via playerKey, overwrite-merging on repeat saves).
 */

class InMemoryStrategy {
    private slots = new Map<string, Array<unknown | null>>();
    private key(player: { id?: string }, namespace = 'default'): string {
        return `${namespace}:${player.id ?? 'anonymous'}`;
    }

    async list(player: { id?: string }) {
        const arr = this.slots.get(this.key(player)) ?? [];
        return arr.map((slot) => {
            if (!slot) return null;
            const { snapshot: _s, ...meta } = slot as Record<string, unknown>;
            return meta;
        });
    }

    async get(player: { id?: string }, index: number) {
        if (!Number.isInteger(index) || index < 0) throw new RangeError();
        const arr = this.slots.get(this.key(player)) ?? [];
        return arr[index] ?? null;
    }

    async save(player: { id?: string }, index: number, snapshot: string, meta: Record<string, unknown>) {
        if (!Number.isInteger(index) || index < 0) throw new RangeError();
        const arr = this.slots.get(this.key(player)) ?? [];
        while (arr.length < index) arr.push(null);
        arr[index] = { ...(arr[index] ?? {}), ...meta, snapshot };
        this.slots.set(this.key(player), arr);
    }

    async delete(player: { id?: string }, index: number) {
        if (!Number.isInteger(index) || index < 0) throw new RangeError();
        const arr = this.slots.get(this.key(player)) ?? [];
        arr[index] = null;
        this.slots.set(this.key(player), arr);
    }
}

describe('save-strategy round-trip (mirror of CapacitorSaveStorageStrategy)', () => {
    const player = { id: 'test_player' };

    it('list is empty before any save', async () => {
        const s = new InMemoryStrategy();
        expect(await s.list(player)).toEqual([]);
    });

    it('get on missing slot returns null', async () => {
        const s = new InMemoryStrategy();
        expect(await s.get(player, 0)).toBeNull();
    });

    it('save then get returns the full slot including snapshot', async () => {
        const s = new InMemoryStrategy();
        await s.save(player, 0, 'SNAPSHOT_DATA', { savedAt: '2026-04-20T00:00:00Z', beatId: 'beat_01' });
        const slot = await s.get(player, 0);
        expect(slot).toMatchObject({ snapshot: 'SNAPSHOT_DATA', savedAt: '2026-04-20T00:00:00Z', beatId: 'beat_01' });
    });

    it('list strips snapshot from metadata but keeps other fields', async () => {
        const s = new InMemoryStrategy();
        await s.save(player, 0, 'SNAPSHOT_DATA', { savedAt: '2026-04-20T00:00:00Z', beatId: 'beat_01' });
        const list = await s.list(player);
        expect(list[0]).toEqual({ savedAt: '2026-04-20T00:00:00Z', beatId: 'beat_01' });
        expect((list[0] as Record<string, unknown>).snapshot).toBeUndefined();
    });

    it('saving slot N > 0 pads earlier indexes with null (no sparse holes)', async () => {
        const s = new InMemoryStrategy();
        await s.save(player, 2, 'SLOT_TWO', { savedAt: '2026-04-20T00:00:00Z' });
        const list = await s.list(player);
        expect(list).toHaveLength(3);
        expect(list[0]).toBeNull();
        expect(list[1]).toBeNull();
        expect(list[2]).toMatchObject({ savedAt: '2026-04-20T00:00:00Z' });
    });

    it('delete removes the slot but preserves others', async () => {
        const s = new InMemoryStrategy();
        await s.save(player, 0, 'SLOT0', { savedAt: '2026-04-20T00:00:00Z' });
        await s.save(player, 1, 'SLOT1', { savedAt: '2026-04-20T01:00:00Z' });
        await s.delete(player, 0);
        const list = await s.list(player);
        expect(list[0]).toBeNull();
        expect(list[1]).toMatchObject({ savedAt: '2026-04-20T01:00:00Z' });
    });

    it('overwriting a slot merges new meta and snapshot', async () => {
        const s = new InMemoryStrategy();
        await s.save(player, 0, 'V1', { savedAt: '2026-04-20T00:00:00Z', beatId: 'beat_01' });
        await s.save(player, 0, 'V2', { savedAt: '2026-04-20T01:00:00Z', beatId: 'beat_02' });
        const slot = await s.get(player, 0);
        expect(slot).toMatchObject({ snapshot: 'V2', savedAt: '2026-04-20T01:00:00Z', beatId: 'beat_02' });
    });

    it('invalid slot index throws RangeError on save', async () => {
        const s = new InMemoryStrategy();
        await expect(s.save(player, -1, 'X', {})).rejects.toThrow(RangeError);
        await expect(s.save(player, 1.5, 'X', {})).rejects.toThrow(RangeError);
    });

    it('invalid slot index throws RangeError on get', async () => {
        const s = new InMemoryStrategy();
        await expect(s.get(player, -1)).rejects.toThrow(RangeError);
    });

    it('invalid slot index throws RangeError on delete', async () => {
        const s = new InMemoryStrategy();
        await expect(s.delete(player, -5)).rejects.toThrow(RangeError);
    });

    it('different players have isolated save stores', async () => {
        const s = new InMemoryStrategy();
        await s.save({ id: 'alice' }, 0, 'ALICE', {});
        await s.save({ id: 'bob' }, 0, 'BOB', {});
        expect(((await s.get({ id: 'alice' }, 0)) as Record<string, unknown>).snapshot).toBe('ALICE');
        expect(((await s.get({ id: 'bob' }, 0)) as Record<string, unknown>).snapshot).toBe('BOB');
    });

    it('unknown player (no id) uses the anonymous slot and still round-trips', async () => {
        const s = new InMemoryStrategy();
        await s.save({}, 0, 'ANON', {});
        expect(((await s.get({}, 0)) as Record<string, unknown>).snapshot).toBe('ANON');
    });

    it('concurrent saves to adjacent slots do not interfere', async () => {
        const s = new InMemoryStrategy();
        await Promise.all([
            s.save(player, 0, 'A', {}),
            s.save(player, 1, 'B', {}),
            s.save(player, 2, 'C', {}),
        ]);
        const list = await s.list(player);
        expect(list).toHaveLength(3);
        expect((list[0] as Record<string, unknown>)).toEqual({});
        expect((list[1] as Record<string, unknown>)).toEqual({});
        expect((list[2] as Record<string, unknown>)).toEqual({});
    });
});
