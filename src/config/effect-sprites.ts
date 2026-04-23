import {
    EFFECT_SPRITESHEET_CONFIGS,
    type RuntimeEffectAnimation,
    type RuntimeEffectSpritesheetConfig,
} from "../content/gameplay";

/** A single registered effect spritesheet entry. */
interface EffectSheet {
    id: string;
    image: string;
    framesWidth: number;
    framesHeight: number;
    animations: Record<string, RuntimeEffectAnimation>;
    textures?: Record<
        string,
        { animations: Array<Array<{ time: number; frameX: number; frameY: number }>> }
    >;
}

function withIdleFallback(sheet: EffectSheet): EffectSheet {
    const fallback =
        sheet.animations.idle ??
        sheet.animations.default ??
        sheet.animations.play ??
        Object.values(sheet.animations)[0];

    if (!fallback) return sheet;

    return {
        ...sheet,
        animations: {
            default: fallback,
            idle: fallback,
            stand: fallback,
            ...sheet.animations,
        },
        textures: animationTextures(
            {
                default: fallback,
                idle: fallback,
                stand: fallback,
                ...sheet.animations,
            },
            sheet.framesWidth,
        ),
    };
}

function animationTextures(
    animations: Record<string, RuntimeEffectAnimation>,
    framesWidth: number,
): NonNullable<EffectSheet["textures"]> {
    return Object.fromEntries(
        Object.entries(animations).map(([name, animation]) => [
            name,
            { animations: [textureFrames(animation, framesWidth)] },
        ]),
    );
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

function effectSheet(config: RuntimeEffectSpritesheetConfig): EffectSheet {
    return {
        id: config.id,
        image: config.image,
        framesWidth: config.framesWidth,
        framesHeight: config.framesHeight,
        animations: config.animations,
    };
}

export const effectSpritesheets: EffectSheet[] =
    EFFECT_SPRITESHEET_CONFIGS.map(effectSheet).map(withIdleFallback);
