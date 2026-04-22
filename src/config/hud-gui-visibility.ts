import { HUD_GUI_IDS, HUD_NON_BLOCKING_GUI_IDS } from "../content/gameplay";

export const HUD_STATUS_GUI_ID = HUD_GUI_IDS.status;
export const HUD_HINT_GUI_ID = HUD_GUI_IDS.hint;
export const HUD_MENU_GUI_ID = HUD_GUI_IDS.menu;

const NON_BLOCKING_GUI_IDS = new Set(HUD_NON_BLOCKING_GUI_IDS);

type GuiLike = {
    name?: string;
    display?: () => boolean;
};

type GuiServiceLike = {
    gui?: () => Record<string, GuiLike>;
};

export function isGuiDisplayed(guiService: GuiServiceLike, guiId: string): boolean {
    const guis = guiService.gui?.() ?? {};
    const direct = guis[guiId];
    if (direct) return direct.display?.() === true;

    return Object.values(guis).some(
        (gui) => String(gui.name ?? "") === guiId && gui.display?.() === true,
    );
}

export function hasBlockingGui(guiService: GuiServiceLike): boolean {
    const guis = Object.values(guiService.gui?.() ?? {});
    return guis.some((gui) => {
        if (NON_BLOCKING_GUI_IDS.has(String(gui.name ?? ""))) return false;
        return gui.display?.() === true;
    });
}
