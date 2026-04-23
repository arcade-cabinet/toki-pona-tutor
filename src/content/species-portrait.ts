export type SpeciesAnimationStrip = {
    row?: number;
    col_start?: number;
    cols?: number;
};

export type SpeciesPortraitSource = {
    portrait_src?: string;
    sprite?: {
        src?: string;
        animations?: Record<string, SpeciesAnimationStrip>;
    };
};

export type SpeciesPortraitFrame = {
    src: string;
    framesWidth: number;
    framesHeight: number;
    frameX: number;
    frameY: number;
};

export function resolveSpeciesPortraitFrame(
    species: SpeciesPortraitSource | null | undefined,
): SpeciesPortraitFrame | null {
    const sprite = species?.sprite;
    if (!sprite?.src) {
        return species?.portrait_src
            ? {
                  src: species.portrait_src,
                  framesWidth: 1,
                  framesHeight: 1,
                  frameX: 0,
                  frameY: 0,
              }
            : null;
    }

    const animations = sprite.animations ?? {};
    const strips = Object.entries(animations);
    const fallbackStrip = strips[0]?.[1] ?? {};
    const idleStrip =
        animations.idle ??
        animations.idle_down ??
        strips.find(([name]) => name.startsWith("idle"))?.[1] ??
        fallbackStrip;
    const framesWidth = Math.max(
        1,
        ...Object.values(animations).map((strip) => (strip.col_start ?? 0) + (strip.cols ?? 1)),
    );
    const framesHeight = Math.max(
        1,
        ...Object.values(animations).map((strip) => (strip.row ?? 0) + 1),
    );

    return {
        src: sprite.src,
        framesWidth,
        framesHeight,
        frameX: idleStrip.col_start ?? 0,
        frameY: idleStrip.row ?? 0,
    };
}
