import worldRaw from "../content/generated/world.json";
import { HUD_STATUS_CONFIG } from "../content/gameplay";
import { formatGameplayTemplate } from "../content/gameplay/templates";
import {
    resolveSpeciesPortraitFrame,
    type SpeciesAnimationStrip,
    type SpeciesPortraitFrame,
} from "../content/species-portrait";
import { hpClassFor, hpRatio, type HpClass } from "../styles/hp-bar";

type SpeciesName = {
    en?: string;
    tp?: string;
};

type SpeciesEntry = {
    id: string;
    name?: SpeciesName;
    portrait_src?: string;
    sprite?: {
        src?: string;
        animations?: Record<string, SpeciesAnimationStrip>;
    };
};

type ContentWorld = {
    species: SpeciesEntry[];
};

export type HudLeadStatusInput = {
    speciesId: string;
    level: number;
    masteredWordCount: number;
    currentHp: number;
    maxHp: number;
};

export type HudLeadStatus = {
    speciesId: string;
    primaryLabel: string;
    secondaryLabel: string | null;
    portraitSrc: string | null;
    portraitFrame: SpeciesPortraitFrame | null;
    portraitFallback: string;
    levelLabel: string;
    masteredLabel: string;
    hpLabel: string;
    hpPercent: number;
    hpClass: HpClass;
};

function assertContentWorld(raw: unknown): ContentWorld {
    if (
        raw == null ||
        typeof raw !== "object" ||
        !Array.isArray((raw as Record<string, unknown>).species)
    ) {
        throw new Error("[hud-status] world.json is missing species metadata");
    }
    return raw as ContentWorld;
}

const world = assertContentWorld(worldRaw);
const speciesIndex = new Map(world.species.map((species) => [species.id, species]));

export function buildHudLeadStatus(input: HudLeadStatusInput): HudLeadStatus {
    const species = speciesIndex.get(input.speciesId);
    const primaryLabel = prettifySpeciesId(input.speciesId);
    const secondaryLabel = resolveSecondaryLabel(primaryLabel, species?.name);
    const portraitFrame = resolveSpeciesPortraitFrame(species);
    const hpPercent = Math.round(hpRatio(input.currentHp, input.maxHp) * 100);
    const hpClass = hpClassFor(input.currentHp, input.maxHp);

    return {
        speciesId: input.speciesId,
        primaryLabel,
        secondaryLabel,
        portraitSrc: portraitFrame?.src ?? null,
        portraitFrame,
        portraitFallback: portraitFallbackFor(secondaryLabel ?? primaryLabel),
        levelLabel: formatGameplayTemplate(HUD_STATUS_CONFIG.levelLabelTemplate, {
            level: input.level,
        }),
        masteredLabel: formatGameplayTemplate(HUD_STATUS_CONFIG.masteredLabelTemplate, {
            count: input.masteredWordCount,
        }),
        hpLabel: formatGameplayTemplate(HUD_STATUS_CONFIG.hpLabelTemplate, {
            current: Math.max(0, Math.round(input.currentHp)),
            max: Math.max(0, Math.round(input.maxHp)),
        }),
        hpPercent,
        hpClass,
    };
}

function prettifySpeciesId(speciesId: string): string {
    return speciesId.replace(/_/g, " ");
}

function resolveSecondaryLabel(primaryLabel: string, name: SpeciesName | undefined): string | null {
    const candidates = [name?.tp, name?.en].map((value) => value?.trim() ?? "").filter(Boolean);
    for (const candidate of candidates) {
        if (normalize(candidate) !== normalize(primaryLabel)) {
            return candidate;
        }
    }
    return candidates[0] ?? null;
}

function normalize(value: string): string {
    return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function portraitFallbackFor(label: string): string {
    const tokens = label
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);
    if (tokens.length === 0) return HUD_STATUS_CONFIG.missingPortraitFallback;
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}
