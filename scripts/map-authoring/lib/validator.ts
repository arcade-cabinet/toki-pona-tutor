/**
 * Spec validator.
 *
 * Runs before emit. Catches author-side errors: bad palette refs,
 * grid dimension mismatches, missing SpawnPoint, duplicate object names,
 * encounter species not known to the content pipeline.
 *
 * See docs/build-time/MAP_AUTHORING.md § "The validator".
 */
import { isMapBiome, isMapMusicTrack } from "../../../src/content/map-metadata";
import type {
    MapSpec,
    PaletteEntry,
    ParsedTileset,
    ValidationIssue,
    ValidationReport,
    TileGrid,
    PlacedTile,
    ObjectMarker,
} from "./types";
import { hasLocalTileId, tsxQualifiedKey, tsxStem } from "./palette";
import {
    classifyPaletteEntry,
    isActorSurface,
    isEncounterSurface,
    tilesetForPaletteEntry,
} from "./semantics";

/**
 * A lookup function that returns a species record (or null) for a given id.
 * The toolchain doesn't import the content pipeline directly — callers inject
 * this so validator stays decoupled from the game's content loader.
 */
export type SpeciesLookup = (id: string) => unknown | null;

export async function validateSpec(
    spec: MapSpec,
    tilesets: ParsedTileset[],
    speciesLookup: SpeciesLookup,
): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];

    if (!isMapBiome(spec.biome)) {
        issues.push({
            severity: "error",
            code: "invalid_biome",
            message: `spec.biome "${String(spec.biome)}" is not a supported map biome`,
        });
    }
    if (!isMapMusicTrack(spec.music_track)) {
        issues.push({
            severity: "error",
            code: "invalid_music_track",
            message: `spec.music_track "${String(spec.music_track)}" is not a supported ambient BGM track`,
        });
    }

    // Index available tilesets under both their bare stem and their
    // pack-qualified key so palette entries using either form resolve.
    const tsByKey = new Map<string, ParsedTileset>();
    for (const t of tilesets) {
        tsByKey.set(tsxQualifiedKey(t), t);
        if (!tsByKey.has(tsxStem(t))) tsByKey.set(tsxStem(t), t);
    }

    // Every tileset the spec declares must be loaded.
    for (const name of spec.tilesets) {
        if (!tsByKey.has(name)) {
            issues.push({
                severity: "error",
                code: "tileset_not_loaded",
                message: `tileset "${name}" declared in spec.tilesets but not loaded`,
            });
        }
    }

    // Collect palette names actually USED by any layer. Unused palette entries
    // can legitimately reference tilesets the map doesn't declare (a shared
    // palette file covers many maps); only used entries need to be checked.
    const usedPaletteNames = collectUsedPaletteNames(spec);

    // Check palette references: each USED entry must point at a declared tileset
    // with an in-range local_id.
    for (const name of usedPaletteNames) {
        const entry = spec.palette[name];
        if (!entry) continue; // palette_unknown already reported per cell
        if (!spec.tilesets.includes(entry.tsx)) {
            issues.push({
                severity: "error",
                code: "palette_tileset_not_declared",
                message: `palette entry "${name}" (used by map) references tileset "${entry.tsx}" but it is not in spec.tilesets`,
            });
            continue;
        }
        const ts = tsByKey.get(entry.tsx);
        if (!ts) continue; // already reported as tileset_not_loaded
        if (!hasLocalTileId(ts, entry.local_id)) {
            issues.push({
                severity: "error",
                code: "palette_local_id_oor",
                message: `palette entry "${name}" has local_id ${entry.local_id} out of range for tileset "${entry.tsx}"`,
            });
        }
    }

    // Check each layer.
    const belowGrid = spec.layers["Below Player"];
    if (!isTileGrid(belowGrid)) {
        issues.push({
            severity: "error",
            code: "below_not_grid",
            message: `"Below Player" layer must be a paint grid (got a PlacedTile list)`,
        });
    } else {
        checkGridDims(belowGrid, spec, "Below Player", issues);
        checkGridPalette(belowGrid, spec, "Below Player", issues);
    }
    for (const layerName of ["World", "Above Player"] as const) {
        const content = spec.layers[layerName];
        if (!content) continue;
        if (isTileGrid(content)) {
            checkGridDims(content, spec, layerName, issues);
            checkGridPalette(content, spec, layerName, issues);
        } else {
            checkPlacedTiles(content, spec, layerName, issues);
        }
    }

    // Objects: at least one SpawnPoint, unique names.
    const objects = spec.layers.Objects ?? [];
    const spawnPoints = objects.filter((o) => o.type === "SpawnPoint");
    if (spawnPoints.length === 0) {
        issues.push({
            severity: "error",
            code: "no_spawnpoint",
            message: `no SpawnPoint found — every map must have at least one`,
        });
    }
    const seenNames = new Set<string>();
    for (const o of objects) {
        if (seenNames.has(o.name)) {
            issues.push({
                severity: "error",
                code: "duplicate_object_name",
                message: `duplicate object name "${o.name}" in map "${spec.id}"`,
                at: { name: o.name },
            });
        }
        seenNames.add(o.name);
        checkObjectBounds(o, spec, issues);
    }

    checkGameplaySurfacePlacement(spec, tilesets, issues);

    // Encounters: each species id must resolve via the provided lookup.
    for (const zone of spec.layers.Encounters ?? []) {
        for (const id of Object.keys(zone.species)) {
            if (speciesLookup(id) == null) {
                issues.push({
                    severity: "error",
                    code: "unknown_species",
                    message: `encounter references unknown species "${id}"`,
                });
            }
        }
        if (zone.levelRange[0] > zone.levelRange[1]) {
            issues.push({
                severity: "error",
                code: "bad_level_range",
                message: `encounter levelRange min (${zone.levelRange[0]}) > max (${zone.levelRange[1]})`,
            });
        }
    }

    return {
        mapId: spec.id,
        issues,
        ok: !issues.some((i) => i.severity === "error"),
    };
}

