/**
 * Tiled `.tsx` tileset parser.
 *
 * Reads Fan-tasy-style XML tileset files and extracts the subset of fields
 * the toolchain needs: dimensions, image path, per-tile custom properties,
 * animation frames, collision objectgroups, tile probabilities, and wangsets.
 *
 * See docs/build-time/MAP_AUTHORING.md § "The TMJ emitter" and "Tests".
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { imageSize } from "image-size";
import type {
    AnimationFrame,
    ParsedPoint,
    ParsedTileObject,
    ParsedTileset,
    ParsedWangset,
    PropertyValue,
} from "./types";

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    allowBooleanAttributes: true,
    parseAttributeValue: false, // we cast ourselves for consistency
    // fast-xml-parser collapses single children to objects; coerce to arrays
    // for element types that can repeat.
    isArray: (name) =>
        [
            "tile",
            "property",
            "frame",
            "object",
            "polygon",
            "wangset",
            "wangcolor",
            "wangtile",
        ].includes(name),
});

export async function parseTsx(path: string): Promise<ParsedTileset> {
    if (!existsSync(path)) {
        throw new Error(`TSX not found: ${path} (ENOENT)`);
    }
    const xml = await readFile(path, "utf-8");
    if (!xml.trimStart().startsWith("<?xml") && !xml.includes("<tileset")) {
        throw new Error(`Not a TSX file: ${path}`);
    }
    const parsed = parser.parse(xml);
    const ts = parsed.tileset;
    if (!ts) {
        throw new Error(`TSX has no <tileset> root: ${path}`);
    }

    const tileWidth = parseInt(ts.tilewidth, 10);
    const tileHeight = parseInt(ts.tileheight, 10);
    const tileCount = parseInt(ts.tilecount, 10);
    const columns = parseInt(ts.columns, 10);
    const spacing = ts.spacing != null ? parseInt(ts.spacing, 10) : 0;
    const margin = ts.margin != null ? parseInt(ts.margin, 10) : 0;
    const name = ts.name ?? "";

    if (!tileWidth || !tileHeight || !tileCount) {
        throw new Error(`TSX missing required attrs (tilewidth/tileheight/tilecount): ${path}`);
    }

    // Two flavors of tileset:
    //   (a) Single-image atlas: <tileset><image source=... /></tileset>
    //   (b) Image collection: <tileset columns="0">, each <tile> has its own <image>.
    // We parse both and expose a uniform ParsedTileset. For (b), the top-level
    // image.* fields describe the "first" tile's image for compatibility; the
    // renderer has a separate code path that uses per-tile images.
    const imageEl = ts.image;
    const isCollection = !imageEl || !imageEl.source;

    let imageSrc = "";
    let imageAbs = "";
    let imageWidth = 0;
    let imageHeight = 0;

    if (!isCollection) {
        imageSrc = imageEl.source;
        imageAbs = resolve(dirname(path), imageSrc);
        imageWidth = imageEl.width != null ? parseInt(imageEl.width, 10) : 0;
        imageHeight = imageEl.height != null ? parseInt(imageEl.height, 10) : 0;
        if ((!imageWidth || !imageHeight) && existsSync(imageAbs)) {
            try {
                const buf = await readFile(imageAbs);
                const dims = imageSize(new Uint8Array(buf));
                imageWidth = dims.width ?? 0;
                imageHeight = dims.height ?? 0;
            } catch (err) {
                // Unsupported/corrupt image — leave dimensions at 0 so callers can
                // tell the tile is unusable. Fan-tasy ships only PNGs so this should
                // never fire in practice; the guard keeps the parser fault-tolerant.
                console.warn(
                    `[parser] could not read image dimensions for ${imageAbs}: ${(err as Error).message}`,
                );
            }
        }
    }

    const properties: Record<number, Record<string, PropertyValue>> = {};
    const animations: Record<number, AnimationFrame[]> = {};
    const probabilities: Record<number, number> = {};
    const objectGroups: Record<number, ParsedTileObject[]> = {};
    const perTileImages: Record<
        number,
        { source: string; absolutePath: string; width: number; height: number }
    > = {};

    const tiles = Array.isArray(ts.tile) ? ts.tile : ts.tile ? [ts.tile] : [];
    for (const tile of tiles) {
        const id = parseInt(tile.id, 10);
        if (Number.isNaN(id)) continue;
        if (tile.probability != null) {
            const probability = parseFloat(String(tile.probability));
            if (Number.isFinite(probability)) probabilities[id] = probability;
        }

        // Per-tile image (collection-of-images tileset).
        if (tile.image?.source) {
            const src: string = tile.image.source;
            const abs = resolve(dirname(path), src);
            let w = tile.image.width != null ? parseInt(tile.image.width, 10) : 0;
            let h = tile.image.height != null ? parseInt(tile.image.height, 10) : 0;
            if ((!w || !h) && existsSync(abs)) {
                try {
                    const buf = await readFile(abs);
                    const dims = imageSize(new Uint8Array(buf));
                    w = dims.width ?? 0;
                    h = dims.height ?? 0;
                } catch (err) {
                    console.warn(
                        `[parser] could not read per-tile image ${abs}: ${(err as Error).message}`,
                    );
                }
            }
            perTileImages[id] = { source: src, absolutePath: abs, width: w, height: h };
            // For compatibility, seed the tileset-level image fields from the
            // first per-tile image encountered.
            if (!imageSrc) {
                imageSrc = src;
                imageAbs = abs;
                imageWidth = w;
                imageHeight = h;
            }
        }

        const propsNode = tile.properties;
        if (propsNode) {
            const propList = Array.isArray(propsNode.property)
                ? propsNode.property
                : propsNode.property
                  ? [propsNode.property]
                  : [];
            const pbag: Record<string, PropertyValue> = {};
            for (const p of propList) {
                const pname: string = p.name;
                const ptype: string = p.type ?? "string";
                const praw: string = p.value ?? "";
                pbag[pname] = castPropertyValue(praw, ptype);
            }
            if (Object.keys(pbag).length > 0) {
                properties[id] = pbag;
            }
        }

        const animNode = tile.animation;
        if (animNode) {
            const frames = Array.isArray(animNode.frame)
                ? animNode.frame
                : animNode.frame
                  ? [animNode.frame]
                  : [];
            if (frames.length > 0) {
                animations[id] = frames.map((f: { tileid: string; duration: string }) => ({
                    tileid: parseInt(f.tileid, 10),
                    duration: parseInt(f.duration, 10),
                }));
            }
        }

        const objectNode = tile.objectgroup;
        if (objectNode) {
            const objectList = asArray(objectNode.object);
            const parsedObjects = objectList
                .map((object) => parseTileObject(object))
                .filter((object): object is ParsedTileObject => object != null);
            if (parsedObjects.length > 0) {
                objectGroups[id] = parsedObjects;
            }
        }
    }

    const wangsets = parseWangsets(ts.wangsets);

    return {
        source: path,
        absolutePath: path,
        name,
        tileWidth,
        tileHeight,
        tileCount,
        columns,
        spacing,
        margin,
        image: {
            source: imageSrc,
            absolutePath: imageAbs,
            width: imageWidth,
            height: imageHeight,
        },
        properties,
        animations,
        probabilities,
        objectGroups,
        wangsets,
        isCollection,
        perTileImages,
    };
}

function parseTileObject(raw: Record<string, unknown>): ParsedTileObject | null {
    const x = parseNumber(raw.x, 0);
    const y = parseNumber(raw.y, 0);
    const width = parseNumber(raw.width, 0);
    const height = parseNumber(raw.height, 0);
    const polygonNode = asArray(raw.polygon)[0] as Record<string, unknown> | undefined;
    const polygon =
        typeof polygonNode?.points === "string" ? parsePoints(polygonNode.points) : undefined;

    return {
        id: raw.id != null ? parseInt(String(raw.id), 10) : null,
        x,
        y,
        width,
        height,
        ...(polygon && polygon.length > 0 ? { polygon } : {}),
    };
}

function parsePoints(raw: string): ParsedPoint[] {
    return raw
        .trim()
        .split(/\s+/)
        .map((pair) => {
            const [xRaw, yRaw] = pair.split(",");
            return {
                x: parseNumber(xRaw, 0),
                y: parseNumber(yRaw, 0),
            };
        });
}

function parseWangsets(raw: unknown): ParsedWangset[] {
    if (!raw || typeof raw !== "object") return [];
    const wangsetNodes = asArray((raw as { wangset?: unknown }).wangset);
    return wangsetNodes.map((node) => {
        const wangset = node as Record<string, unknown>;
        const colors = asArray(wangset.wangcolor).map((colorNode, index) => {
            const color = colorNode as Record<string, unknown>;
            return {
                index: index + 1,
                name: String(color.name ?? ""),
                color: String(color.color ?? ""),
                tile: parseNumber(firstScalar(color.tile), -1),
                probability: parseNumber(color.probability, 1),
            };
        });
        const tiles = asArray(wangset.wangtile)
            .map((tileNode) => {
                const tile = tileNode as Record<string, unknown>;
                const tileid = parseNumber(tile.tileid, Number.NaN);
                const wangid = String(tile.wangid ?? "")
                    .split(",")
                    .map((value) => parseInt(value, 10))
                    .filter((value) => Number.isInteger(value));
                return { tileid, wangid };
            })
            .filter((tile) => Number.isInteger(tile.tileid) && tile.tileid >= 0);

        return {
            name: String(wangset.name ?? ""),
            type: String(wangset.type ?? ""),
            tile: parseNumber(firstScalar(wangset.tile), -1),
            colors,
            tiles,
        };
    });
}

function asArray<T>(value: T | T[] | undefined): T[] {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
}

function firstScalar(value: unknown): unknown {
    return Array.isArray(value) ? value[0] : value;
}

function parseNumber(value: unknown, fallback: number): number {
    const parsed = typeof value === "number" ? value : parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : fallback;
}

function castPropertyValue(raw: string, type: string): PropertyValue {
    switch (type) {
        case "int":
            return parseInt(raw, 10);
        case "float":
            return parseFloat(raw);
        case "bool":
            return raw === "true";
        default:
            return raw;
    }
}
