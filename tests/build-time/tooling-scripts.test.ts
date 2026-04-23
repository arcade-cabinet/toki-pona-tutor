import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

const typecheckTool = (await import("../../scripts/run-typecheck.mjs")) as {
    filterKnownTypecheckNoise(output: string): string;
    hasTypeScriptError(output: string): boolean;
};

const maestroTool = (await import("../../scripts/maestro-check.mjs")) as {
    maestroFlowFiles(dir?: string): string[];
};

const androidTool = (await import("../../scripts/android-build-debug.mjs")) as {
    syncAndroidAppIdentity(options: { root: string }): void;
};

describe("portable local tooling scripts", () => {
    it("filters only the known upstream RPG.js WorldMaps type noise", () => {
        const output = [
            "node_modules/.pnpm/@rpgjs+common/node_modules/@rpgjs/common/src/rooms/WorldMaps.ts:4:1 - error TS1000: upstream",
            "src/config/example.ts:1:1 - error TS2322: local",
            "node_modules\\.pnpm\\@rpgjs+common\\node_modules\\@rpgjs\\common\\src\\rooms\\WorldMaps.ts:4:1 - error TS1000: upstream",
        ].join("\n");

        expect(typecheckTool.filterKnownTypecheckNoise(output)).toBe(
            "src/config/example.ts:1:1 - error TS2322: local",
        );
        expect(typecheckTool.hasTypeScriptError("src/config/example.ts:1:1 - error TS2322")).toBe(
            true,
        );
    });

    it("discovers Maestro YAML flows recursively without relying on POSIX find", () => {
        const root = mkdtempSync(join(tmpdir(), "poki-maestro-"));
        try {
            mkdirSync(join(root, "android"), { recursive: true });
            mkdirSync(join(root, "ios"), { recursive: true });
            writeFileSync(join(root, "android", "debug.yaml"), "appId: test\n");
            writeFileSync(join(root, "ios", "safari.yaml"), "appId: test\n");
            writeFileSync(join(root, "ios", "notes.txt"), "ignore\n");

            expect(maestroTool.maestroFlowFiles(root).map((file) => basename(file))).toEqual([
                "debug.yaml",
                "safari.yaml",
            ]);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it("syncs stale generated Android app identity from Capacitor config", () => {
        const root = mkdtempSync(join(tmpdir(), "rivers-android-"));
        try {
            writeFileSync(
                join(root, "capacitor.config.ts"),
                [
                    "export default {",
                    "  appId: 'com.riversreckoning.game',",
                    "  appName: 'Rivers Reckoning',",
                    "};",
                ].join("\n"),
            );

            mkdirSync(join(root, "android", "app", "src", "main", "res", "values"), {
                recursive: true,
            });
            mkdirSync(join(root, "android", "app", "src", "main", "java", "com", "pokisoweli", "game"), {
                recursive: true,
            });
            writeFileSync(
                join(root, "android", "app", "build.gradle"),
                [
                    "android {",
                    '    namespace = "com.pokisoweli.game"',
                    "    defaultConfig {",
                    '        applicationId "com.pokisoweli.game"',
                    "    }",
                    "}",
                ].join("\n"),
            );
            writeFileSync(
                join(root, "android", "app", "src", "main", "res", "values", "strings.xml"),
                [
                    "<resources>",
                    '    <string name="app_name">poki soweli</string>',
                    '    <string name="title_activity_main">poki soweli</string>',
                    '    <string name="package_name">com.pokisoweli.game</string>',
                    '    <string name="custom_url_scheme">com.pokisoweli.game</string>',
                    "</resources>",
                ].join("\n"),
            );
            writeFileSync(
                join(
                    root,
                    "android",
                    "app",
                    "src",
                    "main",
                    "java",
                    "com",
                    "pokisoweli",
                    "game",
                    "MainActivity.java",
                ),
                [
                    "package com.pokisoweli.game;",
                    "",
                    "import com.getcapacitor.BridgeActivity;",
                    "",
                    "public class MainActivity extends BridgeActivity {}",
                ].join("\n"),
            );

            androidTool.syncAndroidAppIdentity({ root });

            expect(readFileSync(join(root, "android", "app", "build.gradle"), "utf8")).toContain(
                'applicationId "com.riversreckoning.game"',
            );
            expect(
                readFileSync(join(root, "android", "app", "src", "main", "res", "values", "strings.xml"), "utf8"),
            ).toContain('<string name="app_name">Rivers Reckoning</string>');
            const desiredActivity = join(
                root,
                "android",
                "app",
                "src",
                "main",
                "java",
                "com",
                "riversreckoning",
                "game",
                "MainActivity.java",
            );
            expect(readFileSync(desiredActivity, "utf8")).toContain(
                "package com.riversreckoning.game;",
            );
            expect(
                existsSync(
                    join(
                        root,
                        "android",
                        "app",
                        "src",
                        "main",
                        "java",
                        "com",
                        "pokisoweli",
                        "game",
                        "MainActivity.java",
                    ),
                ),
            ).toBe(false);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});