interface CellBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

interface PaletteCell {
    name: string;
    entry: PaletteEntry;
    tileset: ParsedTileset | undefined;
}

interface ObstructionFootprint {
    layer: "World" | "Above Player";
    tileName: string;
    at: [number, number];
    collisionBounds: CellBounds[];
    visualBounds: CellBounds | null;
}

function checkGameplaySurfacePlacement(
    spec: MapSpec,
    tilesets: ParsedTileset[],
    issues: ValidationIssue[],
): void {
    if (!isTileGrid(spec.layers["Below Player"])) return;

    const obstructions = collectObstructionFootprints(spec, tilesets);
    for (const object of spec.layers.Objects ?? []) {
        if (!("at" in object)) continue;
        if (!["SpawnPoint", "NPC", "Sign"].includes(object.type)) continue;

        const [x, y] = object.at;
        if (!inBounds(x, y, spec)) continue;
        const below = paletteCellAt(spec, tilesets, "Below Player", x, y);
        if (below) {
            const semantic = classifyPaletteEntry(below.name, below.entry, below.tileset);
            if (!isActorSurface(semantic)) {
                issues.push({
                    severity: "error",
                    code: "actor_on_bad_surface",
                    message:
                        `object "${object.name}" (${object.type}) at (${x}, ${y}) sits on "${below.name}" ` +
                        `(${semantic.surface}/${semantic.role}); actors must stand on walkable non-encounter ground`,
                    at: { x, y, name: object.name },
                });
            }
        }

        for (const obstruction of obstructions) {
            if (obstruction.collisionBounds.some((bounds) => boundsContainsCell(bounds, x, y))) {
                issues.push({
                    severity: "error",
                    code: "actor_on_blocking_footprint",
                    message:
                        `object "${object.name}" (${object.type}) at (${x}, ${y}) overlaps ` +
                        `"${obstruction.tileName}" collision footprint from ${obstruction.layer} at ` +
                        `(${obstruction.at[0]}, ${obstruction.at[1]})`,
                    at: { x, y, layer: obstruction.layer, name: object.name },
                });
            } else if (
                obstruction.visualBounds &&
                boundsContainsCell(obstruction.visualBounds, x, y)
            ) {
                issues.push({
                    severity: "error",
                    code: "actor_under_visual_obstruction",
                    message:
                        `object "${object.name}" (${object.type}) at (${x}, ${y}) is visually covered by ` +
                        `"${obstruction.tileName}" from ${obstruction.layer} at ` +
                        `(${obstruction.at[0]}, ${obstruction.at[1]})`,
                    at: { x, y, layer: obstruction.layer, name: object.name },
                });
            }
        }
    }

    for (const zone of spec.layers.Encounters ?? []) {
        const [x0, y0, width, height] = zone.rect;
        for (let y = y0; y < y0 + height; y++) {
            for (let x = x0; x < x0 + width; x++) {
                if (!inBounds(x, y, spec)) continue;
                const below = paletteCellAt(spec, tilesets, "Below Player", x, y);
                if (below) {
                    const semantic = classifyPaletteEntry(below.name, below.entry, below.tileset);
                    if (!isEncounterSurface(semantic)) {
                        issues.push({
                            severity: "error",
                            code: "encounter_on_bad_surface",
                            message:
                                `encounter cell (${x}, ${y}) sits on "${below.name}" ` +
                                `(${semantic.surface}/${semantic.role}); encounter zones must be painted with rough grass`,
                            at: { x, y, layer: "Encounters" },
                        });
                    }
                }

                for (const obstruction of obstructions) {
                    if (
                        obstruction.collisionBounds.some((bounds) =>
                            boundsContainsCell(bounds, x, y),
                        ) ||
                        (obstruction.visualBounds &&
                            boundsContainsCell(obstruction.visualBounds, x, y))
                    ) {
                        issues.push({
                            severity: "error",
                            code: "encounter_under_visual_obstruction",
                            message:
                                `encounter cell (${x}, ${y}) overlaps "${obstruction.tileName}" ` +
                                `from ${obstruction.layer} at (${obstruction.at[0]}, ${obstruction.at[1]})`,
                            at: { x, y, layer: "Encounters" },
                        });
                    }
                }
            }
        }
    }
}

