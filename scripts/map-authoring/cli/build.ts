/**
 * pnpm author:build <map-id> — spec → .tmj + .tmx
 *
 * Reads scripts/map-authoring/specs/<map-id>.ts (default export: MapSpec),
 * loads every tileset it references, emits public/assets/maps/<map-id>.tmj
 * and src/tiled/<map-id>.tmx.
 */
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { emitTmj, emitTmx, loadTilesetsForSpec } from "../lib/index";
import { buildDerivedTilesets } from "../lib/derived-tilesets";
import { mergeDossierNpcsIntoSpec, mergeDossierSignsIntoSpec } from "../lib/dossier-merge";
import type { MapSpec } from "../lib/index";

const __dirname = dirname(fileURLToPath(import.meta.url));

function assertSafeMapId(id: string): void {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        console.error(
            `invalid map id "${id}" — only alphanumerics, underscore, and dash are allowed`,
        );
        process.exit(1);
    }
}

async function main(): Promise<void> {
    const [, , mapId] = process.argv;
    if (!mapId) {
        console.error("usage: pnpm author:build <map-id>");
        process.exit(1);
    }
    assertSafeMapId(mapId);

    const worktreeRoot = resolve(__dirname, "..", "..", "..");
    await buildDerivedTilesets(worktreeRoot);
    const specPath = join(worktreeRoot, "scripts", "map-authoring", "specs", `${mapId}.ts`);
    // ESM dynamic import requires a file:// URL on Windows (filesystem paths
    // with backslashes fail with ERR_UNSUPPORTED_ESM_URL_SCHEME).
    const mod = (await import(pathToFileURL(specPath).href)) as { default?: MapSpec };
    if (mod.default && mod.default.id !== mapId) {
        console.error(
            `spec.id "${mod.default.id}" does not match requested id "${mapId}" — they must match so artifacts write to the right filename`,
        );
        process.exit(1);
    }
    const specRaw = mod.default;
    if (!specRaw) {
        console.error(`spec "${specPath}" has no default export`);
        process.exit(1);
    }

    // Merge region-dossier NPC appearances + signs into the spec's Objects
    // layer before emission. Hand-authored markers win on collision; dossier
    // markers fill in the rest. See CONTENT_ARCHITECTURE.md for the dossier
    // layout.
    const spec = mergeDossierSignsIntoSpec(mergeDossierNpcsIntoSpec(specRaw));

    const tilesets = await loadTilesetsForSpec(spec, worktreeRoot);

    // .tmj — human-readable JSON archive under public/assets/maps/
    const tmjDir = join(worktreeRoot, "public", "assets", "maps");
    await mkdir(tmjDir, { recursive: true });
    const tmjPath = join(tmjDir, `${spec.id}.tmj`);
    const tmj = emitTmj(spec, tilesets, tmjPath);
    await writeFile(tmjPath, JSON.stringify(tmj, null, 2) + "\n", "utf-8");

    // .tmx — consumed by RPG.js v5 tiledMapFolderPlugin at runtime.
    // Emit runtime URLs, not filesystem-relative paths. These .tmx files are
    // fetched over HTTP from `/map/*.tmx` in dev and production.
    const tmxDir = join(worktreeRoot, "src", "tiled");
    await mkdir(tmxDir, { recursive: true });
    const tmxPath = join(tmxDir, `${spec.id}.tmx`);
    const tmjForTmx = emitTmj(spec, tilesets, tmxPath, {
        tilesetSourceMode: "runtime",
    });
    await writeFile(tmxPath, emitTmx(tmjForTmx), "utf-8");

    console.log(`✓ built ${tmjPath}`);
    console.log(`✓ built ${tmxPath}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
