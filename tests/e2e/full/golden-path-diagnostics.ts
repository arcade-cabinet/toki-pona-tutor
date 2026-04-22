import { expect, type Page, type TestInfo } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { PNG } from "pngjs";

type MapConfig = {
    label: string;
    biome: string;
    music_track: string;
    safe_spawn?: { x: number; y: number };
};

type MapsConfig = {
    maps: Record<string, MapConfig>;
};

type VisualsConfig = {
    map_viewport: {
        min_tile_screen_px: number;
    };
};

type TmjProperty = {
    name?: string;
    value?: unknown;
};

type TmjTileset = {
    firstgid: number;
    source: string;
};

type TmjObject = {
    name?: string;
    type?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    properties?: TmjProperty[];
};

type TmjLayer = {
    name: string;
    type: string;
    width?: number;
    height?: number;
    data?: number[];
    objects?: TmjObject[];
};

type TmjMap = {
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    properties?: TmjProperty[];
    tilesets?: TmjTileset[];
    layers?: TmjLayer[];
};

type DiagnosticFinding = {
    severity: "error" | "warn" | "info";
    check: string;
    message: string;
};

type ScreenshotComponent = {
    x: number;
    y: number;
    width: number;
    height: number;
    sampledPixelCount: number;
    viewportCoverageRatio: number;
};

type PresentationDiagnostics = {
    authoredMapPixels: { width: number; height: number } | null;
    targetTileScreenSizePx: number;
    largestVisibleComponent: ScreenshotComponent | null;
    estimatedRenderScale: number | null;
    estimatedTileScreenSizePx: number | null;
    estimatedMapViewportCoverageRatio: number | null;
    note: string;
};

type RuntimeDiagnostics = {
    state: {
        playerId: string | null;
        serverPlayerId: string | null;
        currentMapId: string | null;
        serverMapId: string | null;
        journeyBeat: string | null;
        starterChosen: string | null;
        serverGraphic: string | null;
        position: { x: number | null; y: number | null };
        serverPosition: { x: number | null; y: number | null };
    };
    party: unknown[];
    inventory: Record<string, number>;
    viewport: { width: number; height: number; deviceScaleFactor: number };
    camera: {
        scale: { x: number; y: number } | null;
        center: { x: number; y: number } | null;
        worldScreenSize: { width: number; height: number } | null;
    } | null;
    canvas: {
        present: boolean;
        visible: boolean;
        intrinsic: { width: number; height: number } | null;
        rect: { x: number; y: number; width: number; height: number } | null;
    };
    ui: {
        titleText: string | null;
        dialogText: string | null;
        dialogChoices: string[];
        visibleTestIds: string[];
        bodyClasses: string[];
    };
    runtimeTile: {
        mapWidth: number;
        mapHeight: number;
        tilewidth: number;
        tileheight: number;
        mapPixels: { width: number; height: number };
        renderTile: { x: number; y: number } | null;
        movementTile: { x: number; y: number } | null;
        movementGrid: { width: number; height: number };
        currentTileCollision: boolean | null;
        adjacentMovementTiles: Array<{
            direction: "up" | "right" | "down" | "left";
            tile: { x: number; y: number };
            outOfBounds: boolean;
            hasCollision: boolean | null;
        }>;
    } | null;
};

type StaticMapDiagnostics = {
    mapId: string;
    config: MapConfig | null;
    tmj: {
        dimensions: { width: number; height: number; tilewidth: number; tileheight: number };
        properties: Record<string, unknown>;
        tilesets: TmjTileset[];
        tilesetFamilies: string[];
        layers: Array<{
            name: string;
            type: string;
            nonZeroTiles?: number;
            objectCount?: number;
        }>;
        objectCountsByType: Record<string, number>;
        tileContext: Array<{
            layer: string;
            center: StaticTileCell;
            matrix3x3: StaticTileCell[][];
        }>;
        nearbyObjects: StaticObjectContext[];
    } | null;
};

type StaticTileCell = {
    x: number;
    y: number;
    gid: number | null;
    tilesetSource: string | null;
    tilesetFamily: string | null;
    localId: number | null;
    label: string;
};

type StaticObjectContext = {
    layer: string;
    name: string;
    type: string;
    tile: { x: number; y: number };
    rectTiles: { width: number; height: number };
    distanceTiles: number;
};

export type GoldenPathCheckpointOptions = {
    id: string;
    title: string;
    expectedMapId?: string;
    expectedVisibleTestIds?: string[];
    expectedHiddenTestIds?: string[];
    allowMapMismatch?: boolean;
    focus: string[];
};

const REVIEW_CHECKLIST = [
    {
        category: "Visual Identity",
        items: [
            "Biome palette matches the map label and story beat; no placeholder or off-family asset stands out.",
            "Sprites, tiles, HUD, dialog, and effects share a coherent scale, outline weight, and saturation range.",
            "Fonts, colors, borders, shadows, and button styling match the established poki soweli brand system.",
        ],
    },
    {
        category: "Tile Orientation And Autotile Seams",
        items: [
            "Road, shoreline, cliff, bridge, stairs, wall, cave, and roof tiles face the correct direction.",
            "No single tile is rotated/flipped against neighboring terrain unless it is intentionally asymmetric.",
            "Multi-tile objects such as houses, trees, rocks, torches, and bridges are not split, clipped, or offset.",
        ],
    },
    {
        category: "Collision And Player Placement",
        items: [
            "The player foot anchor is on a walkable tile, not inside water, cliff, wall, roof, tree, NPC, or prop collision.",
            "Warp exits, safe spawns, dialog starts, and post-combat returns do not place the player against an impossible wall.",
            "Nearby blocked tiles read as blocked visually; nearby walkable tiles read as walkable visually.",
        ],
    },
    {
        category: "Map Composition",
        items: [
            "Pathing is legible from the screenshot without reading code; landmarks point the player toward the next action.",
            "Encounter grass/water/cave areas are visually distinct from normal floor while still matching the biome.",
            "NPCs, shops, jan lawa, and final-boss staging have enough breathing room for tap/mouse interaction.",
        ],
    },
    {
        category: "Mobile/HUD Interaction",
        items: [
            "Important buttons and dialog choices remain large enough for tap and are not hidden by safe-area edges.",
            "HUD chrome frames gameplay without covering the active target, player, dialog, or map clue.",
            "Touch-first affordances are visible without requiring keyboard knowledge.",
        ],
    },
    {
        category: "Combat/Capture Readability",
        items: [
            "Wild-battle cards, HP bars, capture throw/result feedback, and action-battle reticles align with their targets.",
            "Damage/capture/result labels remain readable over the map and do not fight with dialog text.",
            "Lead creature, enemy, and restored hero graphics are visually obvious at transition boundaries.",
        ],
    },
    {
        category: "Technical Render Integrity",
        items: [
            "Canvas is not blank, cropped, scaled strangely, or showing missing-texture placeholders.",
            "No missing font fallback, broken image, layout overlap, or dev-error overlay appears.",
            "Screenshot map id, server map id, journey beat, and visible UI match the expected golden-path step.",
        ],
    },
];