function isTileGrid(x: TileGrid | PlacedTile[] | undefined): x is TileGrid {
    if (!Array.isArray(x) || x.length === 0) return false;
    return Array.isArray(x[0]);
}

function inBounds(x: number, y: number, spec: MapSpec): boolean {
    return x >= 0 && x < spec.width && y >= 0 && y < spec.height;
}

function paletteCellAt(
    spec: MapSpec,
    tilesets: ParsedTileset[],
    layerName: "Below Player" | "World" | "Above Player",
    x: number,
    y: number,
): PaletteCell | null {
    const layer = spec.layers[layerName];
    if (!isTileGrid(layer)) return null;
    const name = layer[y]?.[x];
    if (!name || name === ".") return null;
    const entry = spec.palette[name];
    if (!entry) return null;
    return {
        name,
        entry,
        tileset: tilesetForPaletteEntry(entry, tilesets),
    };
}

function collectObstructionFootprints(
    spec: MapSpec,
    tilesets: ParsedTileset[],
): ObstructionFootprint[] {
    const footprints: ObstructionFootprint[] = [];
    for (const layerName of ["World", "Above Player"] as const) {
        forEachTileOnLayer(spec, layerName, (tileName, at) => {
            const entry = spec.palette[tileName];
            if (!entry) return;
            const tileset = tilesetForPaletteEntry(entry, tilesets);
            if (!tileset) return;
            const semantic = classifyPaletteEntry(tileName, entry, tileset);
            const collisionBounds = collisionBoundsForTile(spec, at, entry, tileset);
            const visualBounds = visualBoundsForTile(spec, at, entry, tileset);
            if (
                collisionBounds.length === 0 &&
                (!visualBounds || (semantic.walkable && semantic.role !== "decoration"))
            ) {
                return;
            }
            footprints.push({
                layer: layerName,
                tileName,
                at,
                collisionBounds,
                visualBounds:
                    semantic.role === "decoration" || semantic.role === "blocker"
                        ? visualBounds
                        : null,
            });
        });
    }
    return footprints;
}

