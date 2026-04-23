import worldRaw from "../content/generated/world.json";
import { Animation, Direction } from "@rpgjs/common";

type AnimationStrip = {
    src?: string;
    row: number;
    col_start: number;
    cols: number;
    fps: number;
};

type SpeciesSprite = {
    src: string;
    animations: Record<string, AnimationStrip>;
};

type SpeciesEntry = {
    id: string;
    sprite?: SpeciesSprite;
};

type ContentWorld = {
    species: SpeciesEntry[];
};

export type CreatureSpritesheetEntry = {
    id: string;
    image: string;
    framesWidth: number;
    framesHeight: number;
    animations: Record<string, { frames: number[]; duration: number }>;
    textures: Record<
        string,
        {
            animations: (args?: { direction?: Direction }) => Array<
                Array<{
                    time?: number;
                    frameX?: number;
                    frameY?: number;
                }>
            >;
        }
    >;
};

const world = worldRaw as unknown as ContentWorld;

export const CREATURE_SPRITESHEETS = world.species
    .map(creatureSheetForSpecies)
    .filter((sheet): sheet is CreatureSpritesheetEntry => sheet !== null);

export function creatureSpriteId(speciesId: string): string {
    return `species_${speciesId}`;
}

function creatureSheetForSpecies(species: SpeciesEntry): CreatureSpritesheetEntry | null {
    if (!species.sprite) return null;
    const { sprite } = species;
    const primaryStrips = Object.fromEntries(
        Object.entries(sprite.animations).filter(
            ([, strip]) => !strip.src || strip.src === sprite.src,
        ),
    );
    const fallbackIdle = selectAnimation(primaryStrips, ["idle", "idle_down", "walk", "walk_down"]);
    if (!fallbackIdle) return null;

    const framesWidth = Math.max(
        1,
        ...Object.values(primaryStrips).map((strip) => strip.col_start + strip.cols),
    );
    const framesHeight = Math.max(1, ...Object.values(primaryStrips).map((strip) => strip.row + 1));
    const authoredAnimations = Object.fromEntries(
        Object.entries(primaryStrips).map(([name, strip]) => [
            name,
            stripAnimation(strip, framesWidth),
        ]),
    );
    const animations = {
        default: authoredAnimations[fallbackIdle],
        idle: authoredAnimations[fallbackIdle],
        stand: authoredAnimations[fallbackIdle],
        ...authoredAnimations,
    };
    const animationAliases = buildAnimationAliases(primaryStrips, fallbackIdle);

    return {
        id: creatureSpriteId(species.id),
        image: sprite.src.replace(/^\//, ""),
        framesWidth,
        framesHeight,
        animations,
        textures: animationTextures(animations, framesWidth, animationAliases),
    };
}

function stripAnimation(
    strip: AnimationStrip,
    framesWidth: number,
): { frames: number[]; duration: number } {
    const frames = Array.from(
        { length: strip.cols },
        (_, index) => strip.row * framesWidth + strip.col_start + index,
    );
    return {
        frames,
        duration: Math.max(1, Math.round((strip.cols / Math.max(1, strip.fps)) * 1000)),
    };
}

function animationTextures(
    animations: Record<string, { frames: number[]; duration: number }>,
    framesWidth: number,
    aliases: Record<string, string | Partial<Record<Direction, string>>>,
): CreatureSpritesheetEntry["textures"] {
    return Object.fromEntries(
        Object.entries(aliases).map(([name, alias]) => [
            name,
            {
                animations: (args?: { direction?: Direction }) => {
                    const animationName = resolveAnimationAlias(alias, args?.direction);
                    const animation = animations[animationName] ?? animations.default;
                    return [textureFrames(animation, framesWidth)];
                },
            },
        ]),
    );
}

function textureFrames(
    animation: { frames: number[]; duration: number },
    framesWidth: number,
): Array<{ time?: number; frameX?: number; frameY?: number }> {
    const frameDuration = Math.max(
        1,
        Math.round(animation.duration / Math.max(1, animation.frames.length)),
    );
    const frames = animation.frames.map((frame, index) => ({
        time: frameDuration * index,
        frameX: frame % framesWidth,
        frameY: Math.floor(frame / framesWidth),
    }));
    return [...frames, { time: frameDuration * frames.length }];
}

function selectAnimation(
    animations: Record<string, AnimationStrip>,
    preferred: string[],
): string | null {
    for (const name of preferred) {
        if (animations[name]) return name;
    }
    return Object.keys(animations)[0] ?? null;
}

function buildAnimationAliases(
    strips: Record<string, AnimationStrip>,
    fallbackIdle: string,
): Record<string, string | Partial<Record<Direction, string>>> {
    const fallbackWalk =
        selectAnimation(strips, ["walk", "walk_down", fallbackIdle]) ?? fallbackIdle;
    const fallbackAttack =
        selectAnimation(strips, ["attack", "special", "taunt", fallbackIdle]) ?? fallbackIdle;
    const fallbackHurt =
        selectAnimation(strips, ["hurt", "defend", "death", fallbackIdle]) ?? fallbackIdle;
    const fallbackDeath = selectAnimation(strips, ["death", "hurt", fallbackIdle]) ?? fallbackIdle;
    const aliases: Record<string, string | Partial<Record<Direction, string>>> = Object.fromEntries(
        Object.keys(strips).map((name) => [name, name]),
    );
    aliases.default = fallbackIdle;
    aliases.idle = directionalAlias(strips, "idle", fallbackIdle);
    aliases[Animation.Stand] = directionalAlias(strips, "idle", fallbackIdle);
    aliases[Animation.Walk] = directionalAlias(strips, "walk", fallbackWalk);
    aliases[Animation.Attack] = fallbackAttack;
    aliases[Animation.Skill] = fallbackAttack;
    aliases[Animation.Defense] = fallbackHurt;
    aliases.hurt = fallbackHurt;
    aliases.death = fallbackDeath;
    return aliases;
}

function directionalAlias(
    strips: Record<string, AnimationStrip>,
    prefix: string,
    fallback: string,
): Partial<Record<Direction, string>> | string {
    const directional: Partial<Record<Direction, string>> = {
        [Direction.Up]: strips[`${prefix}_up`] ? `${prefix}_up` : undefined,
        [Direction.Left]: strips[`${prefix}_left`] ? `${prefix}_left` : undefined,
        [Direction.Down]: strips[`${prefix}_down`] ? `${prefix}_down` : undefined,
        [Direction.Right]: strips[`${prefix}_right`] ? `${prefix}_right` : undefined,
    };
    if (Object.values(directional).some(Boolean)) {
        return directional;
    }
    return fallback;
}

function resolveAnimationAlias(
    alias: string | Partial<Record<Direction, string>>,
    direction?: Direction,
): string {
    if (typeof alias === "string") return alias;
    return (
        alias[direction ?? Direction.Down] ??
        alias[Direction.Down] ??
        Object.values(alias).find((name): name is string => typeof name === "string") ??
        "default"
    );
}
