import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import worldRaw from "../../src/content/generated/world.json";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WORLD = worldRaw as {
    species: Array<{
        id: string;
        name: { en: string };
        type: string;
        sprite?: { src?: string; tier?: string };
    }>;
};

const CURRENT_STATE_DOCS = [
    "AGENTS.md",
    "README.md",
    "CLAUDE.md",
    "STANDARDS.md",
    ".github/copilot-instructions.md",
    "docs/ARCHITECTURE.md",
    "docs/DEPLOYMENT.md",
    "docs/DESIGN.md",
    "docs/SETUP.md",
    "docs/STATE.md",
    "docs/TESTING.md",
] as const;

function doc(path: string): string {
    return readFileSync(resolve(ROOT, path), "utf8");
}

function docs(paths: readonly string[] = CURRENT_STATE_DOCS): string {
    return paths.map((path) => `\n--- ${path} ---\n${doc(path)}`).join("\n");
}

function updatedDate(path: string): string | null {
    return doc(path).match(/^updated:\s*(\d{4}-\d{2}-\d{2})$/m)?.[1] ?? null;
}

function markdownFiles(dir: string): string[] {
    const entries = readdirSync(resolve(ROOT, dir), { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const child = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
            files.push(...markdownFiles(child));
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
            files.push(child);
        }
    }

    return files;
}

function countSpecFiles(dir: string): number {
    return readdirSync(resolve(ROOT, dir)).filter((file) => file.endsWith(".spec.ts")).length;
}

