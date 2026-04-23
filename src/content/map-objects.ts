import worldRaw from "./generated/world.json";
import type { CompiledMap, CompiledMapObject } from "./schema/world";

type ContentWorldWithMaps = {
    maps: CompiledMap[];
};

export type MapPositionOffset = {
    x: number;
    y: number;
};

function assertWorldMaps(raw: unknown): ContentWorldWithMaps {
    if (
        raw == null ||
        typeof raw !== "object" ||
        !Array.isArray((raw as Record<string, unknown>).maps)
    ) {
        throw new Error(
            "[map-objects] world.json is missing compiled map objects; run `pnpm build-spine`",
        );
    }
    return raw as ContentWorldWithMaps;
}

const world = assertWorldMaps(worldRaw);

export function compiledMapFor(mapId: string): CompiledMap | null {
    return world.maps.find((map) => map.id === mapId) ?? null;
}

export function compiledMapObjectsFor(mapId: string, layer = "Objects"): CompiledMapObject[] {
    return compiledMapFor(mapId)?.objects.filter((object) => object.layer === layer) ?? [];
}

export function requireCompiledMap(mapId: string): CompiledMap {
    const map = compiledMapFor(mapId);
    if (!map) throw new Error(`[map-objects] missing compiled map: ${mapId}`);
    return map;
}

export function requireMapObjectForEvent(mapId: string, eventId: string): CompiledMapObject {
    const normalizedId = eventId.replace(/-/g, "_");
    const object = compiledMapObjectsFor(mapId).find((candidate) => {
        return (
            candidate.name === eventId ||
            candidate.properties.id === normalizedId ||
            candidate.properties.target_event === normalizedId
        );
    });
    if (!object) {
        throw new Error(`[map-objects] ${mapId} has no object for runtime event ${eventId}`);
    }
    return object;
}

export function requireMapObjectByName(mapId: string, name: string): CompiledMapObject {
    const object = compiledMapObjectsFor(mapId).find((candidate) => candidate.name === name);
    if (!object) {
        throw new Error(`[map-objects] ${mapId} has no object named ${name}`);
    }
    return object;
}

export function resolveMapObjectPosition(
    mapId: string,
    object: CompiledMapObject,
    offset?: MapPositionOffset,
): { x: number; y: number } {
    const map = requireCompiledMap(mapId);
    const resolvedOffset = offset ?? {
        x: object.width > 0 ? object.width / 2 : map.tilewidth / 2,
        y: object.height > 0 ? object.height / 2 : map.tileheight / 2,
    };
    return {
        x: object.x + resolvedOffset.x,
        y: object.y + resolvedOffset.y,
    };
}

export function stringProperty(object: CompiledMapObject, property: string): string | null {
    const value = object.properties[property];
    return typeof value === "string" ? value : null;
}

export function resolveWarpTarget(
    mapId: string,
    warpId: string,
    targetOffset?: MapPositionOffset,
): { mapId: string; position: { x: number; y: number }; requiredFlag?: string } {
    const warp = requireMapObjectByName(mapId, warpId);
    const targetMap = stringProperty(warp, "target_map");
    const targetSpawn = stringProperty(warp, "target_spawn");
    if (!targetMap || !targetSpawn) {
        throw new Error(`[map-objects] warp ${mapId}:${warpId} is missing target_map/target_spawn`);
    }
    const spawn = requireMapObjectByName(targetMap, targetSpawn);
    const position = resolveMapObjectPosition(targetMap, spawn, targetOffset);
    return {
        mapId: targetMap,
        position,
        requiredFlag: stringProperty(warp, "required_flag") ?? undefined,
    };
}
