import {
    requireMapObjectForEvent,
    resolveMapObjectPosition,
    resolveWarpTarget,
    type MapPositionOffset,
} from "../../content/map-objects";
import type { RuntimeMapEventConfig } from "../../content/gameplay";

export function runtimeEventPosition(
    mapId: string,
    config: RuntimeMapEventConfig,
): { x: number; y: number } {
    const object = requireMapObjectForEvent(mapId, config.id);
    return resolveMapObjectPosition(
        mapId,
        object,
        config.positionOffset ?? defaultEventOffset(config),
    );
}

export function runtimeWarpTarget(
    mapId: string,
    config: Extract<RuntimeMapEventConfig, { kind: "warp" }>,
): { targetMap: string; position: { x: number; y: number }; requiredFlag?: string } {
    const target = resolveWarpTarget(mapId, config.id, config.targetPositionOffset);
    return {
        targetMap: target.mapId,
        position: target.position,
        requiredFlag: target.requiredFlag,
    };
}

function defaultEventOffset(config: RuntimeMapEventConfig): MapPositionOffset | undefined {
    if (config.kind === "warp") {
        return { x: 0, y: 0 };
    }
    return undefined;
}
