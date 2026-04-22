import { MAXHP, type RpgPlayer } from "@rpgjs/server";
import { preferences, KEYS } from "../../platform/persistence/preferences";
import { setPartyCurrentHp } from "../../platform/persistence/queries";
import { defaultRespawnPoint, safeSpawnFor } from "../../content/map-metadata";
import { DEFEAT_SCREEN_CONFIG } from "../../content/gameplay";
import { playDialog } from "./dialog";
import {
    buildDefeatScreenView,
    DEFEAT_SCREEN_ENTER_MS,
    DEFEAT_SCREEN_GUI_ID,
    DEFEAT_SCREEN_SETTLE_MS,
    type DefeatScreenPhase,
    type DefeatScreenView,
} from "./defeat-screen";

/**
 * Called whenever the player enters a map. If the destination is a
 * safe village, we anchor the respawn point there.
 */
export async function markSafeMapIfVillage(mapId: string): Promise<void> {
    const coords = safeSpawnFor(mapId);
    if (!coords) return;
    await preferences.set(KEYS.lastSafeMapId, mapId);
    await preferences.set(KEYS.lastSafeSpawnX, String(coords.x));
    await preferences.set(KEYS.lastSafeSpawnY, String(coords.y));
}

/**
 * onDead handler — revives the player at the last safe village.
 * Party roster is preserved (no permadeath; kid audience). HP is
 * reset to the player's max via `player.hp = player.param[MAXHP]`.
 */
export async function respawnAtLastSafeMap(player: RpgPlayer): Promise<void> {
    const [mapId, xStr, yStr] = await Promise.all([
        preferences.get(KEYS.lastSafeMapId),
        preferences.get(KEYS.lastSafeSpawnX),
        preferences.get(KEYS.lastSafeSpawnY),
    ]);
    const target =
        mapId && xStr && yStr ? { mapId, x: Number(xStr), y: Number(yStr) } : defaultRespawnPoint();

    const defeatGui = await openDefeatScreen(player, target.mapId, "fallen");
    try {
        if (defeatGui) await delay(DEFEAT_SCREEN_ENTER_MS);
        if (defeatGui) {
            await updateDefeatScreen(defeatGui, target.mapId, "returning");
            await delay(DEFEAT_SCREEN_SETTLE_MS);
        }
    } finally {
        if (defeatGui) await closeDefeatScreen(defeatGui);
    }

    await playDialog(player, DEFEAT_SCREEN_CONFIG.reviveDialogId);

    // Restore to full HP. RpgPlayer's max hp lives on the param bag;
    // reading it back avoids hardcoding a player-class-dependent value.
    const maxHp = (player as unknown as { param?: Record<string | number, number> }).param?.[MAXHP];
    if (typeof maxHp === "number" && maxHp > 0) {
        (player as unknown as { hp: number }).hp = maxHp;
        await setPartyCurrentHp(0, maxHp);
    }

    await player.changeMap(target.mapId, { x: target.x, y: target.y });
    await preferences.set(KEYS.currentMapId, target.mapId);
}

type DefeatScreenGui = {
    open: (data: DefeatScreenView, options?: { blockPlayerInput?: boolean }) => Promise<unknown>;
    update?: (data: DefeatScreenView) => unknown;
    close?: () => unknown;
};

async function openDefeatScreen(
    player: RpgPlayer,
    targetMap: string,
    phase: DefeatScreenPhase,
): Promise<DefeatScreenGui | null> {
    if (isVitestRuntime()) return null;
    try {
        const gui = player.gui(DEFEAT_SCREEN_GUI_ID) as unknown as DefeatScreenGui | null;
        if (!gui || typeof gui.open !== "function") return null;
        await gui.open(buildDefeatScreenView({ targetMap, phase }), {
            blockPlayerInput: true,
        });
        return gui;
    } catch {
        return null;
    }
}

async function updateDefeatScreen(
    gui: DefeatScreenGui,
    targetMap: string,
    phase: DefeatScreenPhase,
): Promise<void> {
    try {
        await Promise.resolve(gui.update?.(buildDefeatScreenView({ targetMap, phase })));
    } catch {
        /* best-effort */
    }
}

async function closeDefeatScreen(gui: DefeatScreenGui): Promise<void> {
    try {
        await Promise.resolve(gui.close?.());
    } catch {
        /* best-effort */
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isVitestRuntime(): boolean {
    return typeof process !== "undefined" && process.env.VITEST === "true";
}
