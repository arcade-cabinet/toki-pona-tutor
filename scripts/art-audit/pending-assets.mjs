#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = new URL("../..", import.meta.url);
const repoRootPath = fileURLToPath(repoRoot);
const pendingRoot =
    process.argv[2] ??
    (existsSync(join(repoRootPath, "pending"))
        ? join(repoRootPath, "pending")
        : join(repoRootPath, "..", "..", "pending"));

if (!existsSync(pendingRoot)) {
    throw new Error(`pending asset directory not found: ${pendingRoot}`);
}

const archiveExtensions = new Set([".zip", ".rar"]);
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const knownFileExtensions = new Set([
    ...imageExtensions,
    ".aseprite",
    ".json",
    ".pdf",
    ".tif",
    ".tmx",
    ".tsx",
    ".txt",
]);

const files = readdirSync(pendingRoot)
    .map((name) => join(pendingRoot, name))
    .filter((path) => statSync(path).isFile())
    .sort((a, b) => a.localeCompare(b));

const archives = [];
const looseImages = [];

for (const path of files) {
    const extension = extname(path).toLowerCase();
    if (archiveExtensions.has(extension)) {
        archives.push(summarizeArchive(path, extension));
    } else if (imageExtensions.has(extension)) {
        looseImages.push(relative(pendingRoot, path));
    }
}

const summary = {
    pendingRoot,
    archiveCount: archives.length,
    looseImageCount: looseImages.length,
    archives,
    looseImages,
};

console.log(JSON.stringify(summary, null, 2));

function summarizeArchive(path, extension) {
    const entries = listArchive(path, extension);
    const imageEntries = entries.filter((entry) => imageExtensions.has(extname(entry).toLowerCase()));
    const extensionCounts = {};
    for (const entry of entries) {
        const ext = normalizedEntryExtension(entry);
        extensionCounts[ext] = (extensionCounts[ext] ?? 0) + 1;
    }

    return {
        name: relative(pendingRoot, path),
        type: extension.slice(1),
        entryCount: entries.length,
        imageCount: imageEntries.length,
        extensionCounts,
        topLevel: [...new Set(entries.map((entry) => entry.split("/")[0]).filter(Boolean))]
            .sort()
            .slice(0, 12),
        sampleImages: imageEntries.slice(0, 16),
    };
}

function normalizedEntryExtension(entry) {
    const ext = extname(entry).toLowerCase();
    return ext && knownFileExtensions.has(ext) ? ext : "(none)";
}

function listArchive(path, extension) {
    if (extension === ".zip") {
        return execFileSync("unzip", ["-Z1", path], { encoding: "utf8" })
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
    }
    return execFileSync("bsdtar", ["-tf", path], { encoding: "utf8" })
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}
