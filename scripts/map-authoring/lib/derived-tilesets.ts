import canvasPkg from "canvas";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { COLLECTION_ATLAS_SPECS } from "../config/collection-atlases";
import surfaceConfig from "../config/fantasy-surfaces.json";
import { parseTsx } from "./parser";
import { tileHasCollision } from "./semantics";
import type { ParsedTileObject, ParsedTileset, PropertyValue } from "./types";

const { createCanvas, loadImage } = canvasPkg;

const SHORE_KEYS = ["n", "e", "s", "w", "ne", "nw", "se", "sw"] as const;
type ShoreKey = (typeof SHORE_KEYS)[number];

const TILESET_NAME = "Tileset_Water_Shore_Seasons";
const TILE_SIZE = 16;

interface CollectionAtlasTileMetadata {
    sourceLocalId: number;
    outputLocalId: number;
    image: { width: number; height: number; source: string };
    offsetX: number;
    offsetY: number;
}

export async function buildDerivedTilesets(worktreeRoot: string): Promise<void> {
    await buildWaterShoreTileset(worktreeRoot);
    await buildCollectionAtlases(worktreeRoot);
}

async function buildWaterShoreTileset(worktreeRoot: string): Promise<void> {
    const tilesetsRoot = join(worktreeRoot, "public", "assets", "tilesets");
    const sandImagePath = join(
        tilesetsRoot,
        "seasons",
        "Art",
        "Water and Sand",
        "Tileset_Sand.png",
    );
    const waterImagePath = join(
        tilesetsRoot,
        "seasons",
        "Art",
        "Water and Sand",
        "Tileset_Water.png",
    );

    const outputArtDir = join(tilesetsRoot, "generated", "Art");
    const outputTsxDir = join(tilesetsRoot, "generated", "Tiled", "Tilesets");
    await mkdir(outputArtDir, { recursive: true });
    await mkdir(outputTsxDir, { recursive: true });

    const sandImage = await loadImage(sandImagePath);
    const waterImage = await loadImage(waterImagePath);
    const sandColumns = Math.floor(sandImage.width / TILE_SIZE);
    const waterColumns = Math.floor(waterImage.width / TILE_SIZE);
    const sandBaseTile = surfaceConfig.seasons.sand.shore;
    const waterSourceTiles = surfaceConfig.seasons.water.shoreTransitionSourceTiles;
    const generatedTiles = surfaceConfig.seasons.water.shoreTransitionTiles;

    const canvas = createCanvas(SHORE_KEYS.length * TILE_SIZE, TILE_SIZE);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    for (const key of SHORE_KEYS) {
        const outId = generatedTiles[key];
        drawTile(ctx, sandImage, sandColumns, sandBaseTile, outId, 0);
        drawTile(ctx, waterImage, waterColumns, waterSourceTiles[key], outId, 0);
    }

    await writeFile(join(outputArtDir, `${TILESET_NAME}.png`), canvas.toBuffer("image/png"));
    await writeFile(
        join(outputTsxDir, `${TILESET_NAME}.tsx`),
        renderWaterShoreTsx(sandBaseTile, waterSourceTiles, generatedTiles),
        "utf-8",
    );
}

function drawTile(
    ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
    image: Awaited<ReturnType<typeof loadImage>>,
    columns: number,
    sourceTileId: number,
    outputTileX: number,
    outputTileY: number,
): void {
    const sx = (sourceTileId % columns) * TILE_SIZE;
    const sy = Math.floor(sourceTileId / columns) * TILE_SIZE;
    ctx.drawImage(
        image,
        sx,
        sy,
        TILE_SIZE,
        TILE_SIZE,
        outputTileX * TILE_SIZE,
        outputTileY * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
    );
}

