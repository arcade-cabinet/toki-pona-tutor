import { Animation, Direction } from "@rpgjs/common";
import {
    PLAYER_SPRITESHEET_CONFIGS,
    spriteLayout,
    type RuntimeSpritesheetConfig,
} from "src/content/gameplay";
import { standFrames, walkFrames, type SpritesheetFrame } from "src/config/sprite-layout";

type PlayerTextureKey = "idle" | Animation;
type SpritesheetTexture = {
    animations: (args: { direction: Direction }) => Array<SpritesheetFrame[]>;
};

type PlayerSpritesheetEntry = {
    id: string;
    image: string;
    textures: Record<PlayerTextureKey, SpritesheetTexture>;
    framesWidth: number;
    framesHeight: number;
};

function playerSheet(config: RuntimeSpritesheetConfig): PlayerSpritesheetEntry {
    const layout = spriteLayout(config.layoutId);
    const attackSpeed = layout.attackSpeed ?? layout.walkSpeed;
    return {
        id: config.id,
        image: config.image,
        textures: {
            idle: {
                animations: ({ direction }) => [standFrames(layout, direction)],
            },
            [Animation.Stand]: {
                animations: ({ direction }) => [standFrames(layout, direction)],
            },
            [Animation.Walk]: {
                animations: ({ direction }) => [walkFrames(layout, direction)],
            },
            [Animation.Attack]: {
                animations: ({ direction }) => [walkFrames(layout, direction, attackSpeed)],
            },
            [Animation.Defense]: {
                animations: ({ direction }) => [standFrames(layout, direction)],
            },
            [Animation.Skill]: {
                animations: ({ direction }) => [walkFrames(layout, direction, attackSpeed)],
            },
        },
        framesWidth: layout.framesWidth,
        framesHeight: layout.framesHeight,
    };
}

export const PLAYER_SPRITESHEETS: PlayerSpritesheetEntry[] =
    PLAYER_SPRITESHEET_CONFIGS.map(playerSheet);