const mapsConfig = JSON.parse(
    readFileSync(new URL("../../../src/content/gameplay/maps.json", import.meta.url), "utf-8"),
) as MapsConfig;
const visualsConfig = JSON.parse(
    readFileSync(new URL("../../../src/content/gameplay/visuals.json", import.meta.url), "utf-8"),
) as VisualsConfig;

const ALLOWED_TILESET_FAMILIES = new Set([
    "core",
    "seasons",
    "snow",
    "desert",
    "fortress",
    "indoor",
    "generated",
]);

const INVENTORY_ITEMS = ["ma", "poki_lili", "poki_wawa", "kili", "telo_pona"];

const VISIBLE_TEST_IDS = [
    "hud-menu-toggle",
    "hud-status",
    "warp-loading",
    "wild-battle",
    "wild-battle-lead",
    "wild-battle-target",
    "wild-battle-damage",
    "wild-battle-capture",
    "lead-movebar",
    "lead-movebar-target",
    "lead-switch-panel",
    "pause-overlay",
];

const OVERLAY_SCREENSHOT_SELECTORS = [
    ".rpg-ui-title-screen",
    ".rpg-ui-dialog",
    ...VISIBLE_TEST_IDS.map((testId) => `[data-testid="${testId}"]`),
];

export async function captureGoldenPathCheckpoint(
    page: Page,
    testInfo: TestInfo,
    options: GoldenPathCheckpointOptions,
): Promise<void> {
    await page.locator("#rpg canvas").waitFor({ state: "visible", timeout: 15_000 });
    await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );

    const screenshotPath = testInfo.outputPath(`golden-path/${options.id}.png`);
    mkdirSync(dirname(screenshotPath), { recursive: true });
    await captureCompositedScreenshot(page, screenshotPath);

    const screenshot = screenshotDiagnostics(screenshotPath);
    const runtime = await collectRuntimeDiagnostics(page);
    const mapId = runtime.state.serverMapId ?? runtime.state.currentMapId;
    const staticMap = mapId
        ? collectStaticMapDiagnostics(mapId, runtime.runtimeTile?.renderTile ?? null)
        : null;
    const presentation = buildPresentationDiagnostics(screenshot, runtime, staticMap);
    const automatedFindings = buildAutomatedFindings(
        options,
        screenshot,
        runtime,
        staticMap,
        presentation,
    );
    const diagnostic = {
        id: options.id,
        title: options.title,
        focus: options.focus,
        screenshot,
        presentation,
        runtime,
        staticMap,
        automatedFindings,
        reviewChecklist: REVIEW_CHECKLIST,
    };

    const jsonPath = testInfo.outputPath(`golden-path/${options.id}.diagnostics.json`);
    const markdownPath = testInfo.outputPath(`golden-path/${options.id}.checklist.md`);
    writeFileSync(jsonPath, `${JSON.stringify(diagnostic, null, 2)}\n`);
    writeFileSync(markdownPath, renderMarkdownChecklist(diagnostic));

    await testInfo.attach(`${options.id} screenshot`, {
        path: screenshotPath,
        contentType: "image/png",
    });
    await testInfo.attach(`${options.id} diagnostics`, {
        path: jsonPath,
        contentType: "application/json",
    });
    await testInfo.attach(`${options.id} review checklist`, {
        path: markdownPath,
        contentType: "text/markdown",
    });

    const errors = automatedFindings.filter((finding) => finding.severity === "error");
    expect(errors, `${options.id} automated visual diagnostics`).toEqual([]);
}