function renderWaterShoreTsx(
    sandBaseTile: number,
    waterSourceTiles: Record<ShoreKey, number>,
    generatedTiles: Record<ShoreKey, number>,
): string {
    const tiles = SHORE_KEYS.map((key) => {
        const id = generatedTiles[key];
        return ` <tile id="${id}">
  <properties>
   <property name="collides" type="bool" value="true"/>
   <property name="source_sand_tile" type="int" value="${sandBaseTile}"/>
   <property name="source_water_tile" type="int" value="${waterSourceTiles[key]}"/>
   <property name="shore_direction" value="${key}"/>
  </properties>
 </tile>`;
    }).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="${TILESET_NAME}" tilewidth="${TILE_SIZE}" tileheight="${TILE_SIZE}" tilecount="${SHORE_KEYS.length}" columns="${SHORE_KEYS.length}">
 <image source="../../Art/${TILESET_NAME}.png" width="${SHORE_KEYS.length * TILE_SIZE}" height="${TILE_SIZE}"/>
${tiles}
</tileset>
`;
}

async function buildCollectionAtlases(worktreeRoot: string): Promise<void> {
    for (const spec of COLLECTION_ATLAS_SPECS) {
        await buildCollectionAtlas(worktreeRoot, spec);
    }
}

async function buildCollectionAtlas(
    worktreeRoot: string,
    spec: (typeof COLLECTION_ATLAS_SPECS)[number],
): Promise<void> {
    const tilesetsRoot = join(worktreeRoot, "public", "assets", "tilesets");
    const [sourcePack, sourceName] = spec.source.split("/");
    const outputName = basename(spec.output);
    const sourceTilesetPath = join(
        tilesetsRoot,
        sourcePack,
        "Tiled",
        "Tilesets",
        `${sourceName}.tsx`,
    );
    const sourceTileset = await parseTsx(sourceTilesetPath);

    const entries = spec.localIds.map((sourceLocalId, outputLocalId) => {
        const image = sourceTileset.perTileImages[sourceLocalId];
        if (!image) {
            throw new Error(
                `collection atlas "${spec.output}" references missing ${spec.source} local_id ${sourceLocalId}`,
            );
        }
        return { sourceLocalId, outputLocalId, image };
    });
    const frameWidth = Math.max(...entries.map((entry) => entry.image.width));
    const frameHeight = Math.max(...entries.map((entry) => entry.image.height));
    const columns = Math.min(8, Math.max(1, entries.length));
    const rows = Math.ceil(entries.length / columns);

    const outputArtDir = join(tilesetsRoot, "generated", "Art");
    const outputTsxDir = join(tilesetsRoot, "generated", "Tiled", "Tilesets");
    await mkdir(outputArtDir, { recursive: true });
    await mkdir(outputTsxDir, { recursive: true });

    const canvas = createCanvas(columns * frameWidth, rows * frameHeight);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const tileMetadata: CollectionAtlasTileMetadata[] = [];
    for (const entry of entries) {
        const image = await loadImage(entry.image.absolutePath);
        const col = entry.outputLocalId % columns;
        const row = Math.floor(entry.outputLocalId / columns);
        const offsetX = 0;
        const offsetY = frameHeight - entry.image.height;
        ctx.drawImage(image, col * frameWidth + offsetX, row * frameHeight + offsetY);
        tileMetadata.push({ ...entry, offsetX, offsetY });
    }

    await writeFile(join(outputArtDir, `${outputName}.png`), canvas.toBuffer("image/png"));
    await writeFile(
        join(outputTsxDir, `${outputName}.tsx`),
        renderCollectionAtlasTsx({
            outputName,
            sourceTileset,
            sourceRef: spec.source,
            frameWidth,
            frameHeight,
            columns,
            rows,
            tileMetadata,
        }),
        "utf-8",
    );
}

function renderCollectionAtlasTsx(options: {
    outputName: string;
    sourceTileset: ParsedTileset;
    sourceRef: string;
    frameWidth: number;
    frameHeight: number;
    columns: number;
    rows: number;
    tileMetadata: CollectionAtlasTileMetadata[];
}): string {
    const tiles = options.tileMetadata
        .map((tile) => {
            const sourceProps = options.sourceTileset.properties[tile.sourceLocalId] ?? {};
            const props: Record<string, PropertyValue> = {
                ...sourceProps,
                ...(tileHasCollision(options.sourceTileset, tile.sourceLocalId)
                    ? { collides: true }
                    : {}),
                source_tileset: options.sourceRef,
                source_local_id: tile.sourceLocalId,
                source_image: tile.image.source,
                source_image_width: tile.image.width,
                source_image_height: tile.image.height,
                source_image_offset_x: tile.offsetX,
                source_image_offset_y: tile.offsetY,
                atlas_frame_width: options.frameWidth,
                atlas_frame_height: options.frameHeight,
            };
            const objects = shiftedObjects(
                options.sourceTileset.objectGroups[tile.sourceLocalId] ?? [],
                tile.offsetX,
                tile.offsetY,
            );
            return [
                ` <tile id="${tile.outputLocalId}">`,
                renderProperties(props, "  ").trimEnd(),
                renderObjectGroup(objects, "  ").trimEnd(),
                ` </tile>`,
            ]
                .filter(Boolean)
                .join("\n");
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="${options.outputName}" tilewidth="${options.frameWidth}" tileheight="${options.frameHeight}" tilecount="${options.tileMetadata.length}" columns="${options.columns}">
 <image source="../../Art/${options.outputName}.png" width="${options.columns * options.frameWidth}" height="${options.rows * options.frameHeight}"/>
${tiles}
</tileset>
`;
}

