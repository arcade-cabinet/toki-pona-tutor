import { ATK, MAXSP, PDEF, type RpgPlayer } from "@rpgjs/server";
import worldRaw from "../../content/generated/world.json";
import { COMBAT_UI_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { getPartyWithHealth } from "../../platform/persistence/queries";
import { buildPartyPanelSlot } from "./party-panel";
import { leadHpSnapshot } from "./player-health";

export const LEAD_MOVE_BAR_GUI_ID = COMBAT_UI_CONFIG.leadMoveBarGuiId;
export const LEAD_MOVE_SKILL_PREFIX = COMBAT_UI_CONFIG.leadMoveSkillPrefix;
export const LEAD_MOVE_BAR_LIMIT = COMBAT_UI_CONFIG.leadMoveBarLimit;
const LEAD_MOVE_BAR_COPY = COMBAT_UI_CONFIG.leadMoveBar;
const LEAD_MOVE_TUNING = COMBAT_UI_CONFIG.leadMoveTuning;

type LeadMovePartyMember = {
    speciesId: string;
    level: number;
};

type MoveEntry = {
    id: string;
    name?: {
        en?: string;
        tp?: string;
    };
    description?: {
        en?: string;
        tp?: string;
    };
    type: string;
    power: number;
    accuracy: number;
    pp: number;
    effect?: string;
    priority?: number;
};

type SpeciesEntry = {
    id: string;
    name?: {
        en?: string;
        tp?: string;
    };
    learnset: Array<{
        level: number;
        move_id: string;
    }>;
};

type ContentWorld = {
    moves: MoveEntry[];
    species: SpeciesEntry[];
};

type PlayerSkillShape = RpgPlayer & {
    sp?: number;
    param?: Record<string | number, number>;
    getGui?: (id: string) => LeadMoveBarGui | undefined;
    gui?: (id: string) => LeadMoveBarGui;
    applyStates?: (target: unknown, skill: LeadActionBattleSkill) => unknown;
    setGraphicAnimation?: (name: string, times?: number) => unknown;
};

type LeadMoveBarGui = {
    open: (data: LeadMoveBarModel) => unknown | Promise<unknown>;
    update: (data: LeadMoveBarModel) => unknown;
    close: () => unknown;
    on?: (event: string, handler: (payload: { id?: string }) => void) => unknown;
    __pokiLeadMoveBarReady?: boolean;
};

type BattleEventLike = {
    id?: string;
    name?: string;
    battleAi?: unknown;
    hp?: number;
    x?: () => number;
    y?: () => number;
    applyDamage?: (attacker: RpgPlayer, skill: LeadActionBattleSkill) => unknown;
};

type MapWithBattleEvents = {
    getEvents?: () => BattleEventLike[];
};

export type LeadActionBattleSkill = {
    _type: "skill";
    id: string;
    name: string;
    description: string;
    spCost: number;
    power: number;
    hitRate: number;
    coefficient: Record<string | number, number>;
};

export type LeadMoveBarMove = {
    actionId: string;
    moveId: string;
    label: string;
    typeLabel: string;
    power: number;
    accuracy: number;
    spCost: number;
    cooldownMs: number;
    readyAt: number;
    rangeTiles: number;
    disabled: boolean;
    meta: string;
};

export type LeadMoveBarTarget = {
    label: string;
    statusLabel: string;
    inRange: boolean;
    distanceTiles: number | null;
};

export type LeadSwitchOption = {
    slot: number;
    speciesId: string;
    label: string;
    levelLabel: string;
    hpLabel: string;
    hpPercent: number;
    hpClass: string;
    meta: string;
    disabled: boolean;
    selected: boolean;
    portraitSrc?: string | null;
    portraitFallback?: string;
};

export type LeadSwitchModel = {
    actionLabel: string;
    title: string;
    emptyLabel: string;
    closeLabel: string;
    options: LeadSwitchOption[];
};

export type LeadMoveBarModel = {
    leadLabel: string;
    speciesId: string;
    levelLabel: string;
    energyLabel: string;
    target: LeadMoveBarTarget;
    moves: LeadMoveBarMove[];
    switch: LeadSwitchModel;
};

const world = worldRaw as unknown as ContentWorld;
const movesById = new Map(world.moves.map((move) => [move.id, move]));
const speciesById = new Map(world.species.map((species) => [species.id, species]));
const activeMoveBars = new WeakMap<RpgPlayer, LeadMovePartyMember>();
const cooldownsByPlayer = new WeakMap<RpgPlayer, Map<string, number>>();
const initializedSpPlayers = new WeakSet<RpgPlayer>();
const moveBarRemountVersions = new WeakMap<RpgPlayer, number>();
const leadSwitchHandlers = new WeakMap<RpgPlayer, (slot: number) => Promise<unknown>>();

export function moveSkillId(moveId: string): string {
    return `${LEAD_MOVE_SKILL_PREFIX}${moveId}`;
}

export function buildActionBattleSkill(move: MoveEntry): LeadActionBattleSkill {
    return {
        _type: "skill",
        id: moveSkillId(move.id),
        name: moveLabel(move),
        description: move.description?.en ?? move.description?.tp ?? "",
        spCost: moveSpCost(move),
        power: Math.max(1, Math.round(normalizeNumber(move.power, 1) / 2)),
        hitRate: clamp01(normalizeNumber(move.accuracy, 100) / 100),
        coefficient: {
            [ATK]: 0.65,
            [PDEF]: 1,
        },
    };
}

export const LEAD_ACTION_BATTLE_SKILL_DATABASE: Record<string, LeadActionBattleSkill> =
    Object.fromEntries(
        world.moves.map((move) => [moveSkillId(move.id), buildActionBattleSkill(move)]),
    );

export function buildLeadMoveBarModel(
    lead: LeadMovePartyMember,
    species: SpeciesEntry,
    cooldowns: ReadonlyMap<string, number> = new Map(),
    now = Date.now(),
): LeadMoveBarModel {
    const moves = knownMovesForLead(lead, species).map((move) => {
        const actionId = moveSkillId(move.id);
        const readyAt = Math.max(0, cooldowns.get(actionId) ?? 0);
        const disabled = readyAt > now;
        const spCost = moveSpCost(move);
        const cooldownMs = moveCooldownMs(move);
        return {
            actionId,
            moveId: move.id,
            label: moveLabel(move),
            typeLabel: move.type,
            power: normalizePositiveInt(move.power, 1),
            accuracy: normalizePositiveInt(move.accuracy, 100),
            spCost,
            cooldownMs,
            readyAt,
            rangeTiles: moveRangeTiles(move),
            disabled,
            meta: formatGameplayTemplate(LEAD_MOVE_BAR_COPY.moveMetaTemplate, {
                type: move.type,
                power: normalizePositiveInt(move.power, 1),
                sp: spCost,
            }),
        };
    });

    return {
        leadLabel: species.name?.tp ?? species.name?.en ?? species.id.replace(/_/g, " "),
        speciesId: species.id,
        levelLabel: formatGameplayTemplate(LEAD_MOVE_BAR_COPY.levelLabelTemplate, {
            level: normalizePositiveInt(lead.level, 1),
        }),
        energyLabel: formatGameplayTemplate(LEAD_MOVE_BAR_COPY.energyLabelTemplate, {
            sp: leadMoveMaxSp(moves),
        }),
        target: {
            label: LEAD_MOVE_BAR_COPY.defaultTargetLabel,
            statusLabel: LEAD_MOVE_BAR_COPY.defaultTargetStatus,
            inRange: false,
            distanceTiles: null,
        },
        moves,
        switch: emptyLeadSwitchModel(),
    };
}

export async function syncLeadBattleSkills(
    player: RpgPlayer,
    lead: LeadMovePartyMember,
): Promise<LeadMoveBarModel | null> {
    const species = speciesById.get(lead.speciesId);
    if (!species) return null;

    const cooldowns = cooldownsFor(player);
    const model = withLeadMoveTargetState(player, {
        ...buildLeadMoveBarModel(lead, species, cooldowns),
        switch: await buildLeadSwitchModel(player),
    });
    const typed = player as PlayerSkillShape;
    syncPlayerSp(typed, model);
    return model;
}

export function registerLeadSwitchHandler(
    player: RpgPlayer,
    handler: (slot: number) => Promise<unknown>,
): void {
    leadSwitchHandlers.set(player, handler);
}

export function unregisterLeadSwitchHandler(player: RpgPlayer): void {
    leadSwitchHandlers.delete(player);
}

export async function openLeadMoveBar(
    player: RpgPlayer,
    lead: LeadMovePartyMember,
): Promise<LeadMoveBarModel | null> {
    const model = await syncLeadBattleSkills(player, lead);
    if (!model || model.moves.length === 0) return model;

    const alreadyActive = activeMoveBars.has(player);
    activeMoveBars.set(player, lead);
    const gui = ensureLeadMoveBarGui(player);
    if (alreadyActive) {
        moveBarRemountVersions.set(player, nextMoveBarRemountVersion(player));
        await gui?.close();
    }
    await gui?.open(model);
    return model;
}

export function closeLeadMoveBar(player: RpgPlayer): void {
    activeMoveBars.delete(player);
    initializedSpPlayers.delete(player);
    moveBarRemountVersions.set(player, nextMoveBarRemountVersion(player));
    const gui = readLeadMoveBarGui(player);
    gui?.close();
}

export async function useLeadBattleMove(player: RpgPlayer, actionId: string): Promise<boolean> {
    const active = await currentActiveLead(player);
    if (!active || !actionId.startsWith(LEAD_MOVE_SKILL_PREFIX)) return false;

    const model = await syncLeadBattleSkills(player, active);
    if (!model) return false;
    const move = model.moves.find((entry) => entry.actionId === actionId);
    if (!move) return false;

    const now = Date.now();
    if (move.readyAt > now) {
        updateLeadMoveBar(player, model);
        return false;
    }

    const target = nearestBattleEvent(player, move.rangeTiles);
    if (!target) {
        updateLeadMoveBar(player, model);
        return false;
    }

    try {
        (player as PlayerSkillShape).setGraphicAnimation?.("attack", 1);
        executeLeadBattleSkill(player, target, move);
    } catch {
        updateLeadMoveBar(player, model);
        return false;
    }

    cooldownsFor(player).set(actionId, now + move.cooldownMs);
    const refreshed = await syncLeadBattleSkills(player, active);
    if (refreshed) updateLeadMoveBar(player, refreshed);
    return true;
}

async function currentActiveLead(player: RpgPlayer): Promise<LeadMovePartyMember | null> {
    const fallback = activeMoveBars.get(player);
    if (!fallback) return null;

    const partyLead = (await getPartyWithHealth())[0];
    if (!partyLead?.species_id) return fallback;

    const lead = {
        speciesId: partyLead.species_id,
        level: normalizePositiveInt(partyLead.level, fallback.level),
    };
    activeMoveBars.set(player, lead);
    return lead;
}

function syncPlayerSp(player: PlayerSkillShape, model: LeadMoveBarModel): void {
    player.param ??= {};
    const maxSp = leadMoveMaxSp(model.moves);
    player.param[MAXSP] = maxSp;
    const currentSp = Number(player.sp);
    if (!initializedSpPlayers.has(player) || !Number.isFinite(currentSp)) {
        player.sp = maxSp;
    } else if (currentSp < 0) {
        player.sp = 0;
    } else if (currentSp > maxSp) {
        player.sp = maxSp;
    }
    initializedSpPlayers.add(player);
}

function ensureLeadMoveBarGui(player: RpgPlayer): LeadMoveBarGui | null {
    const gui = readLeadMoveBarGui(player);
    if (!gui || gui.__pokiLeadMoveBarReady) return gui ?? null;
    gui.__pokiLeadMoveBarReady = true;
    gui.on?.("useMove", ({ id }) => {
        if (typeof id === "string") {
            void useLeadBattleMove(player, id);
        }
    });
    gui.on?.("switchLead", ({ id }) => {
        const slot = Number(id);
        if (!Number.isInteger(slot)) return;
        const handler = leadSwitchHandlers.get(player);
        if (!handler) return;
        void handler(slot).then(async (switched) => {
            const switchedLead = normalizeSwitchResult(switched);
            if (switchedLead) {
                activeMoveBars.set(player, switchedLead);
                return;
            }
            if (!switched) {
                const active = await currentActiveLead(player);
                if (!active) return;
                const model = await syncLeadBattleSkills(player, active);
                if (model) updateLeadMoveBar(player, model);
            }
        });
    });
    return gui;
}

function updateLeadMoveBar(player: RpgPlayer, model: LeadMoveBarModel): void {
    const gui = readLeadMoveBarGui(player);
    if (!gui) return;
    const version = nextMoveBarRemountVersion(player);
    moveBarRemountVersions.set(player, version);
    gui.update(model);
    // CanvasEngine v2 updates the GUI data signal but does not reliably patch
    // DOM attributes inside @for rows. Remount so cooldown/ARIA state reaches
    // the actual browser DOM after each move. Sequence close -> open on a
    // macrotask so close cleanup cannot race and leave touch controls absent.
    void Promise.resolve(gui.close()).then(() => {
        globalThis.setTimeout(() => {
            if (moveBarRemountVersions.get(player) !== version) return;
            void gui.open(model);
        }, 0);
    });
}

function nextMoveBarRemountVersion(player: RpgPlayer): number {
    return (moveBarRemountVersions.get(player) ?? 0) + 1;
}

function readLeadMoveBarGui(player: RpgPlayer): LeadMoveBarGui | null {
    const typed = player as PlayerSkillShape;
    try {
        return typed.getGui?.(LEAD_MOVE_BAR_GUI_ID) ?? typed.gui?.(LEAD_MOVE_BAR_GUI_ID) ?? null;
    } catch {
        return null;
    }
}

function normalizeSwitchResult(value: unknown): LeadMovePartyMember | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<LeadMovePartyMember>;
    if (typeof candidate.speciesId !== "string") return null;
    return {
        speciesId: candidate.speciesId,
        level: normalizePositiveInt(candidate.level, 1),
    };
}

