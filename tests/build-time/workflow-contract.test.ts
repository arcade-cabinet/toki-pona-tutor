import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const workflowsDir = resolve(root, ".github/workflows");

function workflow(name: string) {
    return readFileSync(resolve(workflowsDir, name), "utf8");
}

function jsonFile<T = unknown>(name: string): T {
    return JSON.parse(readFileSync(resolve(root, name), "utf8")) as T;
}

function workflowNames() {
    return readdirSync(workflowsDir)
        .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
        .sort();
}

describe("GitHub Actions run/release/deploy contract", () => {
    const ci = workflow("ci.yml");
    const automerge = workflow("automerge.yml");
    const release = workflow("release.yml");
    const cd = workflow("cd.yml");
    const releasePleaseConfig = jsonFile<Record<string, unknown>>("release-please-config.json");
    const packageJson = jsonFile<{ scripts: Record<string, string> }>("package.json");

    it("keeps ci.yml as the PR gate with reviewer artifacts after validation", () => {
        expect(ci).toMatch(/^on:\n\s+pull_request:/m);
        expect(ci).not.toMatch(/^on:\n\s+push:/m);
        expect(ci).toContain("node scripts/check-conventional-commits.mjs");
        expect(ci).toContain("needs:\n      - unit\n      - integration\n      - e2e-smoke");
        expect(ci).toMatch(/GITHUB_PAGES:\s+['"]true['"]/);
        expect(ci).toContain("node scripts/deploy/verify-pages-bundle.mjs dist");
        expect(ci).toMatch(/CAPACITOR:\s+['"]true['"]/);
        expect(ci).toContain("pnpm exec cap sync android");
        expect(ci).toContain("./gradlew assembleDebug");
        expect(ci).toContain("rivers-reckoning-debug-apk-${{ github.event.pull_request.number }}");
    });

    it("keeps workflow names aligned with the shared release shape", () => {
        expect(workflowNames()).toEqual(["automerge.yml", "cd.yml", "ci.yml", "release.yml"]);
    });

    it("keeps bot automerge scoped to Dependabot and release-please PRs", () => {
        expect(automerge).toMatch(/^name:\s+Automerge/m);
        expect(automerge).toContain("github.actor == 'dependabot[bot]'");
        expect(automerge).toContain(
            "steps.meta.outputs.update-type != 'version-update:semver-major'",
        );
        expect(automerge).toContain(
            "startsWith(github.event.pull_request.head.ref, 'release-please--')",
        );
        expect(automerge).toContain("gh pr merge --auto --squash");
    });

    it("keeps browser E2E headed, with xvfb only providing the CI display", () => {
        const playwrightConfig = readFileSync(resolve(root, "playwright.config.ts"), "utf8");

        expect(playwrightConfig.match(/headless:\s*false/g)).toHaveLength(2);
        expect(packageJson.scripts["test:e2e"]).toContain("--headed");
        expect(packageJson.scripts["test:e2e:smoke"]).toContain("--headed");
        expect(packageJson.scripts["test:e2e:full"]).toContain("--headed");
        expect(ci).toContain("xvfb-run");
        expect(`${ci}\n${JSON.stringify(packageJson.scripts)}`).not.toContain("--headless");
    });

    it("keeps package verification scripts shell-portable", () => {
        const portableScripts = [
            "typecheck:src",
            "typecheck:build-time",
            "workflow:check",
            "android:build-debug",
            "maestro:check",
        ];

        for (const scriptName of portableScripts) {
            const script = packageJson.scripts[scriptName];
            expect(script, scriptName).toMatch(/^node scripts\/.+\.mjs/);
            expect(script, scriptName).not.toMatch(
                /\b(grep|tee|find|test)\b|CAPACITOR=|\$\(|\|\s*|&&|\.\//,
            );
        }
    });

    it("keeps sql.js wasm available to both Vite dev and production builds", () => {
        const viteConfig = readFileSync(resolve(root, "vite.config.ts"), "utf8");

        expect(viteConfig).toContain("configResolved()");
        expect(viteConfig).toContain("configureServer()");
        expect(viteConfig).toContain("buildStart()");
        expect(viteConfig).toContain("copySqlJsWasmAssets()");
        expect(viteConfig).toContain("sql-wasm.wasm");
        expect(viteConfig).toContain("sql-wasm.js");
    });

    it("keeps release.yml on a configured release-please token plus versioned workflow artifacts", () => {
        expect(release).toMatch(/^on:\n\s+push:\n\s+branches:\n\s+- main/m);
        expect(release).toContain(
            "RELEASE_PLEASE_TOKEN: ${{ secrets.CI_GITHUB_TOKEN_PAT || secrets.CI_GITHUB_TOKEN }}",
        );
        expect(release).toContain("Configure CI_GITHUB_TOKEN_PAT or CI_GITHUB_TOKEN");
        expect(release).toContain("token: ${{ env.RELEASE_PLEASE_TOKEN }}");
        expect(release).not.toContain("token: ${{ secrets.CI_GITHUB_TOKEN_PAT }}");
        expect(release).toContain("ref: ${{ needs.release-please.outputs.sha }}");
        expect(release).toMatch(/GITHUB_PAGES:\s+['"]true['"]/);
        expect(release).toContain("node scripts/deploy/verify-pages-bundle.mjs dist");
        expect(release).toMatch(/CAPACITOR:\s+['"]true['"]/);
        expect(release).toContain("name: web-bundle-${{ needs.release-please.outputs.tag_name }}");
        expect(release).toContain(
            "name: android-debug-apk-${{ needs.release-please.outputs.tag_name }}",
        );
        expect(release).toContain("name: release-metadata");
        expect(release).toContain("android_debug_apk_artifact: `android-debug-apk-${tag}`");
        expect(release).toContain('gh release view "$TAG_NAME" --json body --jq .body');
        expect(release).not.toContain("gh release upload");
    });

    it("keeps release tags as plain v-prefixed semver tags", () => {
        expect(releasePleaseConfig["include-component-in-tag"]).toBe(false);
        expect(releasePleaseConfig["include-v-in-tag"]).toBe(true);
        expect(cd).toContain("e.g. v0.2.0");
        expect(cd).not.toContain("poki-soweli-v0.2.0");
    });

    it("keeps Android release signing deferred in current release automation", () => {
        expect(release).toContain("./gradlew assembleDebug");
        expect(release).not.toContain("assembleRelease");
        expect(release).not.toContain("ANDROID_KEYSTORE_BASE64");
        expect(release).not.toContain("KEYSTORE_PASSWORD");
    });

    it("keeps cd.yml consuming completed release workflow artifacts, not release events", () => {
        expect(cd).toMatch(
            /^on:\n\s+workflow_run:\n\s+workflows: \[release\]\n\s+types: \[completed\]/m,
        );
        expect(cd).toContain("github.event.workflow_run.conclusion == 'success'");
        expect(cd).toContain("RUN_ID: ${{ github.event.workflow_run.id }}");
        expect(cd).toContain('gh run download "$RUN_ID" --name release-metadata');
        expect(cd).toContain('gh run download "$RUN_ID" --name "$WEB_ARTIFACT"');
        expect(cd).toContain('gh run download "$RUN_ID" --name "$APK_ARTIFACT"');
        expect(cd).toContain(
            "for required in tag version sha web_artifact web_file apk_artifact apk_file",
        );
        expect(cd).toContain('gh release upload "$TAG_NAME" "$WEB_FILE" "$APK_FILE" --clobber');
        expect(cd).toContain('--pattern "$WEB_FILE"');
        expect(cd).toContain("web bundle was not built with the GitHub Pages base");
        expect(cd).toContain("web bundle is missing required runtime file: $file");
        expect(cd).toContain("map/dreadpeak_cavern.tmx");
        expect(cd).toContain("actions/deploy-pages@");
        expect(cd).not.toContain("types: [published]");
    });

    it("keeps every workflow action pinned to a full commit SHA", () => {
        for (const name of workflowNames()) {
            const source = workflow(name);
            const usesLines = source.matchAll(
                /^\s*uses:\s*([^@\s#]+)@([^\s#]+)(?:\s+#\s*(.+))?$/gm,
            );

            for (const match of usesLines) {
                const [, action, ref, comment] = match;
                expect(ref, `${name}: ${action}@${ref} must be pinned to a 40-char SHA`).toMatch(
                    /^[a-f0-9]{40}$/,
                );
                expect(
                    comment,
                    `${name}: ${action}@${ref} should keep a version comment for update review`,
                ).toMatch(/^v\d+\./);
            }
        }
    });
});
