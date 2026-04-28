import { describe, expect, it } from "vitest";
import { item, itemKind } from "../../src/content/schema/item";
import capturePoddRaw from "../../src/content/spine/items/capture_pod.json";
import heavyCapturePoddRaw from "../../src/content/spine/items/heavy_capture_pod.json";
import springTonicRaw from "../../src/content/spine/items/spring_tonic.json";
import orchardFruitRaw from "../../src/content/spine/items/orchard_fruit.json";

/**
 * T133: Item schema v2 — kinds match ECONOMY.md; capture via flag not kind.
 */

describe("itemKind", () => {
    it("accepts all v2 kinds", () => {
        for (const kind of ["capture_pod", "potion", "gear", "material", "key"] as const) {
            expect(() => itemKind.parse(kind)).not.toThrow();
        }
    });

    it("rejects retired v1 kinds", () => {
        expect(() => itemKind.parse("poki")).toThrow();
        expect(() => itemKind.parse("heal")).toThrow();
        expect(() => itemKind.parse("flavor")).toThrow();
    });
});

describe("item schema", () => {
    it("capture_pod.json parses correctly", () => {
        const parsed = item.parse(capturePoddRaw);
        expect(parsed.kind).toBe("capture_pod");
        expect(parsed.capture).toBe(true);
        expect(parsed.tier).toBeGreaterThanOrEqual(1);
    });

    it("heavy_capture_pod.json parses correctly", () => {
        const parsed = item.parse(heavyCapturePoddRaw);
        expect(parsed.kind).toBe("capture_pod");
        expect(parsed.capture).toBe(true);
        expect(parsed.tier).toBeGreaterThanOrEqual(1);
    });

    it("spring_tonic.json parses correctly", () => {
        const parsed = item.parse(springTonicRaw);
        expect(parsed.kind).toBe("potion");
        expect(parsed.capture).toBeUndefined();
    });

    it("orchard_fruit.json parses correctly", () => {
        const parsed = item.parse(orchardFruitRaw);
        expect(parsed.kind).toBe("potion");
    });

    it("item without capture flag is not a capture item", () => {
        const parsed = item.parse(springTonicRaw);
        expect(parsed.capture).not.toBe(true);
    });

    it("tier is required and in [1, 10]", () => {
        expect(() =>
            item.parse({ id: "test_item", name: { en: "Test" }, description: { en: "Desc" }, kind: "potion" }),
        ).toThrow(); // missing tier

        expect(() =>
            item.parse({
                id: "test_item",
                name: { en: "Test" },
                description: { en: "Desc" },
                kind: "potion",
                tier: 0,
            }),
        ).toThrow(); // tier below minimum

        const valid = item.parse({
            id: "test_item",
            name: { en: "Test" },
            description: { en: "Desc" },
            kind: "potion",
            tier: 3,
            value: 10,
        });
        expect(valid.tier).toBe(3);
    });
});
