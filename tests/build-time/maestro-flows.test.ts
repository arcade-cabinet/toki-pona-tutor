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

        expect(pkg.scripts["maestro:check"]).toContain("maestro check-syntax");
        expect(pkg.scripts["maestro:android"]).toContain(".maestro/android/debug-apk-smoke.yaml");
        expect(pkg.scripts["maestro:ios"]).toContain(".maestro/ios/pages-safari-smoke.yaml");
        expect(pkg.scripts["android:build-debug"]).toContain("./gradlew assembleDebug");
    });

    it("keeps Android debug APK flow pointed at the Capacitor package", () => {
        const flow = text(".maestro/android/debug-apk-smoke.yaml");

        expect(flow).toContain("appId: com.pokisoweli.game");
        expect(flow).toContain("name: Android debug APK smoke");
        expect(flow).toContain("clearState: com.pokisoweli.game");
        expect(flow).toContain('visible: "poki soweli"');
        expect(flow).toContain('tapOn: "open sin"');
        expect(flow).toContain('tapOn: "kon moli"');
        expect(flow).toContain('tapOn: "≡"');
        expect(flow).not.toContain("point:");
    });

    it("keeps iOS flow on Mobile Safari Pages until a native iOS target exists", () => {
        const flow = text(".maestro/ios/pages-safari-smoke.yaml");

        expect(flow).toContain("appId: com.apple.mobilesafari");
        expect(flow).toContain("https://arcade-cabinet.github.io/poki-soweli/");
        expect(flow).toContain("name: iOS Safari Pages smoke");
        expect(flow).toContain('visible: "poki soweli"');
        expect(flow).toContain('tapOn: "open sin"');
        expect(flow).toContain('tapOn: "kon moli"');
        expect(flow).not.toContain("point:");
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
        expect(docs).toContain("Maestro is scaffolded, not device-proven yet");
        expect(docs).toContain("actual Android emulator execution");
    });
});