async function captureCompositedScreenshot(page: Page, screenshotPath: string): Promise<void> {
    const dataUrl = await page.evaluate(
        async ({ overlaySelectors }) => {
            await document.fonts?.ready?.catch(() => undefined);
            await new Promise<void>((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            );

            const width = Math.max(1, Math.ceil(window.innerWidth));
            const height = Math.max(1, Math.ceil(window.innerHeight));
            const output = document.createElement("canvas");
            output.width = width;
            output.height = height;
            const context = output.getContext("2d");
            if (!context) throw new Error("captureCompositedScreenshot: 2d context unavailable");

            const bodyBackground = window.getComputedStyle(document.body).backgroundColor;
            context.fillStyle = bodyBackground === "rgba(0, 0, 0, 0)" ? "#000" : bodyBackground;
            context.fillRect(0, 0, width, height);

            const isVisible = (
                element: Element | null,
            ): element is HTMLElement | HTMLCanvasElement => {
                if (!element) return false;
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                return (
                    style.visibility !== "hidden" &&
                    style.display !== "none" &&
                    rect.width > 0 &&
                    rect.height > 0
                );
            };

            for (const canvas of Array.from(document.querySelectorAll("#rpg canvas"))) {
                if (!(canvas instanceof HTMLCanvasElement) || !isVisible(canvas)) continue;
                const rect = canvas.getBoundingClientRect();
                context.drawImage(canvas, rect.x, rect.y, rect.width, rect.height);
            }

            const overlaySet = new Set<HTMLElement>();
            for (const selector of overlaySelectors) {
                for (const element of Array.from(document.querySelectorAll(selector))) {
                    if (element instanceof HTMLElement && isVisible(element)) {
                        overlaySet.add(element);
                    }
                }
            }
            const overlays = Array.from(overlaySet)
                .filter(
                    (element) =>
                        !Array.from(overlaySet).some(
                            (other) => other !== element && other.contains(element),
                        ),
                )
                .sort((a, b) => {
                    const position = a.compareDocumentPosition(b);
                    return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
                });

            async function inlineCssUrls(value: string): Promise<string> {
                const matches = Array.from(value.matchAll(/url\(["']?([^"')]+)["']?\)/g));
                let nextValue = value;
                for (const match of matches) {
                    const raw = match[0];
                    const url = match[1];
                    if (!url || url.startsWith("data:")) continue;
                    try {
                        const response = await fetch(new URL(url, document.baseURI));
                        if (!response.ok) continue;
                        const blob = await response.blob();
                        const dataUrl = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(String(reader.result));
                            reader.onerror = () => reject(reader.error);
                            reader.readAsDataURL(blob);
                        });
                        nextValue = nextValue.replace(raw, `url("${dataUrl}")`);
                    } catch {
                        // Keep the original URL if the browser refuses to inline it.
                    }
                }
                return nextValue;
            }

            async function inlineStyles(source: Element, target: Element): Promise<void> {
                const style = window.getComputedStyle(source);
                const declarations = [];
                for (const prop of Array.from(style)) {
                    let value = style.getPropertyValue(prop);
                    if (value.includes("url(")) {
                        value = await inlineCssUrls(value);
                    }
                    declarations.push(`${prop}:${value};`);
                }
                target.setAttribute("style", declarations.join(""));
                for (let index = 0; index < source.children.length; index += 1) {
                    await inlineStyles(source.children[index], target.children[index]);
                }
            }

            async function drawOverlay(element: HTMLElement): Promise<void> {
                const rect = element.getBoundingClientRect();
                const overlayWidth = Math.max(1, Math.ceil(rect.width));
                const overlayHeight = Math.max(1, Math.ceil(rect.height));
                const clone = element.cloneNode(true) as HTMLElement;
                for (const canvas of Array.from(clone.querySelectorAll("canvas"))) {
                    canvas.remove();
                }
                await inlineStyles(element, clone);
                clone.style.position = "static";
                clone.style.inset = "auto";
                clone.style.left = "auto";
                clone.style.top = "auto";
                clone.style.right = "auto";
                clone.style.bottom = "auto";
                clone.style.transform = "none";
                clone.style.margin = "0";
                clone.style.width = `${overlayWidth}px`;
                clone.style.height = `${overlayHeight}px`;
                clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

                const markup = new XMLSerializer().serializeToString(clone);
                const svg = [
                    `<svg xmlns="http://www.w3.org/2000/svg" width="${overlayWidth}" height="${overlayHeight}">`,
                    `<foreignObject width="100%" height="100%">${markup}</foreignObject>`,
                    "</svg>",
                ].join("");
                const image = new Image();
                image.decoding = "sync";
                image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
                await new Promise<void>((resolve, reject) => {
                    image.onload = () => resolve();
                    image.onerror = () =>
                        reject(
                            new Error(
                                `captureCompositedScreenshot: failed to render ${element.tagName}`,
                            ),
                        );
                });
                context.drawImage(image, rect.x, rect.y, overlayWidth, overlayHeight);
            }

            for (const overlay of overlays) {
                await drawOverlay(overlay);
            }

            return output.toDataURL("image/png");
        },
        { overlaySelectors: OVERLAY_SCREENSHOT_SELECTORS },
    );
    const [, base64] = dataUrl.split(",");
    if (!base64) {
        throw new Error(`captureCompositedScreenshot: failed to read ${screenshotPath}`);
    }
    writeFileSync(screenshotPath, Buffer.from(base64, "base64"));
}

