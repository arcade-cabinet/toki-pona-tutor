export function sanitizeTiledMapForCanvasPreset(parsedMap: any): any {
    const renderMap = clonePlainObject(parsedMap);
    const unsupportedRanges = unsupportedCollectionTilesetRanges(renderMap.tilesets ?? []);
    if (unsupportedRanges.length === 0) {
        return renderMap;
    }

    renderMap.tilesets = (renderMap.tilesets ?? []).filter(
        (tileset: any) => !isUnsupportedCollectionTileset(tileset),
    );
    renderMap.layers = sanitizeLayers(renderMap.layers ?? [], unsupportedRanges);
    return renderMap;
}

function clonePlainObject<T>(value: T): T {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
}

function unsupportedCollectionTilesetRanges(
    tilesets: any[],
): Array<{ firstgid: number; lastgid: number }> {
    return tilesets
        .filter(isUnsupportedCollectionTileset)
        .map((tileset) => {
            const firstgid = Number(tileset.firstgid ?? 0);
            const tileIds = Array.isArray(tileset.tiles)
                ? tileset.tiles
                      .map((tile: any) => Number(tile.id))
                      .filter((id: number) => Number.isFinite(id))
                : [];
            const tilecount = Number(tileset.tilecount ?? 0);
            const maxLocalId =
                tileIds.length > 0 ? Math.max(...tileIds) : Math.max(0, tilecount - 1);
            return {
                firstgid,
                lastgid: firstgid + maxLocalId,
            };
        })
        .filter((range) => range.firstgid > 0 && range.lastgid >= range.firstgid);
}

function isUnsupportedCollectionTileset(tileset: any): boolean {
    return (
        !tileset?.image?.source &&
        Array.isArray(tileset?.tiles) &&
        tileset.tiles.some((tile: any) => tile?.image?.source)
    );
}

function sanitizeLayers(
    layers: any[],
    unsupportedRanges: Array<{ firstgid: number; lastgid: number }>,
): any[] {
    return layers.map((layer) => {
        const next = { ...layer };
        if (Array.isArray(layer.layers)) {
            next.layers = sanitizeLayers(layer.layers, unsupportedRanges);
        }
        if (Array.isArray(layer.data)) {
            next.data = layer.data.map((gid: unknown) => {
                if (typeof gid !== "number") return gid;
                return isUnsupportedGid(gid, unsupportedRanges) ? 0 : gid;
            });
        }
        if (Array.isArray(layer.objects)) {
            next.objects = layer.objects.map((object: any) => {
                if (typeof object?.gid !== "number") return object;
                return isUnsupportedGid(object.gid, unsupportedRanges)
                    ? { ...object, gid: 0 }
                    : object;
            });
        }
        return next;
    });
}

function isUnsupportedGid(
    gid: number,
    ranges: Array<{ firstgid: number; lastgid: number }>,
): boolean {
    const realGid = gid & 0x1fffffff;
    return ranges.some((range) => realGid >= range.firstgid && realGid <= range.lastgid);
}
