import { RpgPlayer, RpgShape, type RpgPlayerHooks } from "@rpgjs/server";
import { handleEncounterShapeEntered } from "./encounter";
import { showPauseMenu } from "./pause-menu";
import { markSafeMapIfVillage, respawnAtLastSafeMap } from "./respawn";
import { handleFinalBossTrigger } from "./green-dragon";
import { loadSaveSlot } from "./save-slots";
import { AUTOSAVE_SLOT } from "../../platform/persistence/constants";
import {
    exportPersistedRuntimeState,
    importPersistedRuntimeState,
    isPersistedRuntimeState,
    SAVE_RUNTIME_STATE_KEY,
} from "../../platform/persistence/runtime-state";
import { showTitleMenu, startFreshGame } from "./title-menu";
import { cancelTapRoute, registerTapRouteListener } from "./tap-route";
import {
    cueBattleActionAudio,
    cueSfx,
    registerCombatAudioMonitor,
    unregisterCombatAudioMonitor,
} from "./audio-cues";
import {
    restoreLeadBattleAvatar,
    switchToNextAvailableLeadBattleAvatar,
} from "./lead-battle-avatar";
import {
    NOTIFICATION_CONFIG,
    PLAYER_CONFIG,
    SFX_CUE_CONFIG,
    TITLE_START,
} from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

type SaveSnapshot = Record<string, unknown>;
type MainPlayerHooks = RpgPlayerHooks & {
    onSave?: (player: RpgPlayer, snapshot: SaveSnapshot) => Promise<void>;
    onLoad?: (player: RpgPlayer, snapshot: SaveSnapshot) => Promise<void>;
};

const bootPromptHandled = new Set<string>();

function isVitestRuntime(): boolean {
    return typeof process !== "undefined" && process.env.VITEST === "true";
}

function getBootPromptKey(player: RpgPlayer): string | null {
    const connectionId = (player as unknown as { conn?: { id?: string } }).conn?.id;
    return connectionId ?? player.id ?? null;
}

async function runTitleMenu(player: RpgPlayer): Promise<void> {
    try {
        const action = await showTitleMenu(player);
        if (action.kind === "continue") {
            const loaded = await loadSaveSlot(player, action.slot);
            if (loaded) {
                return;
            }
        } else {
            await startFreshGame(player, { wipeExistingSaves: action.wipeExistingSaves });
            return;
        }
    } catch {
        player.initializeDefaultStats();
        player.setGraphic(PLAYER_CONFIG.defaultGraphic);
    }

    const currentMapId = player.getCurrentMap()?.id;
    if (typeof currentMapId === "string") {
        await markSafeMapIfVillage(currentMapId);
    }
    await autosave(player);
}

async function autosave(player: RpgPlayer): Promise<void> {
    // T3-02: autosave every map transition. Uses slot 0 as the single
    // implicit autosave; manual saves (T3-05) live in slots 1-3 when
    // that lands. Errors in save are swallowed — a save-write failure
    // should not block the player from entering the new map.
    try {
        const save = (player as unknown as { save?: (slot: number) => Promise<void> }).save;
        if (typeof save === "function") {
            await save.call(player, AUTOSAVE_SLOT);
        }
    } catch {
        // Silent: autosave is best-effort.
    }
}

export const player: MainPlayerHooks = {
    async onConnected(player: RpgPlayer) {
        player.setGraphic(PLAYER_CONFIG.defaultGraphic);
        player.initializeDefaultStats();
        await player.changeMap(TITLE_START.mapId, TITLE_START.spawn);
    },
    async onJoinMap(player: RpgPlayer) {
        cancelTapRoute(player);
        await restoreLeadBattleAvatar(player);
        registerTapRouteListener(player);
        registerCombatAudioMonitor(player);
        const bootPromptKey = getBootPromptKey(player);
        if (!isVitestRuntime() && (!bootPromptKey || !bootPromptHandled.has(bootPromptKey))) {
            if (bootPromptKey) {
                bootPromptHandled.add(bootPromptKey);
            }
            setTimeout(() => {
                void runTitleMenu(player);
            }, 0);
            return;
        }

        const mapId = player.getCurrentMap()?.id;
        if (typeof mapId === "string") {
            await markSafeMapIfVillage(mapId);
        }
        await autosave(player);
    },
    async onDisconnected(player: RpgPlayer) {
        cancelTapRoute(player);
        unregisterCombatAudioMonitor(player);
        await restoreLeadBattleAvatar(player);
        // T3-04: flush a final autosave when the player disconnects
        // (browser unload, Capacitor app backgrounded, tab close). The
        // engine drives this via its own disconnect signal so we don't
        // need a client-side beforeunload listener. Best-effort — if the
        // runtime is already tearing down we can't help.
        await autosave(player);
    },
    async onSave(_player: RpgPlayer, snapshot: SaveSnapshot) {
        snapshot[SAVE_RUNTIME_STATE_KEY] = await exportPersistedRuntimeState();
    },
    async onLoad(player: RpgPlayer, snapshot: SaveSnapshot) {
        const state = snapshot[SAVE_RUNTIME_STATE_KEY];
        if (!isPersistedRuntimeState(state)) return;
        await importPersistedRuntimeState(state);
        delete snapshot[SAVE_RUNTIME_STATE_KEY];
        delete (player as unknown as Record<string, unknown>)[SAVE_RUNTIME_STATE_KEY];
    },
    async onDead(player: RpgPlayer) {
        cancelTapRoute(player);
        const nextLead = await switchToNextAvailableLeadBattleAvatar(player, { fainted: true });
        if (nextLead) {
            registerCombatAudioMonitor(player);
            await cueSfx(player, SFX_CUE_CONFIG.menuConfirm);
            await player.showNotification(
                formatGameplayTemplate(NOTIFICATION_CONFIG.benchSwitch.template, {
                    species: nextLead.speciesId.replace(/_/g, " "),
                }),
                { time: NOTIFICATION_CONFIG.benchSwitch.timeMs },
            );
            return;
        }
        unregisterCombatAudioMonitor(player);
        await restoreLeadBattleAvatar(player);
        await respawnAtLastSafeMap(player);
    },
    async onInput(player: RpgPlayer, { action, input }) {
        if (action != null || input != null) {
            cancelTapRoute(player);
        }
        if (action === "escape") {
            await cueSfx(player, SFX_CUE_CONFIG.menuOpen);
            const pauseAction = await showPauseMenu(player);
            if (pauseAction.kind === "title") {
                await runTitleMenu(player);
            }
            return;
        }
        if (action === "action") {
            await cueBattleActionAudio(player);
        }
    },
    async onInShape(player: RpgPlayer, shape: RpgShape) {
        const properties = (shape.properties ?? {}) as Record<string, unknown>;
        const shapeName = String(shape.name);
        if (shapeName === "final_boss_trigger") {
            await handleFinalBossTrigger(player);
            return;
        }
        const shapeType = properties.type ?? shape.name;
        if (shapeType === "Encounter" || shapeName.startsWith("encounter_")) {
            const mapId = player.getCurrentMap()?.id ?? "unknown";
            await handleEncounterShapeEntered(player, properties, mapId);
        }
    },
};