async function collectRuntimeDiagnostics(page: Page): Promise<RuntimeDiagnostics> {
    return page.evaluate(
        async ({ inventoryItems, visibleTestIds }) => {
            const state = await window.__POKI__!.testing.getState();
            const party = await window.__POKI__!.testing.getParty();
            const inventoryEntries = await Promise.all(
                inventoryItems.map(async (itemId) => [
                    itemId,
                    await window.__POKI__!.testing.getInventoryCount(itemId),
                ]),
            );
            const canvas = document.querySelector("#rpg canvas") as HTMLCanvasElement | null;
            const canvasRect = canvas?.getBoundingClientRect() ?? null;
            const titleText =
                document.querySelector(".rpg-ui-title-screen-title")?.textContent?.trim() ?? null;
            const dialogText =
                document.querySelector(".rpg-ui-dialog-content")?.textContent?.trim() ?? null;
            const dialogChoices = Array.from(
                document.querySelectorAll('[data-testid^="dialog-choice-"]'),
            )
                .map((choice) => choice.textContent?.trim() ?? "")
                .filter(Boolean);
            const isVisible = (element: Element | null): boolean => {
                if (!element) return false;
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                return (
                    style.visibility !== "hidden" &&
                    style.display !== "none" &&
                    rect.width > 0 &&
                    rect.height > 0
                );
            };
            const visibleIds = visibleTestIds.filter((testId) =>
                isVisible(document.querySelector(`[data-testid="${testId}"]`)),
            );

            const engine = window.__POKI__?.engine as
                | {
                      scene?: { data?: () => { tiled?: unknown } };
                      canvasElement?: {
                          props?: {
                              context?: {
                                  viewport?: {
                                      scale?: { x?: number; y?: number };
                                      center?: { x?: number; y?: number };
                                      worldScreenWidth?: number;
                                      worldScreenHeight?: number;
                                  };
                              };
                          };
                      };
                  }
                | null
                | undefined;
            const engineViewport = engine?.canvasElement?.props?.context?.viewport;
            const camera = engineViewport
                ? {
                      scale:
                          typeof engineViewport.scale?.x === "number" &&
                          typeof engineViewport.scale?.y === "number"
                              ? { x: engineViewport.scale.x, y: engineViewport.scale.y }
                              : null,
                      center:
                          typeof engineViewport.center?.x === "number" &&
                          typeof engineViewport.center?.y === "number"
                              ? { x: engineViewport.center.x, y: engineViewport.center.y }
                              : null,
                      worldScreenSize:
                          typeof engineViewport.worldScreenWidth === "number" &&
                          typeof engineViewport.worldScreenHeight === "number"
                              ? {
                                    width: engineViewport.worldScreenWidth,
                                    height: engineViewport.worldScreenHeight,
                                }
                              : null,
                  }
                : null;

            const runtimeTile = (() => {
                const map = engine?.scene?.data?.()?.tiled as
                    | {
                          width: number;
                          height: number;
                          tilewidth: number;
                          tileheight: number;
                          getTileByPosition?: (
                              x: number,
                              y: number,
                              z?: [number, number],
                              options?: { populateTiles?: boolean },
                          ) => { hasCollision?: boolean };
                      }
                    | undefined;
                if (!map || typeof map.getTileByPosition !== "function") return null;

                const playerX = state.serverPosition.x ?? state.position.x;
                const playerY = state.serverPosition.y ?? state.position.y;
                if (typeof playerX !== "number" || typeof playerY !== "number") return null;

                const movementTileSize = 32;
                const mapPixels = {
                    width: map.width * map.tilewidth,
                    height: map.height * map.tileheight,
                };
                const movementGrid = {
                    width: Math.max(1, Math.floor(mapPixels.width / movementTileSize)),
                    height: Math.max(1, Math.floor(mapPixels.height / movementTileSize)),
                };
                const renderTile = {
                    x: Math.floor(playerX / map.tilewidth),
                    y: Math.floor(playerY / map.tileheight),
                };
                const movementTile = {
                    x: Math.floor(playerX / movementTileSize),
                    y: Math.floor(playerY / movementTileSize),
                };
                const movementCollision = (tile: { x: number; y: number }): boolean | null => {
                    if (
                        tile.x < 0 ||
                        tile.y < 0 ||
                        tile.x >= movementGrid.width ||
                        tile.y >= movementGrid.height
                    ) {
                        return null;
                    }
                    const originX = tile.x * movementTileSize;
                    const originY = tile.y * movementTileSize;
                    for (let offsetY = 0; offsetY < movementTileSize; offsetY += map.tileheight) {
                        for (
                            let offsetX = 0;
                            offsetX < movementTileSize;
                            offsetX += map.tilewidth
                        ) {
                            const info = map.getTileByPosition!(
                                originX + offsetX,
                                originY + offsetY,
                                [0, 0],
                                { populateTiles: false },
                            );
                            if (info?.hasCollision) return true;
                        }
                    }
                    return false;
                };
                const adjacent = [
                    ["up", { x: movementTile.x, y: movementTile.y - 1 }],
                    ["right", { x: movementTile.x + 1, y: movementTile.y }],
                    ["down", { x: movementTile.x, y: movementTile.y + 1 }],
                    ["left", { x: movementTile.x - 1, y: movementTile.y }],
                ] as const;

                return {
                    mapWidth: map.width,
                    mapHeight: map.height,
                    tilewidth: map.tilewidth,
                    tileheight: map.tileheight,
                    mapPixels,
                    renderTile,
                    movementTile,
                    movementGrid,
                    currentTileCollision: movementCollision(movementTile),
                    adjacentMovementTiles: adjacent.map(([direction, tile]) => {
                        const outOfBounds =
                            tile.x < 0 ||
                            tile.y < 0 ||
                            tile.x >= movementGrid.width ||
                            tile.y >= movementGrid.height;
                        return {
                            direction,
                            tile,
                            outOfBounds,
                            hasCollision: outOfBounds ? null : movementCollision(tile),
                        };
                    }),
                };
            })();

            return {
                state: {
                    playerId: state.playerId,
                    serverPlayerId: state.serverPlayerId,
                    currentMapId: state.currentMapId,
                    serverMapId: state.serverMapId,
                    journeyBeat: state.journeyBeat,
                    starterChosen: state.starterChosen,
                    serverGraphic: state.serverGraphic,
                    position: state.position,
                    serverPosition: state.serverPosition,
                },
                party,
                inventory: Object.fromEntries(inventoryEntries),
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    deviceScaleFactor: window.devicePixelRatio,
                },
                camera,
                canvas: {
                    present: !!canvas,
                    visible: isVisible(canvas),
                    intrinsic: canvas ? { width: canvas.width, height: canvas.height } : null,
                    rect: canvasRect
                        ? {
                              x: canvasRect.x,
                              y: canvasRect.y,
                              width: canvasRect.width,
                              height: canvasRect.height,
                          }
                        : null,
                },
                ui: {
                    titleText,
                    dialogText,
                    dialogChoices,
                    visibleTestIds: visibleIds,
                    bodyClasses: Array.from(document.body.classList),
                },
                runtimeTile,
            };
        },
        { inventoryItems: INVENTORY_ITEMS, visibleTestIds: VISIBLE_TEST_IDS },
    );
}

function collectStaticMapDiagnostics(
    mapId: string,
    renderTile: { x: number; y: number } | null,
): StaticMapDiagnostics {
    const tmj = readTmj(mapId);
    const properties = Object.fromEntries(
        tmj.properties?.map((property) => [property.name ?? "", property.value]) ?? [],
    );
    const objectCountsByType: Record<string, number> = {};
    for (const layer of tmj.layers ?? []) {
        for (const object of layer.objects ?? []) {
            const key = object.type || object.name || "untyped";
            objectCountsByType[key] = (objectCountsByType[key] ?? 0) + 1;
        }
    }

    return {
        mapId,
        config: mapsConfig.maps[mapId] ?? null,
        tmj: {
            dimensions: {
                width: tmj.width,
                height: tmj.height,
                tilewidth: tmj.tilewidth,
                tileheight: tmj.tileheight,
            },
            properties,
            tilesets: tmj.tilesets ?? [],
            tilesetFamilies: Array.from(
                new Set((tmj.tilesets ?? []).map((tileset) => tilesetFamily(tileset.source))),
            ).sort(),
            layers: (tmj.layers ?? []).map((layer) => ({
                name: layer.name,
                type: layer.type,
                nonZeroTiles: layer.data?.filter((gid) => gid !== 0).length,
                objectCount: layer.objects?.length,
            })),
            objectCountsByType,
            tileContext: renderTile ? tileContext(tmj, renderTile) : [],
            nearbyObjects: renderTile ? nearbyObjects(tmj, renderTile) : [],
        },
    };
}

