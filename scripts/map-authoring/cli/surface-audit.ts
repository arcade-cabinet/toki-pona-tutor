/**
 * pnpm author:audit-surfaces
 *
 * Prints a TSX-backed surface/transition audit:
 * - every shipped map's used palette entries classified by surface/role
 * - wangset bridge candidates from the vendor tilesets
 *
 * This is diagnostic output for map polishing. Validation remains in
 * validate.ts/all.ts; this command shows where richer biome transitions live.
 */
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
    classifyPaletteEntry,
    loadTilesetsForSpec,
    parseTsx,
    tilesetForPaletteEntry,
    tsxQualifiedKey,
    wangBridgeCandidatesForTileset,
    wangColorNamesForTile,
    type MapSpec,
    type PaletteEntry,
    type PlacedTile,
    type TileGrid,
} from "../lib/index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const worktreeRoot = resolve(__dirname, "..", "..", "..");
const specsDir = join(worktreeRoot, "scripts", "map-authoring", "specs");
const tilesetsRoot = join(worktreeRoot, "public", "assets", "tilesets");

async function main(): Promise<void> {
    await printMapSurfaceAudit();
    await printBridgeCandidateAudit();
}

async function printMapSurfaceAudit(): Promise<void> {
    const specs = (await readdir(specsDir)).filter((file) => file.endsWith(".ts")).sort();

    console.log("Map surface usage");
    console.log("=================");
    for (const file of specs) {
        const spec = await loadSpec(join(specsDir, file));
        const tilesets = await loadTilesetsForSpec(spec, worktreeRoot);
        const used = collectUsedPaletteNames(spec);
        const rows = [...used]
            .sort()
            .map((name) => {
                const entry = spec.palette[name];
                if (!entry) return null;
                const tileset = tilesetForPaletteEntry(entry, tilesets);
                const semantic = classifyPaletteEntry(name, entry, tileset);
                const wangColors = tileset ? wangColorNamesForTile(tileset, entry.local_id) : [];
                return {
                    name,
                    entry,
                    surface: semantic.surface,
                    role: semantic.role,
                    walkable: semantic.walkable,
                    collides: semantic.collides,
                    wangColors,
                };
            })
            .filter((row): row is NonNullable<typeof row> => row != null);

        const counts = new Map<string, number>();
        for (const row of rows) {
            const key = `${row.surface}/${row.role}`;
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }

        console.log(`\n${spec.id}`);
        console.log(
            `  surfaces: ${[...counts.entries()].map(([key, count]) => `${key}=${count}`).join(", ")}`,
        );
        for (const row of rows) {
            const flags = [
                row.walkable ? "walk" : "block",
                row.collides ? "tsx-collision" : "",
                row.wangColors.length > 0 ? `wang:${row.wangColors.join("+")}` : "",
            ]
                .filter(Boolean)
                .join(", ");
            console.log(
                `  ${row.name.padEnd(12)} ${row.surface.padEnd(13)} ${row.role.padEnd(10)} ` +
                    `${formatEntry(row.entry).padEnd(40)} ${flags}`,
            );
        }
    }
}

async function printBridgeCandidateAudit(): Promise<void> {
    const tsxPaths = await listTsxPaths();
    const rows: Array<{ key: string; groups: Map<string, number[]> }> = [];

    for (const path of tsxPaths) {
        const tileset = await parseTsx(path);
        const candidates = wangBridgeCandidatesForTileset(tileset);
        if (candidates.length === 0) continue;
        const groups = new Map<string, number[]>();
        for (const candidate of candidates) {
            const key = `${candidate.wangset}: ${candidate.colors.join(" + ")}`;
            const ids = groups.get(key) ?? [];
            if (ids.length < 8) ids.push(candidate.tileid);
            groups.set(key, ids);
        }
        rows.push({ key: tsxQualifiedKey(tileset), groups });
    }

    console.log("\nBridge-capable wang tiles");
    console.log("=========================");
    for (const row of rows.sort((a, b) => a.key.localeCompare(b.key))) {
        console.log(`\n${row.key}`);
        for (const [group, ids] of [...row.groups.entries()].sort((a, b) =>
            a[0].localeCompare(b[0]),
        )) {
            console.log(`  ${group} -> local_ids ${ids.join(", ")}`);
        }
    }
}

async function loadSpec(path: string): Promise<MapSpec> {
    const mod = (await import(pathToFileURL(path).href)) as { default?: MapSpec };
    if (!mod.default) {
        throw new Error(`spec "${path}" has no default export`);
    }
    return mod.default;
}

function collectUsedPaletteNames(spec: MapSpec): Set<string> {
    const used = new Set<string>();
    for (const layerName of ["Below Player", "World", "Above Player"] as const) {
        const layer = spec.layers[layerName];
        if (!layer) continue;
        if (isTileGrid(layer)) {
            for (const row of layer) {
                for (const name of row) {
                    if (name && name !== ".") used.add(name);
                }
            }
        } else {
            for (const placed of layer) used.add(placed.tile);
        }
    }
    return used;
}

function isTileGrid(layer: TileGrid | PlacedTile[] | undefined): layer is TileGrid {
    return Array.isArray(layer) && layer.length > 0 && Array.isArray(layer[0]);
}

async function listTsxPaths(): Promise<string[]> {
    if (!existsSync(tilesetsRoot)) return [];
    const packs = (await readdir(tilesetsRoot)).filter((name) => !name.startsWith(".")).sort();
    const paths: string[] = [];
    for (const pack of packs) {
        const dir = join(tilesetsRoot, pack, "Tiled", "Tilesets");
        if (!existsSync(dir)) continue;
        for (const file of (await readdir(dir)).filter((name) => name.endsWith(".tsx")).sort()) {
            paths.push(join(dir, file));
        }
    }
    return paths;
}

function formatEntry(entry: PaletteEntry): string {
    return `${entry.tsx}:${entry.local_id}`;
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
