import type { RpgPlayer, SaveStorageStrategy } from "@rpgjs/server";
import type { SaveSlot, SaveSlotList, SaveSlotMeta } from "@rpgjs/common";
import { getDatabase, saveWebStore } from "./database";

export interface CapacitorSaveOptions {
    namespace?: string;
}

export class CapacitorSaveStorageStrategy implements SaveStorageStrategy {
    private namespace: string;

    constructor(options: CapacitorSaveOptions = {}) {
        this.namespace = options.namespace ?? "default";
    }

    private assertValidIndex(index: number): void {
        if (!Number.isInteger(index) || index < 0) {
            throw new RangeError(`Invalid save slot index: ${index}`);
        }
    }

    async list(player: RpgPlayer): Promise<SaveSlotList> {
        const slots = await this.readSlots(player);
        return this.stripSnapshots(slots);
    }

    async get(player: RpgPlayer, index: number): Promise<SaveSlot | null> {
        this.assertValidIndex(index);
        const slots = await this.readSlots(player);
        return slots[index] ?? null;
    }

    async save(
        player: RpgPlayer,
        index: number,
        snapshot: string,
        meta: SaveSlotMeta,
    ): Promise<void> {
        this.assertValidIndex(index);
        const slots = await this.readSlots(player);
        // Pad with explicit nulls to avoid sparse-array holes when index > length.
        while (slots.length < index) {
            slots.push(null);
        }
        slots[index] = { ...(slots[index] ?? {}), ...meta, snapshot };
        await this.writeSlots(player, slots);
    }

    async delete(player: RpgPlayer, index: number): Promise<void> {
        this.assertValidIndex(index);
        const slots = await this.readSlots(player);
        slots[index] = null;
        await this.writeSlots(player, slots);
    }

    private playerKey(player: RpgPlayer): string {
        const connectionId = (player as unknown as { conn?: { id?: string } }).conn?.id;
        return `${this.namespace}:${connectionId ?? player.id ?? "anonymous"}`;
    }

    private async readSlots(player: RpgPlayer): Promise<Array<SaveSlot | null>> {
        const db = await getDatabase();
        const result = await db.query(`SELECT data FROM saves WHERE player_key = ? LIMIT 1`, [
            this.playerKey(player),
        ]);
        const row = result.values?.[0];
        if (!row) return [];
        try {
            const parsed = JSON.parse(row.data as string);
            if (!Array.isArray(parsed)) {
                throw new Error(
                    `Corrupted save payload for key ${this.playerKey(player)}: root is not an array`,
                );
            }
            return parsed;
        } catch (error) {
            // Surface parse failures so callers can handle them explicitly —
            // silently returning [] would cause the next write to overwrite
            // potentially valid persisted data with an empty baseline.
            throw new Error(
                `Corrupted save payload for key ${this.playerKey(player)}: ${String(error)}`,
            );
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
