#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const TAG_PATTERN = /^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const SHA_PATTERN = /^(?:[a-f0-9]{7,40}|local)$/;
export const REQUIRED_WEB_BUNDLE_FILES = [
    "index.html",
    "manifest.json",
    "default-bundle.json",
    "revoltfx-spritesheet.json",
    "map/ma_lete.tmx",
    "map/ma_telo.tmx",
    "map/ma_tomo_lili.tmx",
    "map/nasin_pi_telo.tmx",
    "map/nasin_wan.tmx",
    "map/nena_sewi.tmx",
    "map/nena_suli.tmx",
];

export function releaseArtifactNames(tagName) {
    assertTagName(tagName);
    return {
        web_bundle_artifact: `web-bundle-${tagName}`,
        web_bundle_file: `poki-soweli-web-${tagName}.tar.gz`,
        android_debug_apk_artifact: `android-debug-apk-${tagName}`,
        android_debug_apk_file: `poki-soweli-${tagName}-debug.apk`,
    };
}

export function buildReleaseMetadata({ tag_name, version, sha, body = "" }) {
    assertTagName(tag_name);
    assertNonEmptyString(version, "version");
    assertVersionMatchesTag(tag_name, version);
    assertSha(sha);
    assertString(body, "body");

    return {
        tag_name,
        version,
        sha,
        body,
        ...releaseArtifactNames(tag_name),
    };
}

export function validateReleaseMetadata(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new Error("release metadata must be a JSON object");
    }

    const metadata = input;
    const required = [
        "tag_name",
        "version",
        "sha",
        "body",
        "web_bundle_artifact",
        "web_bundle_file",
        "android_debug_apk_artifact",
        "android_debug_apk_file",
    ];
    for (const field of required) {
        if (!(field in metadata)) {
            throw new Error(`release metadata is missing '${field}'`);
        }
        assertString(metadata[field], field);
    }

    const expected = buildReleaseMetadata({
        tag_name: metadata.tag_name,
        version: metadata.version,
        sha: metadata.sha,
        body: metadata.body,
    });

    for (const field of [
        "web_bundle_artifact",
        "web_bundle_file",
        "android_debug_apk_artifact",
        "android_debug_apk_file",
    ]) {
        if (metadata[field] !== expected[field]) {
            throw new Error(
                `release metadata field '${field}' must be '${expected[field]}' for tag ${metadata.tag_name}`,
            );
        }
    }

    return expected;
}

export function smokeReleaseArtifacts({
    root = process.cwd(),
    tagName = "v0.0.0-local",
    version = versionFromTagName(tagName),
    sha = "local",
    body = "Local release artifact smoke test.\n",
    outDir,
} = {}) {
    const repoRoot = resolve(root);
    const distDir = resolve(repoRoot, "dist");
    const apkPath = resolve(repoRoot, "android/app/build/outputs/apk/debug/app-debug.apk");
    const outRoot = prepareOutputDirectory(outDir, tagName);

    assertBuiltWebBundle(distDir);
    assertFile(apkPath, "debug APK");

    mkdirSync(outRoot, { recursive: true });

    const metadata = buildReleaseMetadata({
        tag_name: tagName,
        version,
        sha,
        body,
    });
    const webBundlePath = join(outRoot, metadata.web_bundle_file);
    const apkOutPath = join(outRoot, metadata.android_debug_apk_file);
    const metadataPath = join(outRoot, "release.json");

    execFileSync("tar", ["-czf", webBundlePath, "-C", distDir, "."]);
    copyFileSync(apkPath, apkOutPath);
    writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

    for (const file of REQUIRED_WEB_BUNDLE_FILES) {
        assertTarContains(webBundlePath, `./${file}`);
    }
    assertFile(apkOutPath, "copied debug APK");
    validateReleaseMetadata(JSON.parse(readFileSync(metadataPath, "utf8")));

    return {
        outDir: outRoot,
        metadata,
        metadataPath,
        webBundlePath,
        apkPath: apkOutPath,
    };
}

function prepareOutputDirectory(outDir, tagName) {
    if (outDir) {
        const resolved = resolve(outDir);
        if (existsSync(resolved)) {
            throw new Error(`release smoke output directory already exists: ${resolved}`);
        }
        return resolved;
    }

    return mkdtempSync(join(tmpdir(), `poki-soweli-release-smoke-${tagName}-`));
}

function versionFromTagName(tagName) {
    assertTagName(tagName);
    return tagName.replace(/^v/, "");
}

export function assertBuiltWebBundle(distDir) {
    const indexPath = join(distDir, "index.html");
    assertFile(indexPath, "web bundle index.html");
    const indexHtml = readFileSync(indexPath, "utf8");
    if (
        !indexHtml.includes("/poki-soweli/manifest.json") ||
        !indexHtml.includes("/poki-soweli/assets/")
    ) {
        throw new Error(
            "web bundle must be built with GITHUB_PAGES=true before release smoke packaging",
        );
    }

    for (const file of REQUIRED_WEB_BUNDLE_FILES) {
        assertFile(join(distDir, file), `web bundle ${file}`);
    }
}

function assertFile(path, label) {
    if (!existsSync(path) || !statSync(path).isFile()) {
        throw new Error(`${label} not found at ${path}`);
    }
}

function assertTarContains(tarPath, expectedEntry) {
    let listing;
    try {
        listing = execFileSync("tar", ["-tzf", tarPath], {
            encoding: "utf8",
            timeout: 30_000,
        })
            .split("\n")
            .filter(Boolean);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`failed to inspect web bundle tarball ${tarPath}: ${message}`);
    }
    if (!listing.includes(expectedEntry)) {
        throw new Error(`${tarPath} does not contain ${expectedEntry}`);
    }
}

function assertTagName(value) {
    assertNonEmptyString(value, "tag_name");
    if (!TAG_PATTERN.test(value)) {
        throw new Error(`tag_name must be a v-prefixed semver tag, got '${value}'`);
    }
}

function assertVersionMatchesTag(tagName, version) {
    const expected = versionFromTagName(tagName);
    if (version !== expected) {
        throw new Error(
            `version must be '${expected}' for tag_name '${tagName}', got '${version}'`,
        );
    }
}

function assertSha(value) {
    assertNonEmptyString(value, "sha");
    if (!SHA_PATTERN.test(value)) {
        throw new Error(`sha must be a git SHA or 'local', got '${value}'`);
    }
}

function assertString(value, field) {
    if (typeof value !== "string") {
        throw new Error(`release metadata field '${field}' must be a string`);
    }
}

function assertNonEmptyString(value, field) {
    assertString(value, field);
    if (value.trim() === "") {
        throw new Error(`release metadata field '${field}' must not be empty`);
    }
}

function parseArgs(argv) {
    const [tagName = "v0.0.0-local", outDir] = argv;
    return { tagName, outDir };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { tagName, outDir } = parseArgs(process.argv.slice(2));
    const result = smokeReleaseArtifacts({ tagName, outDir });
    console.log(`[release-smoke] wrote ${result.metadata.web_bundle_file}`);
    console.log(`[release-smoke] wrote ${result.metadata.android_debug_apk_file}`);
    console.log(`[release-smoke] wrote release.json`);
    console.log(`[release-smoke] output: ${result.outDir}`);
}