function readTmj(mapId: string): TmjMap {
    return JSON.parse(
        readFileSync(new URL(`../../../public/assets/maps/${mapId}.tmj`, import.meta.url), "utf-8"),
    ) as TmjMap;
}

function tilesetFamily(source: string): string {
    const normalized = source.replaceAll("\\", "/");
    const match = normalized.match(/(?:^|\/)tilesets\/([^/]+)/);
    return match?.[1] ?? "unknown";
}

function tileContext(
    tmj: TmjMap,
    renderTile: { x: number; y: number },
): StaticMapDiagnostics["tmj"]["tileContext"] {
    const layers = (tmj.layers ?? []).filter(
        (layer) => layer.type === "tilelayer" && Array.isArray(layer.data),
    );
    return layers.map((layer) => {
        const matrix3x3: StaticTileCell[][] = [];
        for (let y = renderTile.y - 1; y <= renderTile.y + 1; y += 1) {
            const row: StaticTileCell[] = [];
            for (let x = renderTile.x - 1; x <= renderTile.x + 1; x += 1) {
                if (x < 0 || y < 0 || x >= tmj.width || y >= tmj.height) {
                    row.push(tileCell(tmj, x, y, null));
                } else {
                    row.push(tileCell(tmj, x, y, layer.data?.[y * tmj.width + x] ?? null));
                }
            }
            matrix3x3.push(row);
        }
        return {
            layer: layer.name,
            center:
                renderTile.x < 0 ||
                renderTile.y < 0 ||
                renderTile.x >= tmj.width ||
                renderTile.y >= tmj.height
                    ? tileCell(tmj, renderTile.x, renderTile.y, null)
                    : tileCell(
                          tmj,
                          renderTile.x,
                          renderTile.y,
                          layer.data?.[renderTile.y * tmj.width + renderTile.x] ?? null,
                      ),
            matrix3x3,
        };
    });
}

function tileCell(tmj: TmjMap, x: number, y: number, gid: number | null): StaticTileCell {
    const resolved = gid && gid > 0 ? resolveGid(tmj, gid) : null;
    const source = resolved?.tileset.source ?? null;
    const localId = resolved?.localId ?? null;
    const sourceName = source ? basename(source, ".tsx") : null;
    const label =
        gid == null ? "." : gid === 0 ? "empty" : `${sourceName ?? "unknown"}#${localId ?? "?"}`;

    return {
        x,
        y,
        gid,
        tilesetSource: source,
        tilesetFamily: source ? tilesetFamily(source) : null,
        localId,
        label,
    };
}

function resolveGid(tmj: TmjMap, gid: number): { tileset: TmjTileset; localId: number } | null {
    const tilesets = [...(tmj.tilesets ?? [])].sort((a, b) => a.firstgid - b.firstgid);
    let match: TmjTileset | null = null;
    for (const tileset of tilesets) {
        if (tileset.firstgid > gid) break;
        match = tileset;
    }
    return match ? { tileset: match, localId: gid - match.firstgid } : null;
}

function nearbyObjects(tmj: TmjMap, renderTile: { x: number; y: number }): StaticObjectContext[] {
    const objects: StaticObjectContext[] = [];
    for (const layer of tmj.layers ?? []) {
        if (layer.type !== "objectgroup") continue;
        for (const object of layer.objects ?? []) {
            const tile = {
                x: Math.floor((object.x ?? 0) / tmj.tilewidth),
                y: Math.floor((object.y ?? 0) / tmj.tileheight),
            };
            const rectTiles = {
                width: Math.max(1, Math.ceil((object.width ?? 0) / tmj.tilewidth)),
                height: Math.max(1, Math.ceil((object.height ?? 0) / tmj.tileheight)),
            };
            const maxX = tile.x + rectTiles.width - 1;
            const maxY = tile.y + rectTiles.height - 1;
            const dx =
                renderTile.x < tile.x
                    ? tile.x - renderTile.x
                    : renderTile.x > maxX
                      ? renderTile.x - maxX
                      : 0;
            const dy =
                renderTile.y < tile.y
                    ? tile.y - renderTile.y
                    : renderTile.y > maxY
                      ? renderTile.y - maxY
                      : 0;

            objects.push({
                layer: layer.name,
                name: object.name ?? "(unnamed)",
                type: object.type ?? "(untyped)",
                tile,
                rectTiles,
                distanceTiles: Math.max(dx, dy),
            });
        }
    }
    return objects
        .sort((a, b) => a.distanceTiles - b.distanceTiles || a.name.localeCompare(b.name))
        .slice(0, 10);
}

function screenshotDiagnostics(path: string) {
    const png = PNG.sync.read(readFileSync(path));
    const sampledColors = new Set<string>();
    let opaquePixels = 0;
    let transparentPixels = 0;
    let darkPixels = 0;
    const stride = Math.max(1, Math.floor((png.width * png.height) / 12_000));
    for (let pixel = 0; pixel < png.width * png.height; pixel += stride) {
        const index = pixel * 4;
        const r = png.data[index];
        const g = png.data[index + 1];
        const b = png.data[index + 2];
        const a = png.data[index + 3];
        if (a === 0) {
            transparentPixels += 1;
            continue;
        }
        opaquePixels += 1;
        if ((r + g + b) / 3 < 24) darkPixels += 1;
        sampledColors.add(`${r >> 4},${g >> 4},${b >> 4},${a >> 4}`);
    }
    const sampledPixels = opaquePixels + transparentPixels;
    const visibleComponents = largestVisibleComponents(png);
    return {
        path,
        width: png.width,
        height: png.height,
        sampledPixels,
        sampledColorBuckets: sampledColors.size,
        darkPixelRatio: sampledPixels > 0 ? darkPixels / sampledPixels : 1,
        transparentPixelRatio: sampledPixels > 0 ? transparentPixels / sampledPixels : 1,
        largestVisibleComponents: visibleComponents,
        largestVisibleComponent: visibleComponents[0] ?? null,
    };
}

