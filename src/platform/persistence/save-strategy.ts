import type { RpgPlayer, SaveStorageStrategy } from '@rpgjs/server';
import type { SaveSlot, SaveSlotList, SaveSlotMeta } from '@rpgjs/common';
import { getDatabase, saveWebStore } from './database';

export interface CapacitorSaveOptions {
    namespace?: string;
}

export class CapacitorSaveStorageStrategy implements SaveStorageStrategy {
    private namespace: string;

    constructor(options: CapacitorSaveOptions = {}) {
        this.namespace = options.namespace ?? 'default';
    }

    async list(player: RpgPlayer): Promise<SaveSlotList> {
        const slots = await this.readSlots(player);
        return this.stripSnapshots(slots);
    }

    async get(player: RpgPlayer, index: number): Promise<SaveSlot | null> {
        const slots = await this.readSlots(player);
        return slots[index] ?? null;
    }

    async save(player: RpgPlayer, index: number, snapshot: string, meta: SaveSlotMeta): Promise<void> {
        const slots = await this.readSlots(player);
        slots[index] = { ...(slots[index] ?? {}), ...meta, snapshot };
        await this.writeSlots(player, slots);
    }

    async delete(player: RpgPlayer, index: number): Promise<void> {
        const slots = await this.readSlots(player);
        slots[index] = null;
        await this.writeSlots(player, slots);
    }

    private playerKey(player: RpgPlayer): string {
        return `${this.namespace}:${player.id ?? 'anonymous'}`;
    }

    private async readSlots(player: RpgPlayer): Promise<Array<SaveSlot | null>> {
        const db = await getDatabase();
        const result = await db.query(
            `SELECT data FROM saves WHERE player_key = ? LIMIT 1`,
            [this.playerKey(player)],
        );
        const row = result.values?.[0];
        if (!row) return [];
        try {
            const parsed = JSON.parse(row.data as string);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    private async writeSlots(player: RpgPlayer, slots: Array<SaveSlot | null>): Promise<void> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.run(
            `INSERT INTO saves (player_key, data, saved_at)
             VALUES (?, ?, ?)
             ON CONFLICT(player_key) DO UPDATE SET data = excluded.data, saved_at = excluded.saved_at`,
            [this.playerKey(player), JSON.stringify(slots), now],
        );
        await saveWebStore();
    }

    private stripSnapshots(slots: Array<SaveSlot | null>): SaveSlotList {
        return slots.map((slot) => {
            if (!slot) return null;
            const { snapshot: _snapshot, ...meta } = slot;
            return meta;
        });
    }
}
