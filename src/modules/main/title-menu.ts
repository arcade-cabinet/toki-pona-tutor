import type { RpgPlayer } from "@rpgjs/server";
import { AUTOSAVE_SLOT } from "../../platform/persistence/constants";
import { preferences, KEYS } from "../../platform/persistence/preferences";
import { resetPersistedRuntimeState } from "../../platform/persistence/runtime-state";
import { PLAYER_CONFIG, TITLE_MENU_CONFIG, TITLE_START } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { markSafeMapIfVillage } from "./respawn";
import { getSaveSlotTimestamp, listSaveSlots } from "./save-slots";
import { showSettings } from "./settings-screen";

type FilledSlot = {
    index: number;
    timestamp: string;
};

export type TitleMenuEntry = {
    id: "continue" | "new" | "settings" | "quit";
    label: string;
};

export type TitleMenuAction =
    | { kind: "continue"; slot: number }
    | { kind: "new"; wipeExistingSaves: boolean };

async function getFilledSlots(player: RpgPlayer): Promise<FilledSlot[]> {
    const slots = await listSaveSlots(player);
    return slots
        .map((meta, index) => (meta ? { index, timestamp: getSaveSlotTimestamp(meta) } : null))
        .filter((slot): slot is FilledSlot => slot !== null)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

async function confirmWipeExistingSaves(player: RpgPlayer): Promise<boolean> {
    const choice = await player.showChoices(
        TITLE_MENU_CONFIG.confirmNewPrompt,
        TITLE_MENU_CONFIG.confirmNewChoices.map((entry) => ({
            text: entry.label,
            value: entry.value,
        })),
    );
    return choice?.value === "confirm";
}

export async function showTitleMenu(player: RpgPlayer): Promise<TitleMenuAction> {
    for (;;) {
        const filled = await getFilledSlots(player);
        const choice = await showTitleScreen(player, filled);
        if (!choice?.id) continue;

        switch (choice.id) {
            case "continue":
                if (filled.length > 0) {
                    return { kind: "continue", slot: filled[0].index };
                }
                break;
            case "new":
                if (filled.length === 0) {
                    return { kind: "new", wipeExistingSaves: false };
                }
                if (await confirmWipeExistingSaves(player)) {
                    return { kind: "new", wipeExistingSaves: true };
                }
                break;
            case "settings":
                await showSettings(player);
                break;
            case "quit":
                await requestQuitIntent(player);
                break;
        }
    }
}

async function showTitleScreen(
    player: RpgPlayer,
    filled: FilledSlot[],
): Promise<{ id?: string } | null> {
    const gui = player.gui(TITLE_MENU_CONFIG.guiId);
    gui.on("select", (selection) => {
        gui.close(selection);
    });

    return gui.open(
        {
            title: TITLE_MENU_CONFIG.menuTitle,
            entries: buildTitleMenuEntries(filled),
        },
        {
            waitingAction: true,
            blockPlayerInput: true,
        },
    ) as Promise<{ id?: string } | null>;
}

export function buildTitleMenuEntries(filled: readonly FilledSlot[]): TitleMenuEntry[] {
    return [
        ...(filled.length > 0
            ? [
                  {
                      id: "continue",
                      label: formatGameplayTemplate(TITLE_MENU_CONFIG.continueLabelTemplate, {
                          prefix: TITLE_MENU_CONFIG.continueLabelPrefix,
                          slot: filled[0].index,
                      }),
                  } satisfies TitleMenuEntry,
              ]
            : []),
        ...TITLE_MENU_CONFIG.entries,
    ];
}

async function requestQuitIntent(player: RpgPlayer): Promise<void> {
    if (await exitNativeApp()) return;
    await player.showText(TITLE_MENU_CONFIG.quitWebMessage);
}

async function exitNativeApp(): Promise<boolean> {
    try {
        const [{ Capacitor }, { App }] = await Promise.all([
            import("@capacitor/core"),
            import("@capacitor/app"),
        ]);
        if (Capacitor.getPlatform() === "web") return false;
        await App.exitApp();
        return true;
    } catch {
        return false;
    }
}

export async function startFreshGame(
    player: RpgPlayer,
    options: { wipeExistingSaves: boolean },
): Promise<void> {
    await resetPersistedRuntimeState({ includeSaves: options.wipeExistingSaves });
    player.initializeDefaultStats();
    player.setGraphic(PLAYER_CONFIG.defaultGraphic);
    const currentMapId = player.getCurrentMap()?.id ?? null;
    if (currentMapId === TITLE_START.mapId) {
        await player.teleport(TITLE_START.spawn);
    } else {
        await player.changeMap(TITLE_START.mapId, TITLE_START.spawn);
    }

    await preferences.set(KEYS.currentMapId, TITLE_START.mapId);
    await preferences.set(KEYS.journeyBeat, TITLE_START.journeyBeatId);
    await markSafeMapIfVillage(TITLE_START.mapId);
    await autosave(player);
}

async function autosave(player: RpgPlayer): Promise<void> {
    try {
        const save = (player as unknown as { save?: (slot: number) => Promise<void> }).save;
        if (typeof save === "function") {
            await save.call(player, AUTOSAVE_SLOT);
        }
    } catch {
        // Best-effort.
    }
}