function forEachTileOnLayer(
    spec: MapSpec,
    layerName: "World" | "Above Player",
    callback: (tileName: string, at: [number, number]) => void,
): void {
    const layer = spec.layers[layerName];
    if (!layer) return;
    if (isTileGrid(layer)) {
        for (let y = 0; y < layer.length; y++) {
            for (let x = 0; x < layer[y].length; x++) {
                const tileName = layer[y][x];
                if (tileName && tileName !== ".") callback(tileName, [x, y]);
            }
        }
        return;
    }
    for (const placed of layer) {
        callback(placed.tile, placed.at);
    }
}

function collisionBoundsForTile(
    spec: MapSpec,
    at: [number, number],
    entry: PaletteEntry,
    tileset: ParsedTileset,
): CellBounds[] {
    const semantic = classifyPaletteEntry("", entry, tileset);
    if (!semantic.collides) return [];

    const objects = tileset.objectGroups[entry.local_id] ?? [];
    if (objects.length === 0) {
        return [anchorBounds(spec, at, entry)];
    }

    const origin = tileImageOrigin(spec, at, entry, tileset);
    return objects
        .map((object) => {
            const localBounds =
                object.polygon && object.polygon.length > 0
                    ? polygonBounds(object.x, object.y, object.polygon)
                    : {
                          left: object.x,
                          top: object.y,
                          right: object.x + Math.max(object.width, 1),
                          bottom: object.y + Math.max(object.height, 1),
                      };
            return cellBoundsFromPixels(
                origin.left + localBounds.left,
                origin.top + localBounds.top,
                origin.left + localBounds.right,
                origin.top + localBounds.bottom,
                spec,
            );
        })
        .filter((bounds): bounds is CellBounds => bounds != null);
}

function visualBoundsForTile(
    spec: MapSpec,
    at: [number, number],
    entry: PaletteEntry,
    tileset: ParsedTileset,
): CellBounds | null {
    const image = tileset.perTileImages[entry.local_id];
    if (!image) return anchorBounds(spec, at, entry);
    const origin = tileImageOrigin(spec, at, entry, tileset);
    return cellBoundsFromPixels(
        origin.left,
        origin.top,
        origin.left + image.width,
        origin.top + image.height,
        spec,
    );
}

function anchorBounds(spec: MapSpec, at: [number, number], entry: PaletteEntry): CellBounds {
    const width = entry.multiTile?.w ?? 1;
    const height = entry.multiTile?.h ?? 1;
    return {
        minX: at[0],
        minY: at[1],
        maxX: Math.min(spec.width - 1, at[0] + width - 1),
        maxY: Math.min(spec.height - 1, at[1] + height - 1),
    };
}

function tileImageOrigin(
    spec: MapSpec,
    at: [number, number],
    entry: PaletteEntry,
    tileset: ParsedTileset,
): { left: number; top: number } {
    const image = tileset.perTileImages[entry.local_id];
    const left = at[0] * spec.tileSize;
    const top = image ? (at[1] + 1) * spec.tileSize - image.height : at[1] * spec.tileSize;
    return { left, top };
}

function polygonBounds(
    objectX: number,
    objectY: number,
    points: Array<{ x: number; y: number }>,
): { left: number; top: number; right: number; bottom: number } {
    const xs = points.map((point) => objectX + point.x);
    const ys = points.map((point) => objectY + point.y);
    return {
        left: Math.min(...xs),
        top: Math.min(...ys),
        right: Math.max(...xs),
        bottom: Math.max(...ys),
    };
}

function cellBoundsFromPixels(
    left: number,
    top: number,
    right: number,
    bottom: number,
    spec: MapSpec,
): CellBounds | null {
    if (right <= left || bottom <= top) return null;
    const epsilon = 0.001;
    const minX = Math.max(0, Math.floor(left / spec.tileSize));
    const minY = Math.max(0, Math.floor(top / spec.tileSize));
    const maxX = Math.min(spec.width - 1, Math.floor((right - epsilon) / spec.tileSize));
    const maxY = Math.min(spec.height - 1, Math.floor((bottom - epsilon) / spec.tileSize));
    if (maxX < 0 || maxY < 0 || minX >= spec.width || minY >= spec.height) return null;
    if (minX > maxX || minY > maxY) return null;
    return { minX, minY, maxX, maxY };
}

