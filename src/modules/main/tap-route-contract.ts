import { TAP_ROUTE_CONFIG } from "../../content/gameplay";

export const TAP_ROUTE_EVENT = TAP_ROUTE_CONFIG.event;
export const TAP_ROUTE_SNAP_EVENT = TAP_ROUTE_CONFIG.snapEvent;
export const MAX_TAP_ROUTE_LENGTH = TAP_ROUTE_CONFIG.maxLength;

export type TilePoint = {
    x: number;
    y: number;
};

export type TapRouteInteraction = {
    kind: "action" | "touch";
    eventId: string;
};

export type TapRouteRequest = {
    mapId: string;
    path: TilePoint[];
    interaction: TapRouteInteraction | null;
};

export type TapRouteSnap = {
    mapId: string;
    version: number;
    x: number;
    y: number;
};

export function isTilePoint(value: unknown): value is TilePoint {
    if (!value || typeof value !== "object") return false;
    const point = value as Record<string, unknown>;
    return Number.isInteger(point.x) && Number.isInteger(point.y);
}

export function isTapRouteInteraction(value: unknown): value is TapRouteInteraction {
    if (!value || typeof value !== "object") return false;
    const interaction = value as Record<string, unknown>;
    return (
        (interaction.kind === "action" || interaction.kind === "touch") &&
        typeof interaction.eventId === "string" &&
        interaction.eventId.length > 0
    );
}

export function isTapRouteRequest(value: unknown): value is TapRouteRequest {
    if (!value || typeof value !== "object") return false;
    const request = value as Record<string, unknown>;
    if (typeof request.mapId !== "string" || request.mapId.length === 0) {
        return false;
    }

    if (!Array.isArray(request.path) || request.path.length > MAX_TAP_ROUTE_LENGTH) {
        return false;
    }

    if (!request.path.every(isTilePoint)) {
        return false;
    }

    return request.interaction === null || isTapRouteInteraction(request.interaction);
}

export function isTapRouteSnap(value: unknown): value is TapRouteSnap {
    if (!value || typeof value !== "object") return false;
    const snap = value as Record<string, unknown>;
    return (
        typeof snap.mapId === "string" &&
        snap.mapId.length > 0 &&
        Number.isInteger(snap.version) &&
        typeof snap.x === "number" &&
        Number.isFinite(snap.x) &&
        typeof snap.y === "number" &&
        Number.isFinite(snap.y)
    );
}
