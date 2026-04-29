import type { RpgPlayer } from "@rpgjs/server";
import { AUTOSAVE_SLOT } from "../../platform/persistence/constants";
import { preferences, KEYS } from "../../platform/persistence/preferences";
import { resetPersistedRuntimeState } from "../../platform/persistence/runtime-state";
import { PLAYER_CONFIG, TITLE_MENU_CONFIG, TITLE_START } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { markSafeMapIfVillage } from "./respawn";
import { runOpeningScene } from "./opening-scene";
import { getSaveSlotTimestamp, listSaveSlots } from "./save-slots";
import { showSettings } from "./settings-screen";
import { parseSeed, seedDisplay, type Seed } from "../seed";
import { newGameSeed } from "../../platform/persistence/seed-persistence";

export type FamousSeed = { label: string; seed: Seed };

export const FAMOUS_SEEDS: FamousSeed[] = TITLE_MENU_CONFIG.seedPicker.famousSeeds;

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
                    await pickAndPersistSeed(player);
                    return { kind: "new", wipeExistingSaves: false };
                }
                if (await confirmWipeExistingSaves(player)) {
                    await pickAndPersistSeed(player);
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
            nonce: Date.now(),
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

/**
 * T156: seed picker — shown after "New Game" is chosen.
 * Player picks: random seed, one of the famous seeds, or enters a custom string.
 * Returns the chosen Seed so startFreshGame can persist it via newGameSeed().
 */
export async function showSeedPicker(player: RpgPlayer): Promise<Seed> {
    const RANDOM_VALUE = "__random__";
    const choices = [
        { text: TITLE_MENU_CONFIG.seedPicker.randomLabel, value: RANDOM_VALUE },
        ...FAMOUS_SEEDS.map((fs) => ({
            text: formatGameplayTemplate(TITLE_MENU_CONFIG.seedPicker.famousSeedTemplate, {
                label: fs.label,
                seed: seedDisplay(fs.seed),
            }),
            value: String(fs.seed),
        })),
    ];
    const choice = await player.showChoices(TITLE_MENU_CONFIG.seedPicker.prompt, choices);
    const value = choice?.value ?? RANDOM_VALUE;
    if (value === RANDOM_VALUE) return parseSeed(undefined);
    // Famous seeds are stored as stringified 32-bit integers; parse as number
    // so parseSeed routes to the integer identity path, not the string-hash path.
    const asNum = Number(value);
    return parseSeed(Number.isInteger(asNum) && asNum >= 0 ? asNum : value);
}

async function pickAndPersistSeed(player: RpgPlayer): Promise<void> {
    const seed = await showSeedPicker(player);
    await newGameSeed(seed);
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
    await markSafeMapIfVillage(TITLE_START.mapId);

    // T11-11: scripted opening scene — stages why Rivers is here, why
    // they care, and hands the player straight into Selby's starter
    // ceremony. Idempotent (gated on opening_scene_complete flag) so
    // a resumed save or a re-entry into the starter map does not
    // replay the opening. Runs BEFORE autosave so the flag write is
    // part of the first persisted snapshot.
    try {
        await runOpeningScene(player);
    } catch {
        // Opening scene failure must not stop the player entering the
        // game. Worst case: the scene silently no-ops and the player
        // starts on the starter map as they did before this module
        // existed.
    }

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
