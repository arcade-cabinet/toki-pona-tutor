import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const releaseArtifacts = (await import("../../scripts/deploy/smoke-release-artifacts.mjs")) as {
    buildReleaseMetadata(input: {
        tag_name: string;
        version: string;
        sha: string;
        body?: string;
    }): Record<string, string>;
    releaseArtifactNames(tagName: string): Record<string, string>;
    smokeReleaseArtifacts(input: {
        root: string;
        tagName: string;
        version?: string;
        sha?: string;
        body?: string;
        outDir?: string;
    }): {
        outDir: string;
        metadata: Record<string, string>;
        metadataPath: string;
        webBundlePath: string;
        apkPath: string;
    };
    validateReleaseMetadata(input: unknown): Record<string, string>;
};
const pagesBundle = (await import("../../scripts/deploy/verify-pages-bundle.mjs")) as {
    verifyPagesBundle(distDir?: string): {
        distDir: string;
        requiredFiles: string[];
    };
};
const pruneAssets = (await import("../../scripts/deploy/prune-deploy-assets.mjs")) as {
    collectRuntimeTilesetAssets(input?: { mapDir?: string; publicDir?: string }): string[];
    pruneDeployTilesets(input?: { distDir?: string; publicDir?: string; mapDir?: string }): {
        copied: string[];
        pruned: boolean;
    };
};

const tempRoots: string[] = [];

afterEach(() => {
    for (const root of tempRoots.splice(0)) {
        rmSync(root, { recursive: true, force: true });
    }
});

function tempRoot() {
    const root = mkdtempSync(join(tmpdir(), "poki-release-artifacts-"));
    tempRoots.push(root);
    return root;
}

function writeRequiredWebBundleFiles(root: string, skipFile?: string) {
    for (const file of [
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
    ]) {
        if (file === skipFile) continue;
        writeFileSync(join(root, "dist", file), "{}\n");
    }
}

function writeRuntimeTilesetFixture(root: string, imageSource: string) {
    mkdirSync(join(root, "src/tiled"), { recursive: true });
    mkdirSync(join(root, "public/assets/tilesets/test"), { recursive: true });
    writeFileSync(
        join(root, "src/tiled/test.tmx"),
        '<map><tileset firstgid="1" source="../assets/tilesets/test/test.tsx"/></map>\n',
    );
    writeFileSync(
        join(root, "public/assets/tilesets/test/test.tsx"),
        `<tileset><image source="${imageSource}"/></tileset>\n`,
    );
}

