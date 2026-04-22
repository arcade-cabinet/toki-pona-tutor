import { describe, expect, it, vi } from "vitest";
import type { RpgClientEngine } from "@rpgjs/client";
import { Direction } from "@rpgjs/common";
import {
    getInteractionHintForPlayer,
    triggerInteractionHint,
} from "../../src/config/interaction-hint";

type MockMap = {
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    getTileByPosition: () => { hasCollision: boolean };
    getAllObjects: () => Array<Record<string, unknown>>;
};

type MockPlayer = {
    x(): number;
    y(): number;
};

type MockEngine = RpgClientEngine & {
    getCurrentPlayer(): MockPlayer;
};

function createMap(overrides: Partial<MockMap> = {}): MockMap {
    return {
        width: 16,
        height: 12,
        tilewidth: 16,
        tileheight: 16,
        getTileByPosition: () => ({ hasCollision: false }),
        getAllObjects: () => [],
        ...overrides,
    };
}

function createEngine(options: {
    player?: MockPlayer;
    events?: Record<string, { x(): number; y(): number }>;
    map?: MockMap;
}) {
    const processAction = vi.fn();
    const processInput = vi.fn();

    const player = options.player ?? {
        x: () => 128,
        y: () => 128,
    };
    const map = options.map ?? createMap();
    const events = options.events ?? {};

    const engine = {
        scene: {
            data: () => ({ tiled: map }),
        },
        sceneMap: {
            events: () => events,
        },
        getCurrentPlayer: () => player,
        processAction,
        processInput,
    };

    return {
        engine: engine as unknown as MockEngine,
        processAction,
        processInput,
    };
}

describe("interaction hint detection", () => {
    it("returns toki for a talkable npc within the mobile landing tolerance", () => {
        const { engine } = createEngine({
            player: {
                x: () => 160,
                y: () => 128,
            },
            events: {
                "jan-sewi": {
                    x: () => 160,
                    y: () => 96,
                },
            },
        });

        expect(getInteractionHintForPlayer(engine, engine.getCurrentPlayer())).toEqual({
            glyph: "toki",
            targetId: "jan-sewi",
            interaction: { kind: "action" },
        });
    });

    it("returns utala for a gym-leader event in range", () => {
        const { engine } = createEngine({
            player: {
                x: () => 160,
                y: () => 128,
            },
            events: {
                "jan-wawa": {
                    x: () => 160,
                    y: () => 96,
                },
            },
        });

        expect(getInteractionHintForPlayer(engine, engine.getCurrentPlayer())).toEqual({
            glyph: "utala",
            targetId: "jan-wawa",
            interaction: { kind: "action" },
        });
    });

    it("does not surface a dead touch hint when already standing on a warp tile", () => {
        const { engine } = createEngine({
            player: {
                x: () => 240,
                y: () => 80,
            },
            events: {
                warp_east: {
                    x: () => 240,
                    y: () => 80,
                },
            },
        });

        expect(getInteractionHintForPlayer(engine, engine.getCurrentPlayer())).toBeNull();
    });

    it("returns alasa for an encounter object adjacent to the player", () => {
        const { engine } = createEngine({
            player: {
                x: () => 144,
                y: () => 96,
            },
            map: createMap({
                getAllObjects: () => [
                    {
                        name: "encounter_test",
                        type: "Encounter",
                        x: 160,
                        y: 96,
                        width: 16,
                        height: 16,
                    },
                ],
            }),
        });

        expect(getInteractionHintForPlayer(engine, engine.getCurrentPlayer())).toEqual({
            glyph: "alasa",
            targetId: "encounter_test",
            interaction: { kind: "touch", direction: Direction.Right },
        });
    });

    it("chooses the nearest aligned interactable target", () => {
        const { engine } = createEngine({
            player: {
                x: () => 144,
                y: () => 128,
            },
            events: {
                "jan-far": {
                    x: () => 144,
                    y: () => 64,
                },
                "jan-near": {
                    x: () => 144,
                    y: () => 96,
                },
            },
        });

        expect(getInteractionHintForPlayer(engine, engine.getCurrentPlayer())).toEqual({
            glyph: "toki",
            targetId: "jan-near",
            interaction: { kind: "action" },
        });
    });

    it("ignores diagonal events when choosing front-facing targets", () => {
        const { engine } = createEngine({
            player: {
                x: () => 144,
                y: () => 128,
            },
            events: {
                "jan-diagonal": {
                    x: () => 160,
                    y: () => 96,
                },
            },
        });

        expect(getInteractionHintForPlayer(engine, engine.getCurrentPlayer())).toBeNull();
    });
});

describe("interaction hint triggering", () => {
    it("routes action hints through processAction", () => {
        const { engine, processAction, processInput } = createEngine({});

        const handled = triggerInteractionHint(engine, {
            glyph: "toki",
            targetId: "jan-sewi",
            interaction: { kind: "action" },
        });

        expect(handled).toBe(true);
        expect(processAction).toHaveBeenCalledWith({ action: "action" });
        expect(processInput).not.toHaveBeenCalled();
    });

    it("routes touch hints through processInput when a direction exists", () => {
        const { engine, processAction, processInput } = createEngine({});

        const handled = triggerInteractionHint(engine, {
            glyph: "tawa",
            targetId: "warp_east",
            interaction: { kind: "touch", direction: Direction.Right },
        });

        expect(handled).toBe(true);
        expect(processInput).toHaveBeenCalledWith({ input: Direction.Right });
        expect(processAction).not.toHaveBeenCalled();
    });

    it("returns false for touch hints without a usable direction", () => {
        const { engine, processAction, processInput } = createEngine({});

        const handled = triggerInteractionHint(engine, {
            glyph: "tawa",
            targetId: "warp_east",
            interaction: { kind: "touch", direction: null },
        });

        expect(handled).toBe(false);
        expect(processInput).not.toHaveBeenCalled();
        expect(processAction).not.toHaveBeenCalled();
    });
});
