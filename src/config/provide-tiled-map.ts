import { MapClass, TiledParser } from "@canvasengine/tiled";
import { provideLoadMap, type RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import TiledMapScene from "./tiled-map.ce";
import { sanitizeTiledMapForCanvasPreset } from "./tiled-map-sanitize";

type ProvideTiledMapOptions = {
    basePath: string;
    onLoadMap?: (map: string) => Promise<void>;
};

type AnyMap = {
    tiled?: MapClass;
    physicsParsedMap?: any;
    parsedMap?: any;
};

type RectHitbox = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

const TILED_HITBOX_ID_PREFIX = "__tiled_collision__:";

const tiledClientModule = defineModule<RpgClient>({
    componentAnimations: [],
    sceneMap: {
        onPhysicsInit(map: any, context: { mapData: any }) {
            prepareTiledPhysicsData(context?.mapData, map);
        },
    },
});

export function provideTiledMap(options: ProvideTiledMapOptions) {
    const basePath = normalizeBasePath(options.basePath);

    return createModule("TiledMap", [
        {
            server: null,
            client: tiledClientModule,
        },
        provideLoadMap(async (map) => {
            const mapUrl = new URL(`${basePath}/${map}.tmx`, window.location.href);
            const mapData = await fetchText(mapUrl);
            const parser = new TiledParser(mapData, mapUrl.href);
            const parsedMap = parser.parseMap();
            const tilesets: typeof parsedMap.tilesets = [];

            for (const tileset of parsedMap.tilesets) {
                const tilesetUrl = new URL(tileset.source, mapUrl);
                const tilesetData = await fetchText(tilesetUrl);
                const tilesetParser = new TiledParser(tilesetData, tilesetUrl.href);
                const parsedTileset = tilesetParser.parseTileset();
                tilesets.push({
                    ...tileset,
                    ...parsedTileset,
                });
            }

            parsedMap.tilesets = tilesets;
            const renderMap = sanitizeTiledMapForCanvasPreset(parsedMap);

            const mapObject: any = {
                data: renderMap,
                rawData: mapData,
                component: TiledMapScene,
                parsedMap: renderMap,
                physicsParsedMap: parsedMap,
                id: map,
                params: {
                    basePath,
                },
            };

            prepareTiledPhysicsData(mapObject, mapObject);

            if (options.onLoadMap) {
                await options.onLoadMap(map);
            }

            return mapObject;
        }),
    ]);
}

function normalizeBasePath(path: string): string {
    return path.replace(/^\/+/, "").replace(/\/+$/, "") || "map";
}

async function fetchText(url: URL): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load ${url.href}: ${response.status} ${response.statusText}`);
    }
    return response.text();
}

function prepareTiledPhysicsData(mapData: any, map: AnyMap): void {
    const parsedMap = mapData?.physicsParsedMap ?? mapData?.parsedMap;
    if (!parsedMap) {
        return;
    }

    const tiledMap = new MapClass(parsedMap);
    map.tiled = tiledMap;

    const tiledHitboxes = collectBlockedTileHitboxes(tiledMap);
    mapData.hitboxes = mergeTiledHitboxes(mapData.hitboxes, tiledHitboxes);
    mapData.width = tiledMap.widthPx;
    mapData.height = tiledMap.heightPx;
}

function collectBlockedTileHitboxes(tiledMap: MapClass): RectHitbox[] {
    const hitboxes: RectHitbox[] = [];
    const mapWidth = tiledMap.width;
    const mapHeight = tiledMap.height;
    const tileWidth = tiledMap.tilewidth;
    const tileHeight = tiledMap.tileheight;

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const tileInfo = tiledMap.getTileByPosition(x * tileWidth, y * tileHeight, [0, 0], {
                populateTiles: true,
            });
            if (tileInfo.hasCollision) {
                hitboxes.push({
                    id: createTiledHitboxId(x, y),
                    x: x * tileWidth,
                    y: y * tileHeight,
                    width: tileWidth,
                    height: tileHeight,
                });
            }
        }
    }

    return hitboxes;
}

function mergeTiledHitboxes(existingHitboxes: any, tiledHitboxes: RectHitbox[]): any[] {
    const preservedHitboxes = Array.isArray(existingHitboxes)
        ? existingHitboxes.filter((hitbox) => !isGeneratedTiledHitbox(hitbox))
        : [];

    return [...preservedHitboxes, ...tiledHitboxes];
}

function isGeneratedTiledHitbox(hitbox: any): boolean {
    return typeof hitbox?.id === "string" && hitbox.id.startsWith(TILED_HITBOX_ID_PREFIX);
}

function createTiledHitboxId(x: number, y: number): string {
    return `${TILED_HITBOX_ID_PREFIX}${x},${y}`;
}