function executeLeadBattleSkill(
    player: RpgPlayer,
    target: BattleEventLike,
    move: LeadMoveBarMove,
): void {
    const skill = LEAD_ACTION_BATTLE_SKILL_DATABASE[move.actionId];
    if (!skill) throw new Error(`Lead move skill ${move.actionId} is not registered`);
    if (typeof target.applyDamage !== "function") {
        throw new Error(`Lead move target cannot receive ${move.actionId}`);
    }

    const typed = player as PlayerSkillShape;
    const currentSp = normalizeNumber(typed.sp, 0);
    if (currentSp < move.spCost) {
        throw new Error(`Not enough SP for ${move.actionId}`);
    }
    typed.sp = Math.max(0, currentSp - move.spCost);

    if (Math.random() > skill.hitRate) return;

    typed.applyStates?.(target, skill);
    target.applyDamage(player, skill);
}

function cooldownsFor(player: RpgPlayer): Map<string, number> {
    let cooldowns = cooldownsByPlayer.get(player);
    if (!cooldowns) {
        cooldowns = new Map();
        cooldownsByPlayer.set(player, cooldowns);
    }
    return cooldowns;
}

function knownMovesForLead(lead: LeadMovePartyMember, species: SpeciesEntry): MoveEntry[] {
    const level = normalizePositiveInt(lead.level, 1);
    const seen = new Set<string>();
    return species.learnset
        .filter((entry) => normalizePositiveInt(entry.level, 1) <= level)
        .sort((a, b) => a.level - b.level || a.move_id.localeCompare(b.move_id))
        .map((entry) => movesById.get(entry.move_id))
        .filter((move): move is MoveEntry => {
            if (!move || seen.has(move.id)) return false;
            seen.add(move.id);
            return true;
        })
        .slice(0, LEAD_MOVE_BAR_LIMIT);
}