function shiftedObjects(
    objects: ParsedTileObject[],
    offsetX: number,
    offsetY: number,
): ParsedTileObject[] {
    return objects.map((object) => ({
        ...object,
        x: object.x + offsetX,
        y: object.y + offsetY,
    }));
}

function renderObjectGroup(objects: ParsedTileObject[], indent: string): string {
    if (objects.length === 0) return "";
    const lines = [`${indent}<objectgroup draworder="index">`];
    for (const object of objects) {
        const idAttr = object.id == null ? "" : ` id="${object.id}"`;
        const sizeAttrs =
            object.width > 0 || object.height > 0
                ? ` width="${formatNumber(object.width)}" height="${formatNumber(object.height)}"`
                : "";
        const opener = `${indent} <object${idAttr} x="${formatNumber(object.x)}" y="${formatNumber(object.y)}"${sizeAttrs}`;
        if (object.polygon && object.polygon.length > 0) {
            lines.push(`${opener}>`);
            lines.push(
                `${indent}  <polygon points="${escapeXml(
                    object.polygon
                        .map((point) => `${formatNumber(point.x)},${formatNumber(point.y)}`)
                        .join(" "),
                )}"/>`,
            );
            lines.push(`${indent} </object>`);
        } else {
            lines.push(`${opener}/>`);
        }
    }
    lines.push(`${indent}</objectgroup>`);
    return `${lines.join("\n")}\n`;
}

function renderProperties(props: Record<string, PropertyValue>, indent: string): string {
    const entries = Object.entries(props);
    if (entries.length === 0) return "";
    const lines = [`${indent}<properties>`];
    for (const [name, value] of entries) {
        const type = tiledPropertyType(value);
        const typeAttr = type === "string" ? "" : ` type="${type}"`;
        lines.push(
            `${indent} <property name="${escapeXml(name)}"${typeAttr} value="${escapeXml(String(value))}"/>`,
        );
    }
    lines.push(`${indent}</properties>`);
    return `${lines.join("\n")}\n`;
}

function tiledPropertyType(value: PropertyValue): "bool" | "float" | "int" | "string" {
    if (typeof value === "boolean") return "bool";
    if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
    return "string";
}

function escapeXml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function formatNumber(value: number): string {
    return Number.isInteger(value)
        ? String(value)
        : String(Number.parseFloat(value.toFixed(4))).replace(/\.0+$/, "");
}
