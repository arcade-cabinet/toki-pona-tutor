import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { rpgjs, tiledMapFolderPlugin } from "@rpgjs/vite";
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import serverConfig from "./src/server";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Three deploy targets, three base paths. Capacitor bundles want relative
// URLs (`./assets/...`) so the WebView finds them regardless of how it
// resolves the shell; GitHub Pages serves under `/<repo>/` per-project;
// local dev is `/`. vite rewrites every public-tree `/assets/...` URL in
// CSS / HTML to `${base}/assets/...` at build time, so fonts + tilemap data
// resolve correctly in all three environments.
const resolveBase = () => {
    if (process.env.CAPACITOR === "true") return "./";
    if (process.env.GITHUB_PAGES === "true") return "/poki-soweli/";
    return "/";
};
const base = resolveBase();

function copySqlJsWasmAssets() {
    const dest = resolve(__dirname, "public/assets");
    mkdirSync(dest, { recursive: true });
    const jeepSqliteRoot = dirname(require.resolve("jeep-sqlite/package.json"));
    const sqlJsRoot = dirname(require.resolve("sql.js/package.json", { paths: [jeepSqliteRoot] }));
    const sqlDist = resolve(sqlJsRoot, "dist");
    copyFileSync(resolve(sqlDist, "sql-wasm.wasm"), resolve(dest, "sql-wasm.wasm"));
    copyFileSync(resolve(sqlDist, "sql-wasm.js"), resolve(dest, "sql-wasm.js"));
}

/**
 * Copy sql.js WASM (and its loader JS) into public/assets/ so jeep-sqlite
 * can fetch them at the wasmpath we set in prepareWebStore(). This runs at
 * dev-server start and at build time, keeping the public tree consistent.
 */
function copyWasmPlugin(): Plugin {
    return {
        name: "copy-wasm",
        configResolved() {
            copySqlJsWasmAssets();
        },
        configureServer() {
            copySqlJsWasmAssets();
        },
        buildStart() {
            copySqlJsWasmAssets();
        },
    };
}

export default defineConfig({
    base,
    resolve: {
        alias: {
            src: resolve(__dirname, "src"),
        },
    },
    plugins: [
        copyWasmPlugin(),
        tiledMapFolderPlugin({
            sourceFolder: "./src/tiled",
            // Prefix with base so map requests resolve correctly when deployed under
            // a subpath (e.g. GitHub Pages). Runtime .tmx files are emitted with
            // tileset sources relative to `/map/*.tmx`, so build output must also
            // land under `map/` rather than a separate data directory.
            publicPath: `${base}map`,
            buildOutputPath: "map",
        }),
        ...rpgjs({
            server: serverConfig,
        }),
    ],
});