function nearestBattleEvent(player: RpgPlayer, rangeTiles: number): BattleEventLike | null {
    const nearest = nearestBattleEventByDistance(player);
    const rangePx = Math.max(48, rangeTiles * 64);
    if (!nearest || nearest.distance > rangePx) return null;
    return nearest.event;
}

function withLeadMoveTargetState(player: RpgPlayer, model: LeadMoveBarModel): LeadMoveBarModel {
    const maxRangeTiles = Math.max(1, ...model.moves.map((move) => move.rangeTiles));
    const nearest = nearestBattleEventByDistance(player);
    if (!nearest) {
        return {
            ...model,
            target: {
                label: LEAD_MOVE_BAR_COPY.noTargetLabel,
                statusLabel: LEAD_MOVE_BAR_COPY.noTargetStatus,
                inRange: false,
                distanceTiles: null,
            },
        };
    }

    const distanceTiles = Math.max(0, Math.ceil(nearest.distance / 64));
    const inRange = nearest.distance <= Math.max(48, maxRangeTiles * 64);
    return {
        ...model,
        target: {
            label: formatBattleTargetLabel(nearest.event),
            statusLabel: formatRangeStatus(inRange, distanceTiles),
            inRange,
            distanceTiles,
        },
    };
}

async function buildLeadSwitchModel(player: RpgPlayer): Promise<LeadSwitchModel> {
    const party = await getPartyWithHealth();
    const leadHp = leadHpSnapshot(player);
    const options = party.map((member) => {
        const slot = buildPartyPanelSlot(member, {
            selectedSlot: 0,
            leadHp: member.slot === 0 ? leadHp : null,
        });
        const fainted = slot.currentHp <= 0;
        const selected = slot.isLead;
        return {
            slot: slot.slot,
            speciesId: slot.speciesId,
            label: slot.primaryLabel,
            levelLabel: slot.levelLabel,
            hpLabel: slot.hpLabel,
            hpPercent: slot.hpPercent,
            hpClass: slot.hpClass,
            meta: selected
                ? LEAD_MOVE_BAR_COPY.switchCurrentMeta
                : fainted
                  ? LEAD_MOVE_BAR_COPY.switchFaintedMeta
                  : formatGameplayTemplate(LEAD_MOVE_BAR_COPY.switchSlotMetaTemplate, {
                        slot: slot.slot + 1,
                        hp: slot.hpLabel,
                    }),
            disabled: selected || fainted,
            selected,
            portraitSrc: slot.portraitSrc,
            portraitFallback: slot.portraitFallback,
        };
    });
    return {
        actionLabel: LEAD_MOVE_BAR_COPY.switchActionLabel,
        title: LEAD_MOVE_BAR_COPY.switchTitle,
        emptyLabel: LEAD_MOVE_BAR_COPY.switchEmptyLabel,
        closeLabel: LEAD_MOVE_BAR_COPY.switchCloseLabel,
        options,
    };
}