function largestVisibleComponents(png: PNG): ScreenshotComponent[] {
    const step = 2;
    const gridWidth = Math.ceil(png.width / step);
    const gridHeight = Math.ceil(png.height / step);
    const visible = new Uint8Array(gridWidth * gridHeight);
    const visited = new Uint8Array(gridWidth * gridHeight);

    for (let gy = 0; gy < gridHeight; gy += 1) {
        for (let gx = 0; gx < gridWidth; gx += 1) {
            const x = Math.min(png.width - 1, gx * step);
            const y = Math.min(png.height - 1, gy * step);
            const index = (y * png.width + x) * 4;
            const r = png.data[index];
            const g = png.data[index + 1];
            const b = png.data[index + 2];
            const a = png.data[index + 3];
            if (a > 0 && (r + g + b) / 3 >= 24) {
                visible[gy * gridWidth + gx] = 1;
            }
        }
    }

    const components: ScreenshotComponent[] = [];
    const queue: number[] = [];
    for (let index = 0; index < visible.length; index += 1) {
        if (!visible[index] || visited[index]) continue;
        visited[index] = 1;
        queue.length = 0;
        queue.push(index);
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = 0;
        let maxY = 0;
        let sampledPixelCount = 0;

        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const current = queue[cursor];
            const gx = current % gridWidth;
            const gy = Math.floor(current / gridWidth);
            sampledPixelCount += 1;
            minX = Math.min(minX, gx);
            minY = Math.min(minY, gy);
            maxX = Math.max(maxX, gx);
            maxY = Math.max(maxY, gy);

            const neighbors = [
                gx > 0 ? current - 1 : -1,
                gx < gridWidth - 1 ? current + 1 : -1,
                gy > 0 ? current - gridWidth : -1,
                gy < gridHeight - 1 ? current + gridWidth : -1,
            ];
            for (const neighbor of neighbors) {
                if (neighbor < 0 || !visible[neighbor] || visited[neighbor]) continue;
                visited[neighbor] = 1;
                queue.push(neighbor);
            }
        }

        const x = minX * step;
        const y = minY * step;
        const width = Math.min(png.width - x, (maxX - minX + 1) * step);
        const height = Math.min(png.height - y, (maxY - minY + 1) * step);
        components.push({
            x,
            y,
            width,
            height,
            sampledPixelCount,
            viewportCoverageRatio: (sampledPixelCount * step * step) / (png.width * png.height),
        });
    }

    return components.sort((a, b) => b.sampledPixelCount - a.sampledPixelCount).slice(0, 5);
}

function buildPresentationDiagnostics(
    screenshot: ReturnType<typeof screenshotDiagnostics>,
    runtime: RuntimeDiagnostics,
    staticMap: StaticMapDiagnostics | null,
): PresentationDiagnostics {
    const dimensions = staticMap?.tmj?.dimensions;
    const authoredMapPixels = dimensions
        ? {
              width: dimensions.width * dimensions.tilewidth,
              height: dimensions.height * dimensions.tileheight,
          }
        : (runtime.runtimeTile?.mapPixels ?? null);
    const largestVisibleComponent = screenshot.largestVisibleComponent;
    const runtimeCameraScale = runtime.camera?.scale
        ? Math.min(runtime.camera.scale.x, runtime.camera.scale.y)
        : null;

    if (
        !authoredMapPixels ||
        (!largestVisibleComponent && runtimeCameraScale == null) ||
        !dimensions
    ) {
        return {
            authoredMapPixels,
            targetTileScreenSizePx: visualsConfig.map_viewport.min_tile_screen_px,
            largestVisibleComponent,
            estimatedRenderScale: null,
            estimatedTileScreenSizePx: null,
            estimatedMapViewportCoverageRatio: null,
            note: "Presentation estimate unavailable without a static TMJ map and visible rendered component.",
        };
    }

    const componentRenderScale = largestVisibleComponent
        ? Math.min(
              largestVisibleComponent.width / authoredMapPixels.width,
              largestVisibleComponent.height / authoredMapPixels.height,
          )
        : null;
    const estimatedRenderScale = roundMetric(runtimeCameraScale ?? componentRenderScale ?? 1);
    const estimatedTileScreenSizePx = roundMetric(dimensions.tilewidth * estimatedRenderScale);
    const estimatedMapViewportCoverageRatio = roundMetric(
        Math.min(
            1,
            (authoredMapPixels.width *
                estimatedRenderScale *
                (authoredMapPixels.height * estimatedRenderScale)) /
                (screenshot.width * screenshot.height),
        ),
    );

    return {
        authoredMapPixels,
        targetTileScreenSizePx: visualsConfig.map_viewport.min_tile_screen_px,
        largestVisibleComponent,
        estimatedRenderScale,
        estimatedTileScreenSizePx,
        estimatedMapViewportCoverageRatio,
        note: "Scale uses the runtime viewport camera when available; the largest non-dark connected component is retained as a crop/matte clue for map-entry presentation review.",
    };
}

