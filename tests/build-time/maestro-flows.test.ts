import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function text(path: string): string {
    return readFileSync(resolve(ROOT, path), "utf8");
}

describe("Maestro mobile QA contract", () => {
    it("keeps package scripts for syntax-checking and running mobile smoke flows", () => {
        const pkg = JSON.parse(text("package.json")) as {
            scripts: Record<string, string>;
        };
        const androidBuildScript = text("scripts/android-build-debug.mjs");
        const maestroCheckScript = text("scripts/maestro-check.mjs");

        expect(pkg.scripts["maestro:check"]).toContain("node scripts/maestro-check.mjs");
        expect(maestroCheckScript).toContain("check-syntax");
        expect(pkg.scripts["maestro:android"]).toContain(".maestro/android/debug-apk-smoke.yaml");
        expect(pkg.scripts["maestro:ios"]).toContain(".maestro/ios/pages-safari-smoke.yaml");
        expect(pkg.scripts["android:build-debug"]).toContain("node scripts/android-build-debug.mjs");
        expect(androidBuildScript).toContain("CAPACITOR");
        expect(androidBuildScript).toContain("syncAndroidAppIdentity");
        expect(androidBuildScript).toContain("assembleDebug");
    });

    it("keeps Android debug APK flow pointed at the Capacitor package", () => {
        const flow = text(".maestro/android/debug-apk-smoke.yaml");

        // Flow scoped to title-screen boot-smoke after T13 verification
        // (PR #167): Capacitor WebView + canvas-dispatched dialog text
        // do not expose reliably through Maestro's accessibility tree,
        // so gameplay coverage lives in Playwright against Chromium.
        // These assertions guarantee the flow still proves Capacitor
        // packaging + React overlay mount on a booted Android device.
        expect(flow).toContain("appId: com.riversreckoning.game");
        expect(flow).toContain("name: Android debug APK smoke");
        expect(flow).toContain("clearState: com.riversreckoning.game");
        expect(flow).toContain("setOrientation: LANDSCAPE_LEFT");
        expect(flow).toContain('visible: "Rivers Reckoning"');
        expect(flow).toContain('assertVisible: "New Game"');
        expect(flow).toContain('assertVisible: "Settings"');
        expect(flow).toContain('assertVisible: "Quit"');
    });

    it("keeps iOS flow on Mobile Safari Pages until a native iOS target exists", () => {
        const flow = text(".maestro/ios/pages-safari-smoke.yaml");

        // Flow scoped to title-screen boot-smoke after T12 verification
        // (PR #165): Safari's accessibility tree exposes React overlay
        // strings inconsistently across WebKit runs, so gameplay
        // coverage lives in Playwright against Chromium. These
        // assertions guarantee the flow still proves Pages base path
        // loads + React+Radix+Motion mount on real mobile WebKit.
        expect(flow).toContain("appId: com.apple.mobilesafari");
        expect(flow).toContain("https://arcade-cabinet.github.io/poki-soweli/");
        expect(flow).toContain("name: iOS Safari Pages smoke");
        expect(flow).toContain("setOrientation: LANDSCAPE_LEFT");
        expect(flow).toContain('visible: "Rivers Reckoning"');
        expect(flow).toContain('assertVisible: "New Game"');
        expect(flow).toContain('assertVisible: "Settings"');
        expect(flow).toContain('assertVisible: "Quit"');
    });

    it("keeps release QA docs wired to Maestro without overstating device proof", () => {
        const docs = [
            text("docs/MOBILE_QA.md"),
            text("docs/RELEASE_QA.md"),
            text("docs/STATE.md"),
            text("docs/ROADMAP.md"),
        ].join("\n");

        expect(docs).toContain("pnpm maestro:check");
        expect(docs).toContain("pnpm maestro:android");
        expect(docs).toContain("pnpm maestro:ios");
        expect(docs).toContain("Android emulator smoke passed");
        expect(docs).toContain("release-attached APK proof");
        expect(docs).toContain("iOS Pages simulator proof");
    });
});
