import type { SaveSlot } from "@rpgjs/common";
import { resolveSaveStorageStrategy, type RpgPlayer } from "@rpgjs/server";
import {
    importPersistedRuntimeState,
    isPersistedRuntimeState,
    SAVE_RUNTIME_STATE_KEY,
    type PersistedRuntimeState,
} from "../../platform/persistence/runtime-state";
import { SAVE_MENU_CONFIG } from "../../content/gameplay";
import { emitPlayerPositionSnap } from "./tap-route";

export type SaveSlotMeta = {
    savedAt?: string;
    date?: string;
    chunkKey?: string;
    map?: string;
};

export type SaveSlotPosition = {
    x: number;
    y: number;
    z?: number;
};

export type ResolvedSaveSlot = SaveSlotMeta & {
    snapshot: string | object;
    position?: SaveSlotPosition;
    runtimeState?: PersistedRuntimeState;
};

export function getSaveSlotTimestamp(meta: SaveSlotMeta | null | undefined): string {
    return meta?.savedAt ?? meta?.date ?? "";
}

export async function listSaveSlots(player: RpgPlayer): Promise<Array<SaveSlotMeta | null>> {
    const list = (player as unknown as { saveList?: () => Promise<unknown> }).saveList;
    if (typeof list === "function") {
        try {
            const slots = (await list.call(player)) as Array<SaveSlotMeta | null> | null;
            if (Array.isArray(slots)) return slots;
        } catch {
            // Fall through to the storage strategy lookup below.
        }
    }

    try {
        const slots = await resolveSaveStorageStrategy().list(player);
        return Array.isArray(slots) ? (slots as Array<SaveSlotMeta | null>) : [];
    } catch {
        return [];
    }
}

function getSnapshotPosition(snapshot: string | object): SaveSlotPosition | undefined {
    const parsed =
        typeof snapshot === "string"
            ? (JSON.parse(snapshot) as { x?: unknown; y?: unknown; z?: unknown })
            : (snapshot as { x?: unknown; y?: unknown; z?: unknown });
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
        return undefined;
    }
    return {
        x: parsed.x,
        y: parsed.y,
        ...(typeof parsed.z === "number" ? { z: parsed.z } : {}),
    };
}

function getSnapshotRuntimeState(snapshot: string | object): PersistedRuntimeState | undefined {
    const parsed =
        typeof snapshot === "string"
            ? (JSON.parse(snapshot) as Record<string, unknown>)
            : (snapshot as Record<string, unknown>);
    const state = parsed[SAVE_RUNTIME_STATE_KEY];
    return isPersistedRuntimeState(state) ? state : undefined;
}

export async function readSaveSlot(
    player: RpgPlayer,
    index: number,
): Promise<ResolvedSaveSlot | null> {
    const storage = resolveSaveStorageStrategy();
    const slot = (await storage.get(player, index)) as SaveSlot | null;
    if (!slot?.snapshot) return null;

    return {
        ...(slot as SaveSlotMeta),
        snapshot: slot.snapshot,
        position: getSnapshotPosition(slot.snapshot),
        runtimeState: getSnapshotRuntimeState(slot.snapshot),
    };
}

export async function loadSaveSlot(player: RpgPlayer, index: number): Promise<boolean> {
    const slot = await readSaveSlot(player, index);
    if (!slot) return false;

    if (slot.runtimeState) {
        await importPersistedRuntimeState(slot.runtimeState);
    }

    if (slot.map) {
        const currentMapId = player.getCurrentMap()?.id ?? null;
        if (currentMapId === slot.map) {
            if (slot.position) {
                await player.teleport(slot.position);
            }
        } else {
            await player.changeMap(slot.map, slot.position);
        }
        emitLoadedPositionSnap(player, slot.map, slot.position);
        return true;
    }
    if (slot.position) {
        await player.teleport({ x: slot.position.x, y: slot.position.y });
        const mapId = player.getCurrentMap()?.id;
        if (mapId) {
            emitLoadedPositionSnap(player, mapId, slot.position);
        }
        return true;
    }
    return !!slot.runtimeState;
}

function emitLoadedPositionSnap(
    player: RpgPlayer,
    mapId: string,
    position: SaveSlotPosition | undefined,
): void {
    if (!position) return;
    const snap = () =>
        emitPlayerPositionSnap(player, {
            mapId,
            x: position.x,
            y: position.y,
        });

    snap();
    for (const delayMs of SAVE_MENU_CONFIG.loadedPositionSnapDelayMs) {
        setTimeout(snap, delayMs);
    }
}
