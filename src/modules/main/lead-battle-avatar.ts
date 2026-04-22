import { ATK, MAXHP, PDEF, type RpgPlayer } from "@rpgjs/server";
import worldRaw from "../../content/generated/world.json";
import { PLAYER_CONFIG } from "../../content/gameplay";
import {
    getPartyWithHealth,
    setPartyCurrentHp,
    setPartyOrder,
} from "../../platform/persistence/queries";
import { creatureSpriteId } from "../../config/creature-sprites";
import {
    closeLeadMoveBar,
    openLeadMoveBar,
    registerLeadSwitchHandler,
    syncLeadBattleSkills,
    unregisterLeadSwitchHandler,
} from "./lead-battle-skills";
import { promoteToLead } from "./party-order";

type LeadPartyMember = {
    slot: number;
    species_id: string;
    level: number;
    current_hp: number | null;
};

type SpeciesEntry = {
    id: string;
    base_stats: {
        hp: number;
        attack: number;
        defense: number;
    };
    sprite?: unknown;
};

type ContentWorld = {
    species: SpeciesEntry[];
};

type PlayerCombatShape = RpgPlayer & {
    hp?: number;
    param?: Record<string | number, number>;
    graphics?: () => unknown;
    setGraphic?: (graphic: string) => void;
};

export type LeadBattleAvatarModel = {
    speciesId: string;
    graphic: string;
    level: number;
    currentHp: number;
    maxHp: number;
    attack: number;
    defense: number;
};

type ActiveLeadAvatar = {
    originalGraphic: string | null;
    speciesId: string;
};

const world = worldRaw as unknown as ContentWorld;
const speciesById = new Map(world.species.map((entry) => [entry.id, entry]));
const activeAvatars = new WeakMap<RpgPlayer, ActiveLeadAvatar>();

export function buildLeadBattleAvatarModel(
    lead: LeadPartyMember,
    species: SpeciesEntry,
): LeadBattleAvatarModel {
    const level = normalizePositiveInt(lead.level, 1);
    const maxHp = Math.max(1, normalizePositiveInt(species.base_stats.hp, 1) + level * 2);
    const storedHp = lead.current_hp == null ? maxHp : normalizeInt(lead.current_hp, maxHp);
    return {
        speciesId: species.id,
        graphic: creatureSpriteId(species.id),
        level,
        currentHp: Math.max(0, Math.min(maxHp, storedHp)),
        maxHp,
        attack: Math.max(
            1,
            Math.round(normalizePositiveInt(species.base_stats.attack, 1) / 4 + level / 2),
        ),
        defense: Math.max(
            1,
            Math.round(normalizePositiveInt(species.base_stats.defense, 1) / 5 + level / 3),
        ),
    };
}

export async function syncLeadCreatureStats(
    player: RpgPlayer,
): Promise<LeadBattleAvatarModel | null> {
    const model = await leadBattleAvatarModel();
    if (!model) return null;
    applyLeadStats(player, model);
    await syncLeadBattleSkills(player, {
        speciesId: model.speciesId,
        level: model.level,
    });
    return model;
}

export async function activateLeadBattleAvatar(
    player: RpgPlayer,
): Promise<LeadBattleAvatarModel | null> {
    const model = await syncLeadCreatureStats(player);
    if (!model) return null;

    const typed = player as PlayerCombatShape;
    const active = activeAvatars.get(player);
    if (!active) {
        activeAvatars.set(player, {
            originalGraphic: currentGraphic(typed),
            speciesId: model.speciesId,
        });
    } else {
        active.speciesId = model.speciesId;
    }
    typed.setGraphic?.(model.graphic);
    await openLeadMoveBar(player, {
        speciesId: model.speciesId,
        level: model.level,
    });
    registerLeadSwitchHandler(player, (slot) => switchLeadBattleAvatarToPartySlot(player, slot));
    return model;
}

