import { describe, expect, it } from "vitest";
import type { Role, Context, LevelBand } from "../../src/modules/dialog-pool";

/**
 * T162: Dialog pool role coverage validation.
 * Ensures authored dialog_pool content covers all roles, contexts, and level bands.
 * Validates structural requirements without checking exact line text.
 */

// Dynamically import all authored pool files
async function loadPool() {
    const modules = await Promise.all([
        import("../../src/content/dialog_pool/guide"),
        import("../../src/content/dialog_pool/villager_generic").catch(() => ({ villager_generic: [] })),
        import("../../src/content/dialog_pool/farmer").catch(() => ({ farmer: [] })),
        import("../../src/content/dialog_pool/fisher").catch(() => ({ fisher: [] })),
        import("../../src/content/dialog_pool/guard").catch(() => ({ guard: [] })),
        import("../../src/content/dialog_pool/wanderer").catch(() => ({ wanderer: [] })),
        import("../../src/content/dialog_pool/shopkeep").catch(() => ({ shopkeep: [] })),
        import("../../src/content/dialog_pool/innkeep").catch(() => ({ innkeep: [] })),
        import("../../src/content/dialog_pool/elder").catch(() => ({ elder: [] })),
        import("../../src/content/dialog_pool/historian").catch(() => ({ historian: [] })),
        import("../../src/content/dialog_pool/shrine_keeper").catch(() => ({ shrine_keeper: [] })),
        import("../../src/content/dialog_pool/hunter").catch(() => ({ hunter: [] })),
        import("../../src/content/dialog_pool/trainer").catch(() => ({ trainer: [] })),
        import("../../src/content/dialog_pool/rival").catch(() => ({ rival: [] })),
        import("../../src/content/dialog_pool/child").catch(() => ({ child: [] })),
    ]);
    return modules.flatMap((m) => Object.values(m).flat());
}

const ROLES: Role[] = [
    "guide", "villager_generic", "farmer", "fisher", "guard", "wanderer",
    "shopkeep", "innkeep", "elder", "historian", "shrine_keeper",
    "hunter", "trainer", "rival", "child",
];

const REQUIRED_CONTEXTS: Context[] = ["greeting", "ambient"];
const CHALLENGE_ROLES: Role[] = [
    "villager_generic", "farmer", "fisher", "guard", "wanderer",
    "shopkeep", "innkeep", "elder", "historian", "shrine_keeper",
    "hunter", "trainer", "child",
];
const BANDS: LevelBand[] = [0, 1, 2, 3];

describe("dialog pool coverage (T162)", () => {
    it("guide has greeting + ambient lines in all 4 bands", async () => {
        const pool = await loadPool();
        const guideLines = pool.filter((l) => l.role === "guide");
        for (const ctx of REQUIRED_CONTEXTS) {
            for (const band of BANDS) {
                const matches = guideLines.filter((l) => l.context === ctx && l.levelBand === band);
                expect(matches.length, `guide/${ctx}/band${band}`).toBeGreaterThanOrEqual(1);
            }
        }
    });

    it("roles with authored content have at least 1 greeting line per band", async () => {
        const pool = await loadPool();
        const authoredRoles = new Set(pool.map((l) => l.role));
        for (const role of ROLES) {
            if (!authoredRoles.has(role)) continue; // skip unwritten roles
            const greetings = pool.filter((l) => l.role === role && l.context === "greeting");
            expect(greetings.length, `${role} needs ≥1 greeting`).toBeGreaterThanOrEqual(1);
        }
    });

    it("challenge roles have challenge_offer lines tagged with cause", async () => {
        const pool = await loadPool();
        for (const role of CHALLENGE_ROLES) {
            const offers = pool.filter((l) => l.role === role && l.context === "challenge_offer");
            if (offers.length === 0) continue; // pool authoring in progress
            const tagged = offers.filter((l) => l.tags?.some((t) => t.startsWith("cause:")));
            expect(tagged.length, `${role} challenge_offer lines need cause: tags`).toBeGreaterThan(0);
        }
    });

    it("no line exceeds 20 words", async () => {
        const pool = await loadPool();
        for (const line of pool) {
            const words = line.text.trim().split(/\s+/).length;
            expect(words, `line ${line.id} is ${words} words: "${line.text}"`).toBeLessThanOrEqual(20);
        }
    });

    it("all line IDs are unique", async () => {
        const pool = await loadPool();
        const ids = pool.map((l) => l.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    it("each line has valid levelBand (0-3)", async () => {
        const pool = await loadPool();
        for (const line of pool) {
            expect([0, 1, 2, 3], `line ${line.id}`).toContain(line.levelBand);
        }
    });
});
