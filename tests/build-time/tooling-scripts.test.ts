import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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
});
