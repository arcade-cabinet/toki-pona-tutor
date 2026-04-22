#!/usr/bin/env node
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
} from "node:fs";
import { dirname, extname, join, normalize, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const publicRoot = resolve(repoRoot, "public");
const distRoot = resolve(repoRoot, "dist");
const tiledRoot = resolve(repoRoot, "src/tiled");

const tilesetSourcePattern = /<tileset\b[^>]*\bsource="([^"]+)"/g;
const imageSourcePattern = /<image\b[^>]*\bsource="([^"]+)"/g;

function posixPath(path) {
    return path.split(sep).join("/");
}

function listFiles(dir, extension) {
    if (!existsSync(dir)) return [];
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
            out.push(...listFiles(full, extension));
        } else if (extname(full) === extension) {
            out.push(full);
        }
    }
    return out;
}

function extractSources(xml, pattern) {
    const sources = [];
    for (const match of xml.matchAll(pattern)) {
        if (match[1]) sources.push(match[1]);
    }
    return sources;
}

function resolvePublicTilesetPath(source, publicDir) {
    const normalized = normalize(source);
    const publicRelative = normalized.startsWith(`..${sep}assets${sep}`)
        ? normalized.slice(3)
        : normalized.startsWith(`assets${sep}`)
          ? normalized
          : null;
    if (!publicRelative) {
        throw new Error(`[prune-deploy-assets] unsupported tileset source path: ${source}`);
    }
    return resolve(publicDir, publicRelative);
}

function copyPublicFile(sourcePath, copied, { publicDir, distDir }) {
    const publicRelative = relative(publicDir, sourcePath);
    if (publicRelative.startsWith("..")) {
        throw new Error(`[prune-deploy-assets] refusing to copy non-public file: ${sourcePath}`);
    }

    const dest = resolve(distDir, publicRelative);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(sourcePath, dest);
    copied.add(posixPath(publicRelative));
}

export function collectRuntimeTilesetAssets({ mapDir = tiledRoot, publicDir = publicRoot } = {}) {
    const assets = new Set();
    const tmxFiles = listFiles(mapDir, ".tmx");

    for (const mapPath of tmxFiles) {
        const mapXml = readFileSync(mapPath, "utf8");
        for (const source of extractSources(mapXml, tilesetSourcePattern)) {
            const tilesetPath = resolvePublicTilesetPath(source, publicDir);
            const tilesetRelative = posixPath(relative(publicDir, tilesetPath));
            assets.add(tilesetRelative);

            const tilesetXml = readFileSync(tilesetPath, "utf8");
            for (const imageSource of extractSources(tilesetXml, imageSourcePattern)) {
                const imagePath = resolve(dirname(tilesetPath), imageSource);
                assets.add(posixPath(relative(publicDir, imagePath)));
            }
        }
    }

    return [...assets].sort();
}

export function pruneDeployTilesets({
    distDir = distRoot,
    publicDir = publicRoot,
    mapDir = tiledRoot,
} = {}) {
    if (!existsSync(distDir)) {
        console.log("[prune-deploy-assets] dist/ not found; skipping");
        return { copied: [], pruned: false };
    }

    const distTilesets = resolve(distDir, "assets/tilesets");
    rmSync(distTilesets, { recursive: true, force: true });

    const runtimeAssets = collectRuntimeTilesetAssets({ mapDir, publicDir });
    const copied = new Set();
    for (const asset of runtimeAssets) {
        copyPublicFile(resolve(publicDir, asset), copied, { publicDir, distDir });
    }

    return { copied: [...copied].sort(), pruned: true };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const result = pruneDeployTilesets();
    if (result.pruned) {
        console.log(
            `[prune-deploy-assets] copied ${result.copied.length} runtime tileset asset(s) into dist/`,
        );
        for (const asset of result.copied) {
            console.log(`[prune-deploy-assets] kept ${asset}`);
        }
    }
}
