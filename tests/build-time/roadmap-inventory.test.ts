import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type RoadmapCounts = {
    done: number;
    partial: number;
    open: number;
};

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ROADMAP = readFileSync(resolve(ROOT, "docs/ROADMAP.md"), "utf8");

function emptyCounts(): RoadmapCounts {
    return { done: 0, partial: 0, open: 0 };
}

function statusKind(cell: string): keyof RoadmapCounts | null {
    if (cell.startsWith("✅")) return "done";
    if (cell.startsWith("🟡")) return "partial";
    if (cell.startsWith("⬜")) return "open";
    return null;
}

function columns(line: string): string[] {
    return line
        .split("|")
        .slice(1, -1)
        .map((column) => column.trim());
}

function parsePhaseInventory(): Map<string, RoadmapCounts> {
    const inventory = new Map<string, RoadmapCounts>();

    for (const line of ROADMAP.split("\n")) {
        const row = columns(line);
        if (!/^\d+$/.test(row[0] ?? "")) continue;
        const [, phase, , done, partial, open] = row;
        if (!phase || done === undefined || partial === undefined || open === undefined) continue;

        inventory.set(row[0], {
            done: Number(done),
            partial: Number(partial),
            open: Number(open),
        });
    }

    return inventory;
}

function parseTaskRows() {
    const phaseCounts = new Map<string, RoadmapCounts>();
    const ids: string[] = [];
    const invalidRows: string[] = [];

    for (const line of ROADMAP.split("\n")) {
        const row = columns(line);
        const id = row[0] ?? "";
        if (!/^(T\d+-\d+|V5-\d+)$/.test(id)) continue;

        ids.push(id);

        const kind = statusKind(row[2] ?? "");
        if (!kind) {
            invalidRows.push(line);
            continue;
        }

        if (id.startsWith("V5-")) continue;

        const phase = id.match(/^T(\d+)-/)?.[1];
        if (!phase) continue;

        const counts = phaseCounts.get(phase) ?? emptyCounts();
        counts[kind] += 1;
        phaseCounts.set(phase, counts);
    }

    return { phaseCounts, ids, invalidRows };
}

function rowFileRefs(row: string): string[] {
    return [...row.matchAll(/`([^`]+)`/g)]
        .map((match) => match[1].trim())
        .filter((ref) => {
            if (
                !/^(src|tests|scripts|docs|public|tools|\.github|package\.json|vite\.config|playwright\.config|vitest\.config|tsconfig)/.test(
                    ref,
                )
            ) {
                return false;
            }
            return !/[<>{}*?$]|\.\.\./.test(ref);
        });
}

function fileRefExists(ref: string): boolean {
    return existsSync(resolve(ROOT, ref)) || existsSync(resolve(ROOT, ".github/workflows", ref));
}

describe("ROADMAP inventory integrity", () => {
    it("keeps stable task IDs unique", () => {
        const { ids } = parseTaskRows();
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

        expect(duplicates).toEqual([]);
    });

    it("keeps every task row on a known status marker", () => {
        const { invalidRows } = parseTaskRows();

        expect(invalidRows).toEqual([]);
    });

    it("keeps the phase inventory counts synchronized with task rows", () => {
        const inventory = parsePhaseInventory();
        const { phaseCounts } = parseTaskRows();

        expect([...inventory.keys()]).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);

        for (const [phase, expected] of inventory) {
            expect(phaseCounts.get(phase) ?? emptyCounts(), `Phase ${phase}`).toEqual(expected);
        }
    });

    it("keeps completed task file references real unless the row documents removal", () => {
        const missingRefs: string[] = [];
        const allowedMissing = new Set([
            // T5-06 documents the retired virtual-dpad implementation.
            "src/modules/main/virtual-dpad.ts",
            // Appendix item documents the completed directory-barrel rename.
            "src/modules/main/index.ts",
        ]);

        for (const line of ROADMAP.split("\n")) {
            const row = columns(line);
            const id = row[0] ?? "";
            if (!/^(T\d+-\d+|V5-\d+)$/.test(id)) continue;
            if (!statusKind(row[2] ?? "") || statusKind(row[2] ?? "") !== "done") continue;

            for (const ref of rowFileRefs(line)) {
                if (allowedMissing.has(ref)) continue;
                if (!fileRefExists(ref)) {
                    missingRefs.push(`${id} -> ${ref}`);
                }
            }
        }

        expect(missingRefs).toEqual([]);
    });
});
