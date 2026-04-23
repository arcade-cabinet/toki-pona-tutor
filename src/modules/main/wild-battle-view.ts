import { hpClassFor, hpRatio, type HpClass } from "../../styles/hp-bar";
import { wildDamageTone, type WildCombatState, type WildDamageTone } from "./wild-combat";
import { COMBAT_UI_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { resolveRuntimeName, typeLabel } from "../../content/runtime-labels";
import { wildHpLabel, wildLevelLabel } from "./wild-combat-ui";

export const WILD_BATTLE_GUI_ID = COMBAT_UI_CONFIG.wildBattleGuiId;

type TranslatableName = {
    en?: string;
    tp?: string;
};

type AnimationStrip = {
    src?: string;
    row: number;
    col_start: number;
    cols: number;
    fps: number;
};

type WildBattleSpecies = {
    id: string;
    name?: TranslatableName;
    type?: string;
    base_stats?: {
        hp?: number;
    };
    portrait_src?: string;
    sprite?: {
        src?: string;
        animations?: Record<string, AnimationStrip>;
    };
};

export type WildBattlePartyMember = {
    slot: number;
    species_id: string;
    level: number;
    xp?: number;
    current_hp?: number | null;
};

export type WildBattleSpriteFrame = {
    src: string;
    frameX: number;
    frameY: number;
    framesWidth: number;
    framesHeight: number;
};

export type WildBattleCombatantView = {
    id: string;
    label: string;
    levelLabel: string;
    typeLabel: string;
    hpLabel: string;
    hpPercent: number;
    hpClass: HpClass;
    sprite: WildBattleSpriteFrame | null;
    fallback: string;
};

export type WildBattleDamageView = {
    label: string;
    damage: number;
    tone: WildDamageTone;
};

export type WildBattleCaptureState = "throw" | "caught" | "escaped";

export type WildBattleCaptureView = {
    state: WildBattleCaptureState;
    label: string;
};

export type WildBattleView = {
    lead: WildBattleCombatantView | null;
    target: WildBattleCombatantView;
    damage: WildBattleDamageView | null;
    capture: WildBattleCaptureView | null;
};

export function buildWildBattleView(params: {
    target: WildBattleSpecies;
    targetLevel: number;
    targetCombat: WildCombatState;
    lead?: WildBattlePartyMember | null;
    leadSpecies?: WildBattleSpecies | null;
    damage?:
        | WildBattleDamageView
        | {
              amount: number;
              multiplier: number;
          }
        | null;
    capture?: WildBattleCaptureView | WildBattleCaptureState | null;
}): WildBattleView {
    return {
        lead:
            params.lead && params.leadSpecies
                ? buildLeadCombatant(params.lead, params.leadSpecies)
                : null,
        target: buildTargetCombatant(params.target, params.targetLevel, params.targetCombat),
        damage: resolveDamage(params.damage),
        capture: resolveCapture(params.capture),
    };
}

export function buildWildBattleDamage(amount: number, multiplier = 1): WildBattleDamageView {
    const damage = Math.max(0, Math.round(amount));
    const tone = wildDamageTone(multiplier);
    const config = COMBAT_UI_CONFIG.wildBattle;
    return {
        damage,
        tone,
        label:
            tone === "miss"
                ? config.damageMissLabel
                : formatGameplayTemplate(config.damageLabelTemplate, {
                      damage,
                      hp_label: config.hpLabelPrefix,
                  }),
    };
}

export function buildWildBattleCapture(state: WildBattleCaptureState): WildBattleCaptureView {
    return { state, label: COMBAT_UI_CONFIG.wildBattle.captureLabels[state] };
}

function resolveDamage(
    damage: WildBattleDamageView | { amount: number; multiplier: number } | null | undefined,
): WildBattleDamageView | null {
    if (!damage) return null;
    if ("label" in damage) return damage;
    return buildWildBattleDamage(damage.amount, damage.multiplier);
}

function resolveCapture(
    capture: WildBattleCaptureView | WildBattleCaptureState | null | undefined,
): WildBattleCaptureView | null {
    if (!capture) return null;
    return typeof capture === "string" ? buildWildBattleCapture(capture) : capture;
}

export function wildBattleSpriteFrame(
    species: WildBattleSpecies | null | undefined,
): WildBattleSpriteFrame | null {
    const sprite = species?.sprite;
    const idle = sprite?.animations?.idle;
    if (!sprite?.src || !idle) return null;

    const primaryStrips = Object.values(sprite.animations ?? {}).filter(
        (strip) => !strip.src || strip.src === sprite.src,
    );
    const framesWidth = Math.max(1, ...primaryStrips.map((strip) => strip.col_start + strip.cols));
    const framesHeight = Math.max(1, ...primaryStrips.map((strip) => strip.row + 1));

    return {
        src: sprite.src,
        frameX: Math.max(0, idle.col_start),
        frameY: Math.max(0, idle.row),
        framesWidth,
        framesHeight,
    };
}

function buildLeadCombatant(
    lead: WildBattlePartyMember,
    species: WildBattleSpecies,
): WildBattleCombatantView {
    const maxHp = normalizedMaxHp(species.base_stats?.hp);
    const rawCurrentHp = lead.current_hp == null ? maxHp : Number(lead.current_hp);
    const currentHp = normalizedCurrentHp(rawCurrentHp, maxHp);
    return buildCombatant({
        id: lead.species_id,
        species,
        level: lead.level,
        currentHp,
        maxHp,
    });
}

function buildTargetCombatant(
    species: WildBattleSpecies,
    level: number,
    combat: WildCombatState,
): WildBattleCombatantView {
    const maxHp = normalizedMaxHp(combat.targetMaxHp);
    const currentHp = normalizedCurrentHp(combat.targetHp, maxHp);
    return buildCombatant({
        id: species.id,
        species,
        level,
        currentHp,
        maxHp,
    });
}

function buildCombatant(params: {
    id: string;
    species: WildBattleSpecies;
    level: number;
    currentHp: number;
    maxHp: number;
}): WildBattleCombatantView {
    return {
        id: params.id,
        label: speciesLabel(params.species),
        levelLabel: wildLevelLabel(params.level),
        typeLabel: params.species.type
            ? typeLabel(params.species.type)
            : COMBAT_UI_CONFIG.wildBattle.unknownTypeLabel,
        hpLabel: wildHpLabel(params.currentHp, params.maxHp),
        hpPercent: Math.round(hpRatio(params.currentHp, params.maxHp) * 100),
        hpClass: hpClassFor(params.currentHp, params.maxHp),
        sprite: wildBattleSpriteFrame(params.species),
        fallback: portraitFallbackFor(speciesLabel(params.species)),
    };
}

function speciesLabel(species: WildBattleSpecies): string {
    return resolveRuntimeName(species.name) ?? species.id.replace(/_/g, " ");
}

function normalizedMaxHp(value: number | null | undefined): number {
    const raw = Number(value);
    return Number.isFinite(raw) ? Math.max(1, Math.round(raw)) : 1;
}

function normalizedCurrentHp(value: number, maxHp: number): number {
    const raw = Number(value);
    const current = Number.isFinite(raw) ? Math.round(raw) : maxHp;
    return Math.max(0, Math.min(maxHp, current));
}

function portraitFallbackFor(label: string): string {
    const tokens = label
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);
    if (tokens.length === 0) return COMBAT_UI_CONFIG.wildBattle.missingPortraitFallback;
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}