function buildAutomatedFindings(
    options: GoldenPathCheckpointOptions,
    screenshot: ReturnType<typeof screenshotDiagnostics>,
    runtime: RuntimeDiagnostics,
    staticMap: StaticMapDiagnostics | null,
    presentation: PresentationDiagnostics,
): DiagnosticFinding[] {
    const findings: DiagnosticFinding[] = [];
    const add = (severity: DiagnosticFinding["severity"], check: string, message: string) =>
        findings.push({ severity, check, message });
    const mapPresentationCheckpoint = isMapPresentationCheckpoint(runtime);

    if (screenshot.width < 320 || screenshot.height < 240) {
        add(
            "error",
            "screenshot-size",
            `Screenshot is too small: ${screenshot.width}x${screenshot.height}`,
        );
    }
    if (screenshot.sampledColorBuckets < 16) {
        add("error", "blank-or-flat-render", "Screenshot has too few sampled color buckets.");
    }
    if (!runtime.canvas.present || !runtime.canvas.visible) {
        add("error", "canvas-visible", "The RPG canvas is not present and visible.");
    }
    if (screenshot.darkPixelRatio > 0.85) {
        add(
            "warn",
            "dark-matte",
            `Screenshot is ${(screenshot.darkPixelRatio * 100).toFixed(1)}% dark pixels; likely excessive black stage/matte around the playable area.`,
        );
    }
    if (
        !options.allowMapMismatch &&
        runtime.state.currentMapId &&
        runtime.state.serverMapId &&
        runtime.state.currentMapId !== runtime.state.serverMapId
    ) {
        add(
            "error",
            "client-server-map-sync",
            `Client map ${runtime.state.currentMapId} does not match server map ${runtime.state.serverMapId}.`,
        );
    }
    if (options.expectedMapId && runtime.state.serverMapId !== options.expectedMapId) {
        add(
            "error",
            "expected-map",
            `Expected ${options.expectedMapId}, got ${runtime.state.serverMapId}.`,
        );
    }
    for (const testId of options.expectedVisibleTestIds ?? []) {
        if (!runtime.ui.visibleTestIds.includes(testId)) {
            add(
                "error",
                "expected-visible-ui",
                `Expected [data-testid="${testId}"] to be visible.`,
            );
        }
    }
    for (const testId of options.expectedHiddenTestIds ?? []) {
        if (runtime.ui.visibleTestIds.includes(testId)) {
            add("error", "expected-hidden-ui", `Expected [data-testid="${testId}"] to be hidden.`);
        }
    }
    if (runtime.runtimeTile?.movementTile) {
        const { movementTile, movementGrid, currentTileCollision } = runtime.runtimeTile;
        if (
            movementTile.x < 0 ||
            movementTile.y < 0 ||
            movementTile.x >= movementGrid.width ||
            movementTile.y >= movementGrid.height
        ) {
            add(
                "error",
                "player-bounds",
                `Player movement tile ${movementTile.x},${movementTile.y} is outside ${movementGrid.width}x${movementGrid.height}.`,
            );
        }
        if (currentTileCollision === true) {
            add(
                "error",
                "player-collision",
                `Player movement tile ${movementTile.x},${movementTile.y} has collision.`,
            );
        }
    } else {
        add("warn", "runtime-tile", "Runtime tiled map or player position was unavailable.");
    }
    if (staticMap?.config && staticMap.tmj) {
        if (staticMap.config.biome !== staticMap.tmj.properties.biome) {
            add(
                "error",
                "map-biome",
                `maps.json biome ${staticMap.config.biome} does not match TMJ biome ${String(
                    staticMap.tmj.properties.biome,
                )}.`,
            );
        }
        if (staticMap.config.music_track !== staticMap.tmj.properties.music_track) {
            add(
                "error",
                "map-music",
                `maps.json music ${staticMap.config.music_track} does not match TMJ music ${String(
                    staticMap.tmj.properties.music_track,
                )}.`,
            );
        }
        if (staticMap.tmj.tilesets.length === 0) {
            add("error", "map-tilesets", "TMJ map has no tilesets.");
        }
        const unknownFamilies = staticMap.tmj.tilesetFamilies.filter(
            (family) => !ALLOWED_TILESET_FAMILIES.has(family),
        );
        if (unknownFamilies.length) {
            add(
                "error",
                "tileset-family",
                `TMJ references non-allowlisted tileset families: ${unknownFamilies.join(", ")}.`,
            );
        }
    }
    if (
        mapPresentationCheckpoint &&
        presentation.estimatedTileScreenSizePx != null &&
        presentation.estimatedTileScreenSizePx < presentation.targetTileScreenSizePx - 1
    ) {
        add(
            "warn",
            "tile-screen-scale",
            `Tiles appear about ${presentation.estimatedTileScreenSizePx}px on screen; target is at least ${presentation.targetTileScreenSizePx}px for readable 16-bit RPG presentation.`,
        );
    }
    if (
        mapPresentationCheckpoint &&
        presentation.estimatedMapViewportCoverageRatio != null &&
        presentation.estimatedMapViewportCoverageRatio < 0.2
    ) {
        add(
            "warn",
            "map-viewport-coverage",
            `Authored map appears to cover only ${(presentation.estimatedMapViewportCoverageRatio * 100).toFixed(1)}% of the viewport.`,
        );
    }
    if (mapPresentationCheckpoint && staticMap?.tmj?.nearbyObjects.length) {
        const overlappingObjects = staticMap.tmj.nearbyObjects.filter(
            (object) => object.distanceTiles === 0 && object.type !== "SpawnPoint",
        );
        if (overlappingObjects.length) {
            add(
                "warn",
                "player-object-overlap",
                `Player render tile overlaps authored object(s): ${overlappingObjects
                    .map((object) => `${object.name}/${object.type}`)
                    .join(", ")}.`,
            );
        }
    }
    if (findings.length === 0) {
        add("info", "automated-checks", "No automated diagnostic failures at this checkpoint.");
    }
    return findings;
}

function isMapPresentationCheckpoint(runtime: RuntimeDiagnostics): boolean {
    if (!runtime.state.currentMapId) return false;
    if (runtime.ui.titleText || runtime.ui.dialogText) return false;
    const blockingIds = new Set(["warp-loading", "wild-battle", "lead-movebar", "pause-overlay"]);
    return !runtime.ui.visibleTestIds.some((testId) => blockingIds.has(testId));
}

