import canvasPkg from "canvas";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import surfaceConfig from "../config/fantasy-surfaces.json";

const { createCanvas, loadImage } = canvasPkg;

const SHORE_KEYS = ["n", "e", "s", "w", "ne", "nw", "se", "sw"] as const;
type ShoreKey = (typeof SHORE_KEYS)[number];

const TILESET_NAME = "Tileset_Water_Shore_Seasons";
const TILE_SIZE = 16;

export async function buildDerivedTilesets(worktreeRoot: string): Promise<void> {
    await buildWaterShoreTileset(worktreeRoot);
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
