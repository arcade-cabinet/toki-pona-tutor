/**
 * pnpm author:tilesets
 * Rebuilds project-owned composite tilesets derived from licensed source packs.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDerivedTilesets } from "../lib/derived-tilesets";

const __dirname = dirname(fileURLToPath(import.meta.url));
const worktreeRoot = resolve(__dirname, "..", "..", "..");

await buildDerivedTilesets(worktreeRoot);
console.log("✓ built generated map-authoring tilesets");