function boundsContainsCell(bounds: CellBounds, x: number, y: number): boolean {
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

function collectUsedPaletteNames(spec: MapSpec): Set<string> {
    const used = new Set<string>();
    for (const layerName of ["Below Player", "World", "Above Player"] as const) {
        const content = spec.layers[layerName];
        if (!content) continue;
        if (isTileGrid(content)) {
            for (const row of content) {
                for (const name of row) {
                    if (name && name !== ".") used.add(name);
                }
            }
        } else {
            for (const p of content) used.add(p.tile);
        }
    }
    return used;
}

function checkGridDims(
    grid: TileGrid,
    spec: MapSpec,
    layerName: string,
    issues: ValidationIssue[],
): void {
    if (grid.length !== spec.height) {
        issues.push({
            severity: "error",
            code: "grid_height_mismatch",
            message: `layer "${layerName}": grid has ${grid.length} rows but map height is ${spec.height}`,
        });
        return;
    }
    for (let y = 0; y < grid.length; y++) {
        if (grid[y].length !== spec.width) {
            issues.push({
                severity: "error",
                code: "grid_width_mismatch",
                message: `layer "${layerName}": row ${y} has ${grid[y].length} cells but map width is ${spec.width}`,
                at: { y, layer: layerName },
            });
        }
    }
}

function checkGridPalette(
    grid: TileGrid,
    spec: MapSpec,
    layerName: string,
    issues: ValidationIssue[],
): void {
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            const name = grid[y][x];
            if (!name || name === ".") continue;
            if (!(name in spec.palette)) {
                issues.push({
                    severity: "error",
                    code: "palette_unknown",
                    message: `layer "${layerName}": unknown palette name "${name}" at (${x}, ${y})`,
                    at: { x, y, layer: layerName },
                });
            }
        }
    }
}

function checkPlacedTiles(
    placed: PlacedTile[],
    spec: MapSpec,
    layerName: string,
    issues: ValidationIssue[],
): void {
    const used = new Map<string, number>();
    for (let i = 0; i < placed.length; i++) {
        const p = placed[i];
        const [x, y] = p.at;
        if (!(p.tile in spec.palette)) {
            issues.push({
                severity: "error",
                code: "palette_unknown",
                message: `layer "${layerName}": place[${i}] uses unknown palette name "${p.tile}"`,
                at: { x, y, layer: layerName },
            });
            continue;
        }
        if (x < 0 || x >= spec.width || y < 0 || y >= spec.height) {
            issues.push({
                severity: "error",
                code: "place_out_of_bounds",
                message: `layer "${layerName}": place[${i}] at (${x}, ${y}) is outside map bounds`,
                at: { x, y, layer: layerName },
            });
            continue;
        }
        const key = `${x},${y}`;
        if (used.has(key)) {
            issues.push({
                severity: "warning",
                code: "place_overdraw",
                message: `layer "${layerName}": place[${i}] at (${x}, ${y}) overdraws place[${used.get(key)}]`,
                at: { x, y, layer: layerName },
            });
        }
        used.set(key, i);
    }
}

function checkObjectBounds(obj: ObjectMarker, spec: MapSpec, issues: ValidationIssue[]): void {
    if ("rect" in obj) {
        const [x, y, w, h] = obj.rect;
        if (x < 0 || y < 0 || x + w > spec.width || y + h > spec.height || w <= 0 || h <= 0) {
            issues.push({
                severity: "error",
                code: "object_rect_out_of_bounds",
                message: `object "${obj.name}" rect [${x},${y},${w},${h}] is out of map bounds [${spec.width} x ${spec.height}]`,
                at: { name: obj.name },
            });
        }
    } else {
        const [x, y] = obj.at;
        if (x < 0 || x >= spec.width || y < 0 || y >= spec.height) {
            issues.push({
                severity: "error",
                code: "object_at_out_of_bounds",
                message: `object "${obj.name}" at (${x}, ${y}) is out of map bounds [${spec.width} x ${spec.height}]`,
                at: { name: obj.name },
            });
        }
    }
}