function emptyLeadSwitchModel(): LeadSwitchModel {
    return {
        actionLabel: LEAD_MOVE_BAR_COPY.switchActionLabel,
        title: LEAD_MOVE_BAR_COPY.switchTitle,
        emptyLabel: LEAD_MOVE_BAR_COPY.switchEmptyLabel,
        closeLabel: LEAD_MOVE_BAR_COPY.switchCloseLabel,
        options: [],
    };
}

function nearestBattleEventByDistance(
    player: RpgPlayer,
): { event: BattleEventLike; distance: number } | null {
    const map = player.getCurrentMap?.() as MapWithBattleEvents | null | undefined;
    const events = map?.getEvents?.() ?? [];
    let nearest: { event: BattleEventLike; distance: number } | null = null;
    for (const event of events) {
        if (!event.battleAi) continue;
        if (typeof event.hp === "number" && event.hp <= 0) continue;
        if (typeof event.x !== "function" || typeof event.y !== "function") continue;
        const distance = Math.hypot(event.x() - player.x(), event.y() - player.y());
        if (!nearest || distance < nearest.distance) {
            nearest = { event, distance };
        }
    }
    return nearest;
}

function formatBattleTargetLabel(event: BattleEventLike): string {
    const raw =
        typeof event.id === "string"
            ? event.id
            : typeof event.name === "string"
              ? event.name
              : LEAD_MOVE_BAR_COPY.defaultTargetLabel;
    return raw.replace(/[_-]+/g, " ");
}

