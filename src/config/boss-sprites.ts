import {
    BOSS_SPRITESHEET_CONFIGS,
    type RuntimeEffectAnimation,
    type RuntimeEffectSpritesheetConfig,
} from "../content/gameplay";

interface BossSheet {
    id: string;
    image: string;
    framesWidth: number;
    framesHeight: number;
    animations: Record<string, RuntimeEffectAnimation>;
    textures: Record<
        string,
        { animations: Array<Array<{ time: number; frameX: number; frameY: number }>> }
    >;
}

function textureFrames(
    animation: RuntimeEffectAnimation,
    framesWidth: number,
): Array<{ time: number; frameX: number; frameY: number }> {
    const frameDuration = Math.max(
        1,
        Math.round(animation.duration / Math.max(1, animation.frames.length)),
    );
    return animation.frames.map((frame, index) => ({
        time: frameDuration * index,
        frameX: frame % framesWidth,
        frameY: Math.floor(frame / framesWidth),
    }));
}

function bossSheet(config: RuntimeEffectSpritesheetConfig): BossSheet {
    const textures = Object.fromEntries(
        Object.entries(config.animations).map(([name, animation]) => [
            name,
            { animations: [textureFrames(animation, config.framesWidth)] },
        ]),
    );
    return {
        id: config.id,
        image: config.image,
        framesWidth: config.framesWidth,
        framesHeight: config.framesHeight,
        animations: config.animations,
        textures,
    };
}

export const bossSpritesheets: BossSheet[] = BOSS_SPRITESHEET_CONFIGS.map(bossSheet);
