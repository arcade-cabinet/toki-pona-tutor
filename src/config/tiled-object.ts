export type TiledPropertyEntry = {
    name?: unknown;
    value?: unknown;
};

export type TilePoint = {
    x: number;
    y: number;
};

export type TiledObjectProperties = Record<string, unknown> | TiledPropertyEntry[];

export type TiledObjectLike = {
    name?: string;
    type?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    properties?: TiledObjectProperties;
};

export function readTiledObjectProperty(object: TiledObjectLike, propertyName: string): unknown {
    const properties = object.properties;
    if (!properties) return undefined;

    if (Array.isArray(properties)) {
        return properties.find((property) => property.name === propertyName)?.value;
    }

    return properties[propertyName];
}

export function readTiledObjectType(object: TiledObjectLike): string {
    return String(object.type ?? readTiledObjectProperty(object, "type") ?? "");
}

export function isEncounterObject(object: TiledObjectLike): boolean {
    const type = readTiledObjectType(object);
    const name = String(object.name ?? "");
    return type === "Encounter" || name.startsWith("encounter_");
}

export function getTiledObjectTiles(
    map: { width: number; height: number; tilewidth: number; tileheight: number },
    object: TiledObjectLike,
): TilePoint[] {
    const x = Number(object.x ?? 0);
    const y = Number(object.y ?? 0);
    const width = Math.max(1, Number(object.width ?? map.tilewidth));
    const height = Math.max(1, Number(object.height ?? map.tileheight));

    const startTile = clampTile(map, toTilePoint(map, x, y));
    const endTile = clampTile(
        map,
        toTilePoint(map, Math.max(x + width - 1, x), Math.max(y + height - 1, y)),
    );

    const tiles: TilePoint[] = [];
    for (let tileY = startTile.y; tileY <= endTile.y; tileY += 1) {
        for (let tileX = startTile.x; tileX <= endTile.x; tileX += 1) {
            tiles.push({ x: tileX, y: tileY });
        }
    }
    return tiles;
}

export function tilesEqual(a: TilePoint, b: TilePoint): boolean {
    return a.x === b.x && a.y === b.y;
}

export function manhattanDistance(a: TilePoint, b: TilePoint): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function toTilePoint(
    map: { tilewidth: number; tileheight: number },
    x: number,
    y: number,
): TilePoint {
    return {
        x: Math.floor(x / map.tilewidth),
        y: Math.floor(y / map.tileheight),
    };
}

function clampTile(map: { width: number; height: number }, tile: TilePoint): TilePoint {
    return {
        x: Math.max(0, Math.min(map.width - 1, tile.x)),
        y: Math.max(0, Math.min(map.height - 1, tile.y)),
    };
}
