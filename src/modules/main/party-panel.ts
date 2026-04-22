import worldRaw from "../../content/generated/world.json";
import { PARTY_PANEL_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import {
    resolveSpeciesPortraitFrame,
    type SpeciesAnimationStrip,
    type SpeciesPortraitFrame,
} from "../../content/species-portrait";
import { hpClassFor, hpRatio, type HpClass } from "../../styles/hp-bar";
import { canonicalXpTotal, MAX_LEVEL, xpForLevel } from "./xp-curve";

type TranslatableName = {
    en?: string;
    tp?: string;
};

type SpeciesEntry = {
    id: string;
    name?: TranslatableName;
    type?: string;
    base_stats?: {
        hp?: number;
    };
    learnset?: Array<{
        level: number;
        move_id: string;
    }>;
    portrait_src?: string;
    sprite?: {
        src?: string;
        animations?: Record<string, SpeciesAnimationStrip>;
    };
};

type MoveEntry = {
    id: string;
    name?: TranslatableName;
};

type ContentWorld = {
    species: SpeciesEntry[];
    moves: MoveEntry[];
};

export type PartyPanelMember = {
    slot: number;
    species_id: string;
    level: number;
    xp: number;
    current_hp?: number | null;
};

export type PartyHpSnapshot = {
    currentHp: number;
    maxHp: number;
};

export type PartyPanelSlot = {
    slot: number;
    speciesId: string;
    primaryLabel: string;
    secondaryLabel: string | null;
    typeLabel: string;
    portraitSrc: string | null;
    portraitFrame: SpeciesPortraitFrame | null;
    portraitFallback: string;
    levelLabel: string;
    hpLabel: string;
    currentHp: number;
    maxHp: number;
    hpPercent: number;
    hpClass: HpClass;
    xpLabel: string;
    nextXpLabel: string;
    moveSummary: string;
    selected: boolean;
    isLead: boolean;
};

function assertContentWorld(raw: unknown): ContentWorld {
    if (
        raw == null ||
        typeof raw !== "object" ||
        !Array.isArray((raw as Record<string, unknown>).species) ||
        !Array.isArray((raw as Record<string, unknown>).moves)
    ) {
        throw new Error("[party-panel] world.json is missing species or move metadata");
    }
    return raw as ContentWorld;
}

const world = assertContentWorld(worldRaw);
const speciesIndex = new Map(world.species.map((species) => [species.id, species]));
const moveIndex = new Map(world.moves.map((move) => [move.id, move]));

export function buildPartyPanelSlot(
    member: PartyPanelMember,
    options: {
        selectedSlot?: number | null;
        leadHp?: PartyHpSnapshot | null;
    } = {},
): PartyPanelSlot {
    const species = speciesIndex.get(member.species_id);
    const primaryLabel = prettifyId(member.species_id);
    const secondaryLabel = resolveSecondaryLabel(primaryLabel, species?.name);
    const { currentHp, maxHp } = resolvePartyPanelHp(member, options);
    const hpPercent = Math.round(hpRatio(currentHp, maxHp) * 100);
    const currentXp = canonicalXpTotal(member.xp, member.level);
    const nextLevel = member.level >= MAX_LEVEL ? null : member.level + 1;
    const nextLevelXp = nextLevel === null ? null : xpForLevel(nextLevel);
    const moves = knownMovesFor(species, member.level);
    const portraitFrame = resolveSpeciesPortraitFrame(species);

    return {
        slot: member.slot,
        speciesId: member.species_id,
        primaryLabel,
        secondaryLabel,
        typeLabel: species?.type ?? PARTY_PANEL_CONFIG.unknownTypeLabel,
        portraitSrc: portraitFrame?.src ?? null,
        portraitFrame,
        portraitFallback: portraitFallbackFor(secondaryLabel ?? primaryLabel),
        levelLabel: formatGameplayTemplate(PARTY_PANEL_CONFIG.levelLabelTemplate, {
            level: member.level,
        }),
        hpLabel: formatGameplayTemplate(PARTY_PANEL_CONFIG.hpLabelTemplate, {
            current: currentHp,
            max: maxHp,
        }),
        currentHp,
        maxHp,
        hpPercent,
        hpClass: hpClassFor(currentHp, maxHp),
        xpLabel:
            nextLevelXp === null
                ? formatGameplayTemplate(PARTY_PANEL_CONFIG.xpMaxLabelTemplate, {
                      current: currentXp,
                  })
                : formatGameplayTemplate(PARTY_PANEL_CONFIG.xpLabelTemplate, {
                      current: currentXp,
                      next: nextLevelXp,
                  }),
        nextXpLabel:
            nextLevelXp === null
                ? PARTY_PANEL_CONFIG.maxLevelLabel
                : formatGameplayTemplate(PARTY_PANEL_CONFIG.nextXpLabelTemplate, {
                      remaining: Math.max(0, nextLevelXp - currentXp),
                      level: nextLevel,
                  }),
        moveSummary: moves.length
            ? moves.join(PARTY_PANEL_CONFIG.moveSeparator)
            : PARTY_PANEL_CONFIG.movesEmptyLabel,
        selected: options.selectedSlot === member.slot,
        isLead: member.slot === 0,
    };
}

export function resolvePartyPanelHp(
    member: PartyPanelMember,
    options: {
        leadHp?: PartyHpSnapshot | null;
    } = {},
): PartyHpSnapshot {
    const species = speciesIndex.get(member.species_id);
    const leadHp = member.slot === 0 ? options.leadHp : null;
    const rawMaxHp = Number(leadHp?.maxHp ?? species?.base_stats?.hp ?? 1);
    const maxHp = Number.isFinite(rawMaxHp) ? Math.max(1, Math.round(rawMaxHp)) : 1;
    const storedCurrentHp = member.current_hp == null ? null : Number(member.current_hp);
    const rawCurrentHp = leadHp?.currentHp ?? storedCurrentHp ?? maxHp;
    const currentHp = Number.isFinite(rawCurrentHp)
        ? Math.max(0, Math.min(maxHp, Math.round(rawCurrentHp)))
        : maxHp;
    return { currentHp, maxHp };
}

function knownMovesFor(species: SpeciesEntry | undefined, level: number): string[] {
    if (!species?.learnset?.length) return [];
    return species.learnset
        .filter((entry) => entry.level <= level)
        .sort((a, b) => a.level - b.level || a.move_id.localeCompare(b.move_id))
        .map((entry) => moveLabel(entry.move_id));
}

function moveLabel(moveId: string): string {
    const move = moveIndex.get(moveId);
    return resolveName(move?.name) ?? prettifyId(moveId);
}

function resolveSecondaryLabel(
    primaryLabel: string,
    name: TranslatableName | undefined,
): string | null {
    const value = resolveName(name);
    if (!value) return null;
    if (normalize(value) === normalize(primaryLabel)) return value;
    return value;
}

function resolveName(name: TranslatableName | undefined): string | null {
    const candidate = name?.tp?.trim() || name?.en?.trim();
    return candidate || null;
}

function prettifyId(id: string): string {
    return id.replace(/_/g, " ");
}

function normalize(value: string): string {
    return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function portraitFallbackFor(label: string): string {
    const tokens = label
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);
    if (tokens.length === 0) return PARTY_PANEL_CONFIG.missingPortraitFallback;
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}