function relativeDocRefs(source: string): string[] {
    const markdownLinks = [...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
    const htmlImages = [...source.matchAll(/<img\s+[^>]*src="([^"]+)"/g)].map((match) => match[1]);

    return [...markdownLinks, ...htmlImages].filter((ref) => {
        if (/^(https?:|mailto:|#|\/)/.test(ref)) return false;
        return ref.split("#")[0].length > 0;
    });
}

function codeSpans(source: string): string[] {
    return [...source.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim());
}

function pngDimensions(path: string): { width: number; height: number } {
    const png = readFileSync(resolve(ROOT, path));
    return {
        width: png.readUInt32BE(16),
        height: png.readUInt32BE(20),
    };
}

describe("current-state documentation drift guards", () => {
    it("keeps the local dev URL on / instead of the Pages base path", () => {
        const source = docs([
            "AGENTS.md",
            "README.md",
            "CLAUDE.md",
            "docs/SETUP.md",
            "docs/STATE.md",
        ]);

        expect(source).not.toMatch(/pnpm dev[^\n]*localhost:5173\/poki-soweli\//);
        expect(source).not.toMatch(/vite (dev server|at)[^\n]*localhost:5173\/poki-soweli\//);
        expect(source).not.toContain("local base = /poki-soweli");
        expect(source).toContain("local dev/preview is `/`");
        expect(source).toContain("GitHub Pages is `/poki-soweli/`");
        expect(source).toContain("Capacitor is `./`");
    });

    it("keeps Playwright webServer from nesting pnpm inside pnpm scripts", () => {
        const source = doc("playwright.config.ts");

        expect(source).toContain("command: `vite --host 127.0.0.1 --port ${e2ePort} --strictPort`");
        expect(source).not.toContain("command: `pnpm exec vite");
    });

    it("keeps current-state docs free of fixed branch and PR references", () => {
        const source = docs();

        expect(source).not.toMatch(/PR #\d+/);
        expect(source).not.toContain("gh pr view");
        expect(source).not.toMatch(/vitest browser harness/i);
        expect(source).not.toMatch(/four[- ]layer/i);
        expect(source).not.toMatch(/four layers/i);
        expect(source).not.toContain("wiring deferred from this PR");
        expect(source).toContain("git branch --show-current");
    });

    it("keeps root onboarding docs aligned with the STATE baseline date", () => {
        const stateUpdated = updatedDate("docs/STATE.md");

        expect(stateUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect([
            ["AGENTS.md", updatedDate("AGENTS.md")],
            ["README.md", updatedDate("README.md")],
            ["CLAUDE.md", updatedDate("CLAUDE.md")],
            ["STANDARDS.md", updatedDate("STANDARDS.md")],
        ]).toEqual([
            ["AGENTS.md", stateUpdated],
            ["README.md", stateUpdated],
            ["CLAUDE.md", stateUpdated],
            ["STANDARDS.md", stateUpdated],
        ]);
    });

    it("keeps release docs on workflow_run handoff instead of release published events", () => {
        const source = docs(["docs/DEPLOYMENT.md", "docs/STATE.md", "docs/TESTING.md"]);

        expect(source).toContain("workflow_run");
        expect(source).not.toContain("release: published");
        expect(source).not.toContain("types: [published]");
    });

    it("keeps quick-start release-smoke examples tag-agnostic", () => {
        const source = docs(["README.md", "CLAUDE.md"]);

        expect(source).toContain('pnpm release:smoke-artifacts "$RELEASE_TAG"');
        expect(source).not.toContain("pnpm release:smoke-artifacts v0.2.1-local");
    });

    it("keeps README local image references backed by committed files", () => {
        const readme = doc("README.md");
        const imageRefs = [...readme.matchAll(/<img\s+[^>]*src="([^"]+)"/g)]
            .map((match) => match[1])
            .filter((src) => !src.startsWith("http"));

        expect(imageRefs).not.toEqual([]);

        for (const ref of imageRefs) {
            expect(existsSync(resolve(ROOT, ref)), ref).toBe(true);
        }
    });

    it("keeps relative markdown and image links backed by repo files", () => {
        const files = [
            "README.md",
            "CLAUDE.md",
            "AGENTS.md",
            "STANDARDS.md",
            ".github/copilot-instructions.md",
            ...markdownFiles("docs"),
        ];
        const brokenRefs: string[] = [];

        for (const file of files) {
            for (const ref of relativeDocRefs(doc(file))) {
                const targetPath = decodeURIComponent(ref.split("#")[0]);
                const target = resolve(ROOT, file.split("/").slice(0, -1).join("/"), targetPath);
                if (!existsSync(target)) {
                    brokenRefs.push(`${file} -> ${ref}`);
                }
            }
        }

        expect(brokenRefs).toEqual([]);
    });

    it("keeps code-spanned docs/*.md references backed by repo files", () => {
        const files = [
            "README.md",
            "CLAUDE.md",
            "AGENTS.md",
            "STANDARDS.md",
            ".github/copilot-instructions.md",
            ...markdownFiles("docs").filter((path) => path !== "docs/ROADMAP.md"),
        ];
        const brokenRefs: string[] = [];

        for (const file of files) {
            for (const ref of codeSpans(doc(file))) {
                if (!/^docs\/[A-Za-z0-9_./-]+\.md$/.test(ref)) continue;
                if (!existsSync(resolve(ROOT, ref))) {
                    brokenRefs.push(`${file} -> ${ref}`);
                }
            }
        }

        expect(brokenRefs).toEqual([]);
    });

    it("keeps audited docs free of known stale content claims", () => {
        const source = docs([
            "docs/GLOSSARY.md",
            "docs/JOURNEY.md",
            "docs/BRAND.md",
            "docs/agent-briefs/species-team.md",
            "docs/agent-briefs/region-team.md",
            "docs/build-time/MAP_AUTHORING.md",
        ]);

        expect(source).not.toContain("pipi_loje");
        expect(source).not.toContain("Prefix for bug species");
        expect(source).not.toContain("kala_suli");
        expect(source).not.toContain("kasi_pona");
        expect(source).not.toContain("soweli_lete");
        expect(source).not.toContain("src/game/content-loader.ts");
        expect(source).not.toContain("matching preview PNG");
        expect(source).not.toContain("author-shipped preview");
        expect(source).not.toContain("summing to 1.0");
        expect(source).not.toContain("gradient-by-threshold");
        expect(source).not.toContain("legacy warning");
        expect(source).not.toContain("docs/ASSET_PIPELINE.md");
    });

    it("keeps the documented full-browser test inventory aligned with Playwright files", () => {
        const source = doc("docs/STATE.md");

        expect(countSpecFiles("tests/e2e/full")).toBe(15);
        expect(source).toContain("27 full browser tests across 15 files");
        expect(source).not.toContain("27 full browser specs");
    });

    it("keeps UX selector docs aligned with the dialog component contract", () => {
        const ux = doc("docs/UX.md");
        const dialogComponent = doc("src/ui/RiversUiApp.tsx");

        expect(dialogComponent).toContain('data-testid={`dialog-choice-${index}`}');
        expect(ux).toContain('data-testid="dialog-choice-{n}"');
        expect(ux).not.toContain("`choice-{n}`");
    });

    it("keeps the visual-audit screenshot inventory aligned with committed PNGs", () => {
        const screenshotDir = "docs/screenshots/visual-audit";
        const readme = doc(`${screenshotDir}/README.md`);
        const pngFiles = readdirSync(resolve(ROOT, screenshotDir))
            .filter((file) => file.endsWith(".png"))
            .sort();
        const documentedFiles = [...readme.matchAll(/^\|\s*`([^`]+\.png)`\s*\|/gm)]
            .map((match) => match[1])
            .sort();

        expect(pngFiles).toEqual([
            "desktop-starter-map-canvas.png",
            "desktop-title-choices.png",
            "map-dreadpeak_cavern.png",
            "map-frostvale.png",
            "map-greenwood_road.png",
            "map-highridge_pass.png",
            "map-lakehaven.png",
            "map-rivergate_approach.png",
            "map-riverside_home.png",
            "mobile-pause-overlay.png",
            "mobile-starter-choice-dialog.png",
        ]);
        expect(documentedFiles).toEqual(pngFiles);
    });

    it("keeps visual-audit screenshots at the documented review dimensions", () => {
        const screenshotDir = "docs/screenshots/visual-audit";
        const desktopFiles = [
            "desktop-starter-map-canvas.png",
            "desktop-title-choices.png",
            "map-dreadpeak_cavern.png",
            "map-frostvale.png",
            "map-greenwood_road.png",
            "map-highridge_pass.png",
            "map-lakehaven.png",
            "map-rivergate_approach.png",
            "map-riverside_home.png",
        ];
        const mobileFiles = ["mobile-pause-overlay.png", "mobile-starter-choice-dialog.png"];

        for (const file of desktopFiles) {
            expect(pngDimensions(`${screenshotDir}/${file}`), file).toEqual({
                width: 1280,
                height: 720,
            });
        }
        for (const file of mobileFiles) {
            expect(pngDimensions(`${screenshotDir}/${file}`), file).toEqual({
                width: 390,
                height: 844,
            });
        }
    });

    it("keeps LORE species inventory synchronized with generated content", () => {
        const lore = doc("docs/LORE.md");
        const tableRows = [
            ...lore.matchAll(
                /^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|$/gm,
            ),
        ]
            .map((match) => ({
                id: match[1],
                name: match[2].trim(),
                type: match[3].trim(),
                tier: match[4].trim(),
                sprite: match[5].trim(),
            }))
            .sort((a, b) => a.id.localeCompare(b.id));
        const expectedRows = WORLD.species
            .map((species) => ({
                id: species.id,
                name: species.name.en,
                type: species.type,
                tier: species.sprite?.tier ?? "",
                sprite: species.sprite?.src?.replace(/^\//, "") ?? "",
            }))
            .sort((a, b) => a.id.localeCompare(b.id));

        expect(tableRows).toEqual(expectedRows);
    });
});