export async function restoreLeadBattleAvatar(player: RpgPlayer): Promise<boolean> {
    const active = activeAvatars.get(player);
    if (!active) return false;
    activeAvatars.delete(player);
    unregisterLeadSwitchHandler(player);
    closeLeadMoveBar(player);

    const typed = player as PlayerCombatShape;
    const currentHp = normalizeInt(typed.hp, 0);
    await setPartyCurrentHp(0, currentHp);
    typed.setGraphic?.(active.originalGraphic ?? PLAYER_CONFIG.defaultGraphic);
    return true;
}

export function isLeadBattleAvatarActive(player: RpgPlayer): boolean {
    return activeAvatars.has(player);
}

export async function switchToNextAvailableLeadBattleAvatar(
    player: RpgPlayer,
    options: { fainted?: boolean } = {},
): Promise<LeadBattleAvatarModel | null> {
    const active = activeAvatars.get(player);
    if (!active) return null;

    const typed = player as PlayerCombatShape;
    const leadHp = options.fainted ? 0 : Math.max(0, normalizeInt(typed.hp, 0));
    await setPartyCurrentHp(0, leadHp);

    const party = await getPartyWithHealth();
    const fromIndex = party.findIndex((member, index) => {
        if (index === 0) return false;
        const species = speciesById.get(member.species_id);
        return species?.sprite ? battleHpFor(member, species) > 0 : false;
    });
    if (fromIndex < 0) return null;

    await setPartyOrder(promoteToLead(party, fromIndex));
    return activateLeadBattleAvatar(player);
}

export async function switchLeadBattleAvatarToPartySlot(
    player: RpgPlayer,
    slot: number,
): Promise<LeadBattleAvatarModel | null> {
    const active = activeAvatars.get(player);
    if (!active || slot <= 0) return null;

    const typed = player as PlayerCombatShape;
    await setPartyCurrentHp(0, Math.max(0, normalizeInt(typed.hp, 0)));

    const party = await getPartyWithHealth();
    const fromIndex = party.findIndex((member) => member.slot === slot);
    if (fromIndex <= 0) return null;

    const candidate = party[fromIndex];
    const species = speciesById.get(candidate.species_id);
    if (!species?.sprite || battleHpFor(candidate, species) <= 0) return null;

    await setPartyOrder(promoteToLead(party, fromIndex));
    return activateLeadBattleAvatar(player);
}

async function leadBattleAvatarModel(): Promise<LeadBattleAvatarModel | null> {
    const lead = (await getPartyWithHealth())[0];
    if (!lead) return null;
    const species = speciesById.get(lead.species_id);
    if (!species?.sprite) return null;
    const model = buildLeadBattleAvatarModel(lead, species);
    return model.currentHp > 0 ? model : null;
}

function applyLeadStats(player: RpgPlayer, model: LeadBattleAvatarModel): void {
    const typed = player as PlayerCombatShape;
    typed.param ??= {};
    typed.param[MAXHP] = model.maxHp;
    typed.param[ATK] = model.attack;
    typed.param[PDEF] = model.defense;
    typed.hp = model.currentHp;
}

function currentGraphic(player: PlayerCombatShape): string | null {
    const graphics = player.graphics?.();
    if (Array.isArray(graphics)) {
        return graphics.find((graphic): graphic is string => typeof graphic === "string") ?? null;
    }
    return typeof graphics === "string" ? graphics : null;
}

function normalizePositiveInt(value: unknown, fallback: number): number {
    const parsed = normalizeInt(value, fallback);
    return Math.max(1, parsed);
}

function normalizeInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function battleHpFor(lead: LeadPartyMember, species: SpeciesEntry): number {
    const level = normalizePositiveInt(lead.level, 1);
    const maxHp = Math.max(1, normalizePositiveInt(species.base_stats.hp, 1) + level * 2);
    const storedHp = lead.current_hp == null ? maxHp : normalizeInt(lead.current_hp, maxHp);
    return Math.max(0, Math.min(maxHp, storedHp));
}
