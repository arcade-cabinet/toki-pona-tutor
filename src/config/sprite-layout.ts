import { Direction } from "@rpgjs/common";
import type { RuntimeSpriteDirectionName, RuntimeSpriteLayoutConfig } from "../content/gameplay";

export type SpritesheetFrame = {
    time?: number;
    frameX?: number;
    frameY?: number;
};

const directionNameByRpgDirection: Record<Direction, RuntimeSpriteDirectionName> = {
    [Direction.Down]: "down",
    [Direction.Left]: "left",
    [Direction.Right]: "right",
    [Direction.Up]: "up",
};

export function standFrames(
    layout: RuntimeSpriteLayoutConfig,
    direction: Direction,
): SpritesheetFrame[] {
    const directionName = directionNameByRpgDirection[direction] ?? "down";
    return [
        {
            time: 0,
            frameX: layout.standFrameX,
            frameY: layout.standRows[directionName] ?? layout.standRows.down,
        },
    ];
}

export function walkFrames(
    layout: RuntimeSpriteLayoutConfig,
    direction: Direction,
    speed = layout.walkSpeed,
): SpritesheetFrame[] {
    const directionName = directionNameByRpgDirection[direction] ?? "down";
    return rowFrames(
        layout.walkRows[directionName] ?? layout.walkRows.down,
        layout.walkFrameCount,
        speed,
    );
}

export function actionFrames(row: number, speed: number, frameCount: number): SpritesheetFrame[] {
    return rowFrames(row, frameCount, speed);
}

function rowFrames(frameY: number, frameCount: number, speed: number): SpritesheetFrame[] {
    const frames = Array.from({ length: frameCount }, (_, frameX) => ({
        time: speed * frameX,
        frameX,
        frameY,
    }));
    return [...frames, { time: speed * frameCount }];
}
