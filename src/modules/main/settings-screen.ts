import type { RpgPlayer } from "@rpgjs/server";
import {
    getSitelenOverlay,
    setSitelenOverlay,
    getTextSpeed,
    setTextSpeed,
    getHighContrast,
    setHighContrast,
    getAccessibleMode,
    setAccessibleMode,
    getBgmVolume,
    setBgmVolume,
    getSfxVolume,
    setSfxVolume,
} from "../../platform/persistence/settings";
import { SETTINGS_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

/**
 * Settings screen — T3-06 + T3-09 partial + BRAND.md §Chrome patterns.
 *
 * Pause-menu overlay reached via the `settings` input action (or from
 * the in-progress T3-09 full pause menu when it lands). Uses the same
 * plain-showText + showChoices pattern as vocabulary-screen.ts and
 * inventory-screen.ts — no dedicated GUI dependency, and the brand theme
 * in brand.css already tints these native RPG.js overlays via the
 * @rpgjs/ui-css token overrides.
 *
 * Layout (per BRAND.md §Chrome patterns):
 *   1. Header: current values summary
 *   2. Choice list: `awen` (sitelen overlay) / `wawa` (contrast) /
 *      `suli` (accessible mode) / `kalama` (volumes) /
 *      `tenpo` (text speed) / `tawa` (back)
 *
 * Choice labels use single TP dictionary words per BRAND.md §UI
 * principle 5 (TP first, English is a fallback).
 */

export async function showSettings(player: RpgPlayer): Promise<void> {
    const [sitelen, textSpeed, highContrast, accessibleMode, bgm, sfx] = await Promise.all([
        getSitelenOverlay(),
        getTextSpeed(),
        getHighContrast(),
        getAccessibleMode(),
        getBgmVolume(),
        getSfxVolume(),
    ]);
    const state = { sitelen, textSpeed, highContrast, accessibleMode, bgm, sfx };

    await player.showText(buildSettingsSummary(state));

    const choice = await player.showChoices(
        SETTINGS_CONFIG.choicePrompt,
        SETTINGS_CONFIG.choices.map((entry) => ({
            text: settingsChoiceLabel(entry.value, {
                label: entry.label,
                ...state,
            }),
            value: entry.value,
        })),
    );
    if (!choice) return;

    switch (choice.value) {
        case "sitelen":
            await setSitelenOverlay(!sitelen);
            break;
        case "contrast":
            await setHighContrast(!highContrast);
            break;
        case "accessible":
            await setAccessibleMode(!accessibleMode);
            break;
        case "text_speed":
            await cycleTextSpeed(player, textSpeed);
            break;
        case "bgm":
            await cycleVolume(player, "bgm", bgm);
            break;
        case "sfx":
            await cycleVolume(player, "sfx", sfx);
            break;
        case "cancel":
            return;
    }

    // Re-render so the player sees the change immediately.
    await showSettings(player);
}

async function cycleTextSpeed(player: RpgPlayer, current: number): Promise<void> {
    const presets = SETTINGS_CONFIG.textSpeedPresets;
    const next =
        presets[(presets.indexOf(current) + 1) % presets.length] ??
        SETTINGS_CONFIG.defaultTextSpeed;
    await setTextSpeed(next);
    await player.showText(
        formatGameplayTemplate(SETTINGS_CONFIG.changeMessages.text_speed, {
            value: formatTextSpeedValue(next),
        }),
    );
}

async function cycleVolume(player: RpgPlayer, bus: "bgm" | "sfx", current: number): Promise<void> {
    const presets = SETTINGS_CONFIG.volumePresets;
    const next =
        presets[(presets.indexOf(current) + 1) % presets.length] ?? SETTINGS_CONFIG.defaultVolume;
    if (bus === "bgm") await setBgmVolume(next);
    else await setSfxVolume(next);
    await player.showText(
        formatGameplayTemplate(SETTINGS_CONFIG.changeMessages.volume, {
            bus,
            value: next === 0 ? SETTINGS_CONFIG.stateLabels.muted : next,
        }),
    );
}

type SettingsState = {
    sitelen: boolean;
    textSpeed: number;
    highContrast: boolean;
    accessibleMode: boolean;
    bgm: number;
    sfx: number;
};

export function buildSettingsSummary(state: SettingsState): string {
    return [
        SETTINGS_CONFIG.summaryTitle,
        ...SETTINGS_CONFIG.summaryRows.map((row) =>
            formatSettingsSummaryRow(row.value, row.label, row.template, state),
        ),
    ].join("\n");
}

export function settingsChoiceLabel(
    value: string,
    state: SettingsState & {
        label: string;
    },
): string {
    const stateLabels = SETTINGS_CONFIG.stateLabels;
    switch (value) {
        case "sitelen":
            return formatGameplayTemplate(SETTINGS_CONFIG.choiceFormats.boolean, {
                label: state.label,
                state: state.sitelen ? stateLabels.on : stateLabels.off,
            });
        case "text_speed":
            return formatGameplayTemplate(SETTINGS_CONFIG.choiceFormats.text_speed, {
                label: state.label,
                value: formatTextSpeedValue(state.textSpeed),
            });
        case "contrast":
            return formatGameplayTemplate(SETTINGS_CONFIG.choiceFormats.boolean, {
                label: state.label,
                state: state.highContrast ? stateLabels.on : stateLabels.off,
            });
        case "accessible":
            return formatGameplayTemplate(SETTINGS_CONFIG.choiceFormats.boolean, {
                label: state.label,
                state: state.accessibleMode ? stateLabels.on : stateLabels.off,
            });
        case "bgm":
            return formatGameplayTemplate(SETTINGS_CONFIG.choiceFormats.volume, {
                label: state.label,
                value: state.bgm,
            });
        case "sfx":
            return formatGameplayTemplate(SETTINGS_CONFIG.choiceFormats.volume, {
                label: state.label,
                value: state.sfx,
            });
        default:
            return formatGameplayTemplate(SETTINGS_CONFIG.choiceFormats.default, {
                label: state.label,
            });
    }
}

function formatSettingsSummaryRow(
    value: string,
    label: string,
    template: string,
    state: SettingsState,
): string {
    const stateLabels = SETTINGS_CONFIG.stateLabels;
    switch (value) {
        case "sitelen":
            return formatGameplayTemplate(template, {
                label,
                state: state.sitelen ? stateLabels.on : stateLabels.off,
            });
        case "text_speed":
            return formatGameplayTemplate(template, {
                label,
                value: formatTextSpeedValue(state.textSpeed),
            });
        case "contrast":
            return formatGameplayTemplate(template, {
                label,
                state: state.highContrast ? stateLabels.on : stateLabels.off,
            });
        case "accessible":
            return formatGameplayTemplate(template, {
                label,
                state: state.accessibleMode ? stateLabels.on : stateLabels.off,
            });
        case "volume":
            return formatGameplayTemplate(template, {
                label,
                bgm: state.bgm,
                sfx: state.sfx,
            });
        default:
            return formatGameplayTemplate(template, { label });
    }
}

function formatTextSpeedValue(value: number): string {
    if (value === 0) return SETTINGS_CONFIG.stateLabels.instant;
    return formatGameplayTemplate(SETTINGS_CONFIG.textSpeedValueTemplate, { value });
}
