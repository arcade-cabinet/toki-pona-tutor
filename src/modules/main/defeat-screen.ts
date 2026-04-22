import { mapLabelFor } from "../../content/map-metadata";
import { DEFEAT_SCREEN_CONFIG } from "../../content/gameplay";

export const DEFEAT_SCREEN_GUI_ID = DEFEAT_SCREEN_CONFIG.guiId;

export const DEFEAT_SCREEN_ENTER_MS = DEFEAT_SCREEN_CONFIG.enterMs;
export const DEFEAT_SCREEN_SETTLE_MS = DEFEAT_SCREEN_CONFIG.settleMs;

export type DefeatScreenPhase = "fallen" | "returning";

export type DefeatScreenView = {
    targetMap: string;
    label: string;
    phase: DefeatScreenPhase;
    statusLabel: string;
    detailLabel: string;
};

export function buildDefeatScreenView(params: {
    targetMap: string;
    label?: string | null;
    phase?: DefeatScreenPhase;
}): DefeatScreenView {
    const phase = params.phase === "returning" ? "returning" : "fallen";
    return {
        targetMap: params.targetMap,
        label: resolveDefeatScreenLabel(params.targetMap, params.label),
        phase,
        statusLabel: DEFEAT_SCREEN_CONFIG.phaseLabels[phase].statusLabel,
        detailLabel: DEFEAT_SCREEN_CONFIG.phaseLabels[phase].detailLabel,
    };
}

export function resolveDefeatScreenLabel(targetMap: string, label?: string | null): string {
    const explicit = label?.trim();
    if (explicit) return explicit;
    return mapLabelFor(targetMap);
}
