import { mapLabelFor } from "../../content/map-metadata";
import { WARP_LOADING_CONFIG } from "../../content/gameplay";

export const WARP_LOADING_GUI_ID = WARP_LOADING_CONFIG.guiId;

export const WARP_LOADING_ENTER_MS = WARP_LOADING_CONFIG.enterMs;
export const WARP_LOADING_SETTLE_MS = WARP_LOADING_CONFIG.settleMs;

export type WarpLoadingPhase = "enter" | "settle";

export type WarpLoadingView = {
    targetMap: string;
    label: string;
    phase: WarpLoadingPhase;
    statusLabel: string;
    detailLabel: string;
};

export function buildWarpLoadingView(params: {
    targetMap: string;
    label?: string | null;
    phase?: WarpLoadingPhase;
}): WarpLoadingView {
    const phase = params.phase === "settle" ? "settle" : "enter";
    return {
        targetMap: params.targetMap,
        label: resolveWarpLoadingLabel(params.targetMap, params.label),
        phase,
        statusLabel: WARP_LOADING_CONFIG.phaseLabels[phase].statusLabel,
        detailLabel: WARP_LOADING_CONFIG.phaseLabels[phase].detailLabel,
    };
}

export function resolveWarpLoadingLabel(targetMap: string, label?: string | null): string {
    const explicit = label?.trim();
    if (explicit) return explicit;
    return mapLabelFor(targetMap);
}