function formatRangeStatus(inRange: boolean, distanceTiles: number): string {
    return formatGameplayTemplate(
        inRange ? LEAD_MOVE_BAR_COPY.inRangeTemplate : LEAD_MOVE_BAR_COPY.outOfRangeTemplate,
        {
            tiles: distanceTiles,
            tile_label:
                distanceTiles === 1
                    ? LEAD_MOVE_BAR_COPY.tileSingularLabel
                    : LEAD_MOVE_BAR_COPY.tilePluralLabel,
        },
    );
}

function leadMoveMaxSp(moves: readonly Pick<LeadMoveBarMove, "spCost">[]): number {
    const total = moves.reduce((sum, move) => sum + move.spCost, 0);
    return Math.max(LEAD_MOVE_TUNING.maxSpFloor, total * LEAD_MOVE_TUNING.maxSpCostMultiplier);
}

function moveLabel(move: MoveEntry): string {
    return move.name?.en ?? move.name?.tp ?? move.id.replace(/_/g, " ");
}

function moveSpCost(move: MoveEntry): number {
    return Math.max(
        LEAD_MOVE_TUNING.spCostMin,
        Math.min(
            LEAD_MOVE_TUNING.spCostMax,
            Math.ceil(normalizePositiveInt(move.power, 1) / LEAD_MOVE_TUNING.spCostPowerDivisor),
        ),
    );
}

function moveCooldownMs(move: MoveEntry): number {
    return Math.max(
        LEAD_MOVE_TUNING.cooldownMinMs,
        LEAD_MOVE_TUNING.cooldownBaseMs +
            normalizePositiveInt(move.power, 1) * LEAD_MOVE_TUNING.cooldownPowerMs -
            Math.max(0, move.priority ?? 0) * LEAD_MOVE_TUNING.cooldownPriorityMs,
    );
}

function moveRangeTiles(move: MoveEntry): number {
    const rangeTilesByType = LEAD_MOVE_TUNING.rangeTilesByType as Record<
        string,
        number | undefined
    >;
    return rangeTilesByType[move.type] ?? LEAD_MOVE_TUNING.defaultRangeTiles;
}

function normalizePositiveInt(value: unknown, fallback: number): number {
    return Math.max(1, Math.round(normalizeNumber(value, fallback)));
}

function normalizeNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}
