import { describe, expect, it } from "vitest";
import { hasBlockingGui, isGuiDisplayed } from "../../src/config/hud-gui-visibility";

function gui(displayed: boolean, name?: string) {
    return {
        name,
        display: () => displayed,
    };
}

describe("HUD GUI visibility helpers", () => {
    it("detects displayed GUIs by direct id or registered name", () => {
        const guiService = {
            gui: () => ({
                "poki-lead-movebar": gui(true),
                generated: gui(true, "poki-pause-screen"),
            }),
        };

        expect(isGuiDisplayed(guiService, "poki-lead-movebar")).toBe(true);
        expect(isGuiDisplayed(guiService, "poki-pause-screen")).toBe(true);
        expect(isGuiDisplayed(guiService, "missing")).toBe(false);
    });

    it("treats non-displayed GUIs as hidden", () => {
        const guiService = {
            gui: () => ({
                "poki-lead-movebar": gui(false),
                generated: gui(false, "poki-pause-screen"),
            }),
        };

        expect(isGuiDisplayed(guiService, "poki-lead-movebar")).toBe(false);
        expect(isGuiDisplayed(guiService, "poki-pause-screen")).toBe(false);
    });

    it("keeps only non-blocking HUD chrome out of the blocking calculation", () => {
        const guiService = {
            gui: () => ({
                "poki-hud-status": gui(true, "poki-hud-status"),
                "poki-hud-menu-toggle": gui(true, "poki-hud-menu-toggle"),
                "poki-lead-movebar": gui(true, "poki-lead-movebar"),
            }),
        };

        expect(hasBlockingGui(guiService)).toBe(true);
    });

    it("treats registry-key HUD ids as non-blocking when names are absent", () => {
        const guiService = {
            gui: () => ({
                "poki-hud-status": gui(true),
                "poki-hud-menu-toggle": gui(true),
            }),
        };

        expect(hasBlockingGui(guiService)).toBe(false);
    });
});
