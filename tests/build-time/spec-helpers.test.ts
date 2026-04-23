import { describe, expect, it } from "vitest";
import {
    edgeTransitionTiles,
    paintEdgeTransitions,
    paintNeighborBuffer,
} from "../../scripts/map-authoring/lib/spec-helpers";

describe("paintEdgeTransitions", () => {
    it("paints cardinal edge transitions from a snapshot of the source grid", () => {
        const grid = [
            ["g", "g", "g", "g"],
            ["g", "d", "g", "g"],
            ["g", "g", "g", "g"],
        ];

        paintEdgeTransitions(grid, {
            base: "g",
            neighbors: "d",
            transitions: edgeTransitionTiles("gd"),
        });

        expect(grid).toEqual([
            ["g", "gd_s", "g", "g"],
            ["gd_e", "d", "gd_w", "g"],
            ["g", "gd_n", "g", "g"],
        ]);
    });

    it("paints corner transitions only when two cardinal neighbors meet", () => {
        const grid = [
            ["d", "d", "g"],
            ["d", "g", "g"],
            ["g", "g", "g"],
        ];

        paintEdgeTransitions(grid, {
            base: "g",
            neighbors: "d",
            transitions: edgeTransitionTiles("gd"),
        });

        expect(grid[1][1]).toBe("gd_nw");
    });
});

describe("paintNeighborBuffer", () => {
    it("paints a one-tile buffer from a snapshot of the source grid", () => {
        const grid = [
            ["w", "w", "w", "w"],
            ["w", "d", "w", "w"],
            ["w", "w", "w", "w"],
        ];

        paintNeighborBuffer(grid, {
            base: "w",
            neighbors: "d",
            buffer: "s",
        });

        expect(grid).toEqual([
            ["w", "s", "w", "w"],
            ["s", "d", "s", "w"],
            ["w", "s", "w", "w"],
        ]);
    });

    it("does not cascade from newly-painted buffer cells", () => {
        const grid = [["d", "w", "w"]];

        paintNeighborBuffer(grid, {
            base: "w",
            neighbors: "d",
            buffer: "s",
        });

        expect(grid).toEqual([["d", "s", "w"]]);
    });
});
