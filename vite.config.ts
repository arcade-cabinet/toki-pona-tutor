import { defineConfig } from 'vite';
import { rpgjs, tiledMapFolderPlugin } from '@rpgjs/vite';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import serverConfig from './src/server';

const __dirname = dirname(fileURLToPath(import.meta.url));

// GitHub Pages deploys under /poki-soweli/; Capacitor (Android/iOS)
// serves from the app root. Match the grailguard pattern.
const base = process.env.CAPACITOR === 'true' ? '/' : '/poki-soweli/';

/**
 * Copy sql.js WASM (and its loader JS) into public/assets/ so jeep-sqlite
 * can fetch them at the wasmpath we set in prepareWebStore(). This runs at
 * dev-server start and at build time, keeping the public tree consistent.
 */
function copyWasmPlugin() {
  return {
    name: 'copy-wasm',
    buildStart() {
      const dest = resolve(__dirname, 'public/assets');
      mkdirSync(dest, { recursive: true });
      const sqlDist = resolve(__dirname, 'node_modules/sql.js/dist');
      copyFileSync(resolve(sqlDist, 'sql-wasm.wasm'), resolve(dest, 'sql-wasm.wasm'));
      copyFileSync(resolve(sqlDist, 'sql-wasm.js'), resolve(dest, 'sql-wasm.js'));
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    copyWasmPlugin(),
    tiledMapFolderPlugin({
      sourceFolder: './src/tiled',
      // Prefix with base so map requests resolve correctly when deployed under
      // a subpath (e.g. GitHub Pages). Without this, requests go to /map
      // instead of /poki-soweli/map.
      publicPath: `${base}map`,
      buildOutputPath: 'assets/data',
    }),
    ...rpgjs({
      server: serverConfig,
    }),
  ],
});