describe("release artifact handoff contract", () => {
    it("derives deterministic release artifact names from the tag", () => {
        expect(releaseArtifacts.releaseArtifactNames("v0.2.3")).toEqual({
            web_bundle_artifact: "web-bundle-v0.2.3",
            web_bundle_file: "poki-soweli-web-v0.2.3.tar.gz",
            android_debug_apk_artifact: "android-debug-apk-v0.2.3",
            android_debug_apk_file: "poki-soweli-v0.2.3-debug.apk",
        });
    });

    it("validates the release metadata consumed by cd.yml", () => {
        const metadata = releaseArtifacts.buildReleaseMetadata({
            tag_name: "v0.2.3",
            version: "0.2.3",
            sha: "0123456789abcdef0123456789abcdef01234567",
            body: "release notes\n",
        });

        expect(releaseArtifacts.validateReleaseMetadata(metadata)).toEqual(metadata);
    });

    it("rejects metadata whose artifact names do not match the tag", () => {
        const metadata = {
            ...releaseArtifacts.buildReleaseMetadata({
                tag_name: "v0.2.3",
                version: "0.2.3",
                sha: "0123456789abcdef0123456789abcdef01234567",
            }),
            web_bundle_file: "poki-soweli-web-v0.2.2.tar.gz",
        };

        expect(() => releaseArtifacts.validateReleaseMetadata(metadata)).toThrow(
            /web_bundle_file.*v0\.2\.3/,
        );
    });

    it("keeps prerelease metadata versions aligned with the tag", () => {
        expect(
            releaseArtifacts.buildReleaseMetadata({
                tag_name: "v0.2.3-rc.1",
                version: "0.2.3-rc.1",
                sha: "local",
            }).version,
        ).toBe("0.2.3-rc.1");

        expect(() =>
            releaseArtifacts.buildReleaseMetadata({
                tag_name: "v0.2.3-rc.1",
                version: "0.2.3",
                sha: "local",
            }),
        ).toThrow(/version must be '0\.2\.3-rc\.1'/);
    });

    it("packages a local web bundle, debug APK, and release.json smoke artifact set", () => {
        const root = tempRoot();
        const outDir = join(tempRoot(), "release-out");
        mkdirSync(join(root, "dist"), { recursive: true });
        mkdirSync(join(root, "dist/map"), { recursive: true });
        mkdirSync(join(root, "android/app/build/outputs/apk/debug"), { recursive: true });
        writeFileSync(
            join(root, "dist/index.html"),
            [
                '<link rel="manifest" href="/poki-soweli/manifest.json">',
                '<script type="module" src="/poki-soweli/assets/index.js"></script>',
                "<main>poki soweli</main>",
            ].join("\n"),
        );
        writeRequiredWebBundleFiles(root);
        writeFileSync(join(root, "android/app/build/outputs/apk/debug/app-debug.apk"), "apk\n");

        const result = releaseArtifacts.smokeReleaseArtifacts({
            root,
            outDir,
            tagName: "v0.2.3",
            version: "0.2.3",
            sha: "local",
        });

        expect(result.metadata.web_bundle_file).toBe("poki-soweli-web-v0.2.3.tar.gz");
        expect(result.metadata.android_debug_apk_file).toBe("poki-soweli-v0.2.3-debug.apk");
        expect(readFileSync(result.metadataPath, "utf8")).toContain('"tag_name": "v0.2.3"');
        expect(readFileSync(result.apkPath, "utf8")).toBe("apk\n");
    });

    it("verifies the deployable Pages bundle contract without requiring an APK", () => {
        const root = tempRoot();
        mkdirSync(join(root, "dist/map"), { recursive: true });
        writeFileSync(
            join(root, "dist/index.html"),
            [
                '<link rel="manifest" href="/poki-soweli/manifest.json">',
                '<script type="module" src="/poki-soweli/assets/index.js"></script>',
            ].join("\n"),
        );
        writeRequiredWebBundleFiles(root);

        const result = pagesBundle.verifyPagesBundle(join(root, "dist"));

        expect(result.requiredFiles).toContain("manifest.json");
        expect(result.requiredFiles).toContain("map/nena_suli.tmx");
    });

    it("rejects deployable Pages bundle verification when the Pages base is missing", () => {
        const root = tempRoot();
        mkdirSync(join(root, "dist/map"), { recursive: true });
        writeFileSync(
            join(root, "dist/index.html"),
            [
                '<link rel="manifest" href="./manifest.json">',
                '<script type="module" src="./assets/index.js"></script>',
            ].join("\n"),
        );
        writeRequiredWebBundleFiles(root);

        expect(() => pagesBundle.verifyPagesBundle(join(root, "dist"))).toThrow(
            /GITHUB_PAGES=true/,
        );
    });

    it("rejects a local release smoke when dist is not the Pages build", () => {
        const root = tempRoot();
        const outDir = join(tempRoot(), "release-out");
        mkdirSync(join(root, "dist"), { recursive: true });
        mkdirSync(join(root, "android/app/build/outputs/apk/debug"), { recursive: true });
        writeFileSync(
            join(root, "dist/index.html"),
            [
                '<link rel="manifest" href="./manifest.json">',
                '<script type="module" src="./assets/index.js"></script>',
            ].join("\n"),
        );
        writeFileSync(join(root, "android/app/build/outputs/apk/debug/app-debug.apk"), "apk\n");

        expect(() =>
            releaseArtifacts.smokeReleaseArtifacts({
                root,
                outDir,
                tagName: "v0.2.3",
                version: "0.2.3",
                sha: "local",
            }),
        ).toThrow(/GITHUB_PAGES=true/);
    });

    it("rejects a local release smoke when a runtime map is missing from dist", () => {
        const root = tempRoot();
        const outDir = join(tempRoot(), "release-out");
        mkdirSync(join(root, "dist/map"), { recursive: true });
        mkdirSync(join(root, "android/app/build/outputs/apk/debug"), { recursive: true });
        writeFileSync(
            join(root, "dist/index.html"),
            [
                '<link rel="manifest" href="/poki-soweli/manifest.json">',
                '<script type="module" src="/poki-soweli/assets/index.js"></script>',
            ].join("\n"),
        );
        writeRequiredWebBundleFiles(root, "map/nena_suli.tmx");
        writeFileSync(join(root, "android/app/build/outputs/apk/debug/app-debug.apk"), "apk\n");

        expect(() =>
            releaseArtifacts.smokeReleaseArtifacts({
                root,
                outDir,
                tagName: "v0.2.3",
                version: "0.2.3",
                sha: "local",
            }),
        ).toThrow(/map\/nena_suli\.tmx/);
    });

    it("refuses to wipe a caller-supplied existing output directory", () => {
        const root = tempRoot();
        const outDir = tempRoot();
        mkdirSync(join(root, "dist/map"), { recursive: true });
        mkdirSync(join(root, "android/app/build/outputs/apk/debug"), { recursive: true });
        writeFileSync(
            join(root, "dist/index.html"),
            [
                '<link rel="manifest" href="/poki-soweli/manifest.json">',
                '<script type="module" src="/poki-soweli/assets/index.js"></script>',
            ].join("\n"),
        );
        writeRequiredWebBundleFiles(root);
        writeFileSync(join(root, "android/app/build/outputs/apk/debug/app-debug.apk"), "apk\n");

        expect(() =>
            releaseArtifacts.smokeReleaseArtifacts({
                root,
                outDir,
                tagName: "v0.2.3",
                version: "0.2.3",
                sha: "local",
            }),
        ).toThrow(/output directory already exists/);
    });

    it("rejects tileset image paths outside public with tileset context", () => {
        const root = tempRoot();
        writeRuntimeTilesetFixture(root, "../../../../outside.png");

        expect(() =>
            pruneAssets.collectRuntimeTilesetAssets({
                mapDir: join(root, "src/tiled"),
                publicDir: join(root, "public"),
            }),
        ).toThrow(/tileset image .*outside\.png.*outside public/);
    });

    it("preflights runtime assets before pruning the deploy tileset directory", () => {
        const root = tempRoot();
        writeRuntimeTilesetFixture(root, "missing.png");
        mkdirSync(join(root, "dist/assets/tilesets"), { recursive: true });
        writeFileSync(join(root, "dist/assets/tilesets/sentinel.txt"), "keep\n");

        expect(() =>
            pruneAssets.pruneDeployTilesets({
                distDir: join(root, "dist"),
                publicDir: join(root, "public"),
                mapDir: join(root, "src/tiled"),
            }),
        ).toThrow(/missing runtime asset: assets\/tilesets\/test\/missing\.png/);
        expect(existsSync(join(root, "dist/assets/tilesets/sentinel.txt"))).toBe(true);
    });
});
