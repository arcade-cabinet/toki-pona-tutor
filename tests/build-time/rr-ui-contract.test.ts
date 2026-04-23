import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string): string {
    return readFileSync(join(root, path), "utf8");
}

function filesUnder(path: string): string[] {
    const absolute = join(root, path);
    return readdirSync(absolute).flatMap((entry) => {
        const child = join(absolute, entry);
        const relative = join(path, entry);
        if (statSync(child).isDirectory()) return filesUnder(relative);
        return [relative];
    });
}

describe("rr-ui visual contract", () => {
    it("keeps player-facing UI and browser tests off RPG.js chrome selectors", () => {
        const scannedFiles = [
            ...filesUnder("src/config").filter((file) => file.endsWith(".ce") || file.endsWith(".ts")),
            ...filesUnder("src/ui").filter((file) => /\.(css|ts|tsx)$/.test(file)),
            ...filesUnder("tests/e2e").filter((file) => /\.(ts|tsx)$/.test(file)),
            "src/styles/brand.css",
            "src/content/gameplay/visuals.json",
        ];

        const offenders = scannedFiles.filter((file) => read(file).includes("rpg-ui-"));
        expect(offenders).toEqual([]);
    });

    it("defines the Fantasy Field Kit token and icon surface", () => {
        const tokens = read("src/ui/styles/rr-tokens.css");
        for (const token of [
            "--rr-vellum",
            "--rr-parchment",
            "--rr-ink",
            "--rr-river",
            "--rr-forest",
            "--rr-brass",
            "--rr-gold",
            "--rr-umber",
            "--rr-danger",
            "--rr-ice",
        ]) {
            expect(tokens).toContain(token);
        }

        const icons = read("src/ui/icons.tsx");
        for (const icon of [
            "RiverKnotIcon",
            "CompassRoseIcon",
            "ClueMarkIcon",
            "RouteIcon",
            "PanelCornerSvg",
            "RiversSvgFilters",
        ]) {
            expect(icons).toContain(`function ${icon}`);
        }
    });
});