function renderMarkdownChecklist(diagnostic: {
    id: string;
    title: string;
    focus: string[];
    presentation: PresentationDiagnostics;
    runtime: RuntimeDiagnostics;
    staticMap: StaticMapDiagnostics | null;
    automatedFindings: DiagnosticFinding[];
    reviewChecklist: typeof REVIEW_CHECKLIST;
}): string {
    const lines = [
        `# ${diagnostic.id}: ${diagnostic.title}`,
        "",
        "## Focus",
        ...diagnostic.focus.map((item) => `- ${item}`),
        "",
        "## Automated Findings",
        ...diagnostic.automatedFindings.map(
            (finding) => `- ${finding.severity.toUpperCase()} ${finding.check}: ${finding.message}`,
        ),
        "",
        "## Presentation Metrics",
        `- Authored map pixels: ${formatSize(diagnostic.presentation.authoredMapPixels)}`,
        `- Target tile size on screen: ${diagnostic.presentation.targetTileScreenSizePx} px`,
        `- Largest visible component: ${formatComponent(diagnostic.presentation.largestVisibleComponent)}`,
        `- Estimated render scale: ${formatMetric(diagnostic.presentation.estimatedRenderScale)}x`,
        `- Estimated tile size on screen: ${formatMetric(
            diagnostic.presentation.estimatedTileScreenSizePx,
        )} px`,
        `- Runtime camera scale: ${formatCameraScale(diagnostic.runtime.camera)}`,
        `- Estimated map viewport coverage: ${formatPercent(
            diagnostic.presentation.estimatedMapViewportCoverageRatio,
        )}`,
        `- Note: ${diagnostic.presentation.note}`,
        "",
        "## Runtime Snapshot",
        `- Map: client=${diagnostic.runtime.state.currentMapId ?? "null"} server=${
            diagnostic.runtime.state.serverMapId ?? "null"
        }`,
        `- Beat: ${diagnostic.runtime.state.journeyBeat ?? "null"}`,
        `- Graphic: ${diagnostic.runtime.state.serverGraphic ?? "null"}`,
        `- Position: client=${formatPoint(diagnostic.runtime.state.position)} server=${formatPoint(
            diagnostic.runtime.state.serverPosition,
        )}`,
        `- Render tile: ${formatPoint(diagnostic.runtime.runtimeTile?.renderTile ?? null)}`,
        `- Movement tile: ${formatPoint(diagnostic.runtime.runtimeTile?.movementTile ?? null)}`,
        `- Current tile collision: ${String(diagnostic.runtime.runtimeTile?.currentTileCollision ?? "unknown")}`,
        `- Visible UI: ${
            diagnostic.runtime.ui.visibleTestIds.length
                ? diagnostic.runtime.ui.visibleTestIds.join(", ")
                : "none"
        }`,
        `- Dialog: ${diagnostic.runtime.ui.dialogText ?? "none"}`,
        "",
        "## Static Map Snapshot",
        `- Label: ${diagnostic.staticMap?.config?.label ?? "unknown"}`,
        `- Biome: config=${diagnostic.staticMap?.config?.biome ?? "unknown"} tmj=${String(
            diagnostic.staticMap?.tmj?.properties.biome ?? "unknown",
        )}`,
        `- Music: config=${diagnostic.staticMap?.config?.music_track ?? "unknown"} tmj=${String(
            diagnostic.staticMap?.tmj?.properties.music_track ?? "unknown",
        )}`,
        `- Tileset families: ${diagnostic.staticMap?.tmj?.tilesetFamilies.join(", ") || "unknown"}`,
        `- Tilesets: ${diagnostic.staticMap?.tmj?.tilesets.map((tileset) => tileset.source).join(", ") ?? "unknown"}`,
        "",
        "## Nearby Objects",
        ...renderNearbyObjects(diagnostic.staticMap),
        "",
        "## Tile Context Around Player",
        ...renderTileContext(diagnostic.staticMap),
        "",
        "## Manual Visual Review Checklist",
        ...diagnostic.reviewChecklist.flatMap((section) => [
            `### ${section.category}`,
            ...section.items.map((item) => `- [ ] ${item}`),
        ]),
        "",
    ];
    return `${lines.join("\n")}\n`;
}

function renderNearbyObjects(staticMap: StaticMapDiagnostics | null): string[] {
    const objects = staticMap?.tmj?.nearbyObjects ?? [];
    if (!objects.length) return ["- No nearby authored objects available."];
    return objects.map(
        (object) =>
            `- ${object.name} (${object.type}) on ${object.layer}: tile=${object.tile.x},${object.tile.y} ` +
            `size=${object.rectTiles.width}x${object.rectTiles.height} distance=${object.distanceTiles}`,
    );
}

function renderTileContext(staticMap: StaticMapDiagnostics | null): string[] {
    if (!staticMap?.tmj?.tileContext.length) return ["- No tile context available."];
    return staticMap.tmj.tileContext.flatMap((context) => [
        `- ${context.layer}: center=${formatTileCell(context.center)}`,
        "```text",
        ...context.matrix3x3.map((row) => row.map(formatTileCell).join(" | ")),
        "```",
    ]);
}

function formatTileCell(cell: StaticTileCell): string {
    if (cell.gid == null) return `(${cell.x},${cell.y}) .`;
    if (cell.gid === 0) return `(${cell.x},${cell.y}) empty`;
    return `(${cell.x},${cell.y}) ${cell.label} gid=${cell.gid}`;
}

function formatSize(size: { width: number; height: number } | null): string {
    return size ? `${Math.round(size.width)}x${Math.round(size.height)}` : "unknown";
}

function formatComponent(component: ScreenshotComponent | null): string {
    if (!component) return "unknown";
    return `${component.width}x${component.height} at ${component.x},${component.y} (${formatPercent(
        component.viewportCoverageRatio,
    )})`;
}

function formatMetric(value: number | null): string {
    return value == null ? "unknown" : String(value);
}

function formatCameraScale(camera: RuntimeDiagnostics["camera"]): string {
    if (!camera?.scale) return "unknown";
    return `${roundMetric(camera.scale.x)}x${roundMetric(camera.scale.y)}`;
}

function formatPercent(value: number | null): string {
    return value == null ? "unknown" : `${(value * 100).toFixed(1)}%`;
}

function formatPoint(point: { x: number | null; y: number | null } | null): string {
    if (!point || typeof point.x !== "number" || typeof point.y !== "number") return "null";
    return `${Math.round(point.x)},${Math.round(point.y)}`;
}

function roundMetric(value: number): number {
    return Math.round(value * 100) / 100;
}
