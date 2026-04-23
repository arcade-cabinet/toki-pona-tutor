import type { RpgPlayer } from "@rpgjs/server";
import {
    addToInventory,
    addToParty,
    consumeInventoryItem,
    getInventoryCount,
    getParty,
    getPartyWithHealth,
    logEncounter,
    recordBestiaryCaught,
    recordBestiarySeen,
    recordClue,
} from "../../platform/persistence/queries";
import { playDialog } from "./dialog";
import worldRaw from "../../content/generated/world.json";
import { mapMetadataFor } from "../../content/map-metadata";
import {
    COMBAT_UI_CONFIG,
    ENCOUNTER_CONFIG,
    NOTIFICATION_CONFIG,
    SFX_CUE_CONFIG,
} from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { cueSfx } from "./audio-cues";
import { formatItemDrop, rollSpeciesItemDrop, type SpeciesItemDrop } from "./item-drops";
import { recordQuestEventForActive } from "./quest-runtime";
import { TP_TYPES, typeMultiplier, type TpType } from "./type-matchup";
import {
    applyWildFight,
    wildCatchChance,
    wildFightDamage,
    wildTargetMaxHp,
    type WildCombatState,
} from "./wild-combat";
import {
    listCombatHealingChoices,
    useCombatHealingItem,
    type CombatItemUseResult,
} from "./combat-items";
import {
    formatWildCombatPrompt,
    formatWildDamagePopup,
    formatWildFightResult,
    wildCombatFace,
} from "./wild-combat-ui";
import {
    buildWildBattleDamage,
    buildWildBattleView,
    WILD_BATTLE_GUI_ID,
    type WildBattleCaptureState,
    type WildBattleCaptureView,
    type WildBattleDamageView,
    type WildBattleView,
} from "./wild-battle-view";
import { awardLeadVictoryXp } from "./victory-rewards";

type Species = {
    id: string;
    name: { en: string; tp?: string };
    type?: string;
    catch_rate: number;
    xp_yield: number;
    base_stats?: {
        hp?: number;
        attack?: number;
        defense?: number;
    };
    sprite?: {
        src?: string;
        tier?: "common" | "uncommon" | "legendary";
        animations?: Record<
            string,
            {
                src?: string;
                row: number;
                col_start: number;
                cols: number;
                fps: number;
            }
        >;
    };
    item_drop?: SpeciesItemDrop;
};

type Item = {
    id: string;
    kind: string;
    power?: number;
};

const world = worldRaw as unknown as { species: Species[]; items: Item[] };
const species = world.species;
const items = world.items;

const CATCH_THROW_ANIMATION_MS = ENCOUNTER_CONFIG.catchThrowAnimationMs;
const CATCH_RESULT_ANIMATION_MS = ENCOUNTER_CONFIG.catchResultAnimationMs;

type RenderWildBattle = (
    damage?: WildBattleDamageView | null,
    capture?: WildBattleCaptureView | WildBattleCaptureState | null,
) => Promise<void>;

/** Random integer in [min, max], inclusive. */
function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a species id from a weighted table. */
function rollSpeciesId(table: Record<string, number>): string | null {
    const entries = Object.entries(table);
    if (entries.length === 0) return null;
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let pick = Math.random() * total;
    for (const [id, weight] of entries) {
        pick -= weight;
        if (pick <= 0) return id;
    }
    return entries[entries.length - 1][0];
}

/** Parse a Tiled Encounter shape into structured fields. Safe no-op on bad data. */
function parseEncounterShape(properties: Record<string, unknown>): {
    table: Record<string, number>;
    levelMin: number;
    levelMax: number;
} | null {
    const speciesRaw = properties.species;
    const levelMin = Number(properties.level_min ?? 3);
    const levelMax = Number(properties.level_max ?? 6);
    if (typeof speciesRaw !== "string") return null;
    try {
        const table = JSON.parse(speciesRaw) as Record<string, number>;
        return { table, levelMin, levelMax };
    } catch {
        return null;
    }
}

const ENCOUNTER_PROBABILITY_PER_STEP = ENCOUNTER_CONFIG.probabilityPerStep;

function lookupSpecies(id: string): Species | undefined {
    return species.find((s) => s.id === id);
}

/**
 * Fires when the player enters an Encounter shape. Rolls whether an
 * encounter happens (simple per-enter coin flip scaled by table density),
 * picks a species + level, and runs the capture-or-flee prompt.
 */
export async function handleEncounterShapeEntered(
    player: RpgPlayer,
    properties: Record<string, unknown>,
    mapId: string,
): Promise<void> {
    if (Math.random() > ENCOUNTER_PROBABILITY_PER_STEP) return;
    const parsed = parseEncounterShape(properties);
    if (!parsed) return;

    const speciesId = rollSpeciesId(parsed.table);
    if (!speciesId) return;
    const meta = lookupSpecies(speciesId);
    if (!meta) return;

    const level = randInt(parsed.levelMin, parsed.levelMax);
    await runCaptureDialog(player, meta, level, mapId);
}

async function runCaptureDialog(
    player: RpgPlayer,
    meta: Species,
    level: number,
    mapId: string,
): Promise<void> {
    await cueSfx(player, SFX_CUE_CONFIG.encounterAppear);
    await playDialog(player, COMBAT_UI_CONFIG.wildBattle.dialogIds.appear);
    await recordClue("wild-signs");
    await recordBestiarySeen(meta.id);

    let combat: WildCombatState = {
        targetMaxHp: wildTargetMaxHp(meta.base_stats?.hp, level),
        targetHp: wildTargetMaxHp(meta.base_stats?.hp, level),
    };

    const battleGui = player.gui(WILD_BATTLE_GUI_ID);
    let battleGuiOpen = false;

    const renderBattle: RenderWildBattle = async (
        damage: WildBattleDamageView | null = null,
        capture: WildBattleCaptureView | WildBattleCaptureState | null = null,
    ): Promise<void> => {
        const view = await buildCurrentWildBattleView(combat, meta, level, damage, capture);
        if (battleGuiOpen) {
            battleGui.update(view);
            return;
        }
        await battleGui.open(view);
        battleGuiOpen = true;
    };

    try {
        await renderBattle();

        for (;;) {
            const choice = await player.showChoices(
                formatWildCombatPrompt(meta, level, combat),
                [
                    { text: COMBAT_UI_CONFIG.wildBattle.choiceLabels.fight, value: "fight" },
                    { text: COMBAT_UI_CONFIG.wildBattle.choiceLabels.catch, value: "catch" },
                    { text: COMBAT_UI_CONFIG.wildBattle.choiceLabels.item, value: "item" },
                    { text: COMBAT_UI_CONFIG.wildBattle.choiceLabels.flee, value: "flee" },
                ],
                { face: wildCombatFace(meta) },
            );

            if (!choice || choice.value === "flee") {
                await logEncounter(meta.id, mapId, "fled");
                return;
            }

            if (choice.value === "fight") {
                const result = await resolveFightAction(combat, meta, level);
                combat = result.state;
                await renderBattle(result.damage);
                await player.showNotification(
                    formatWildDamagePopup(result.appliedDamage, result.multiplier),
                    {
                        time: COMBAT_UI_CONFIG.wildBattle.damageNotificationMs,
                    },
                );
                await player.showText(
                    formatWildFightResult(result.appliedDamage, result.state, result.multiplier),
                );
                continue;
            }

            if (choice.value === "item") {
                await runCombatItemMenu(player);
                await renderBattle();
                continue;
            }

            if (choice.value === "catch") {
                const resolved = await resolveCatchAttempt(
                    player,
                    meta,
                    level,
                    mapId,
                    combat,
                    renderBattle,
                );
                if (resolved === "continue") {
                    await renderBattle();
                    continue;
                }
                return;
            }
        }
    } finally {
        if (battleGuiOpen) {
            battleGui.close();
        }
    }
}

async function resolveCatchAttempt(
    player: RpgPlayer,
    meta: Species,
    level: number,
    mapId: string,
    combat: WildCombatState,
    renderBattle: RenderWildBattle,
): Promise<"continue" | "resolved"> {
    const poki = await lookupBestAvailablePoki();
    if (!poki) {
        await player.showText(COMBAT_UI_CONFIG.wildBattle.missingPokiText);
        return "continue";
    }

    const consumed = await consumeInventoryItem(poki.id, 1);
    if (!consumed) {
        await player.showText(COMBAT_UI_CONFIG.wildBattle.missingPokiText);
        return "continue";
    }

    await cueSfx(player, SFX_CUE_CONFIG.catchThrow);
    await renderBattle(null, "throw");
    await delay(CATCH_THROW_ANIMATION_MS);
    const caught =
        Math.random() <
        wildCatchChance({
            targetHp: combat.targetHp,
            targetMaxHp: combat.targetMaxHp,
            catchRate: meta.catch_rate,
            pokiPower: pokiPower(poki),
        });
    if (caught) {
        const slot = await addToParty(meta.id, level);
        if (slot === null) {
            // Party is full — treat as a failed catch so the dialog and log
            // reflect what actually happened (nothing was added to the roster).
            await renderCatchResult(player, renderBattle, "escaped");
            await playDialog(player, COMBAT_UI_CONFIG.wildBattle.dialogIds.escaped);
            await logEncounter(meta.id, mapId, "fled");
            return "resolved";
        }
        await renderCatchResult(player, renderBattle, "caught");
        await playDialog(player, COMBAT_UI_CONFIG.wildBattle.dialogIds.caught);
        await logEncounter(meta.id, mapId, "caught");
        await recordBestiaryCaught(meta.id);
        await recordQuestEventForActive(player, {
            type: "catch",
            speciesId: meta.id,
            biome: mapMetadataFor(mapId)?.biome,
        });
        await grantSpeciesDrop(player, meta);
        // Wild capture grants the lead party creature half the species'
        // xp_yield (catching is less risky than defeating, so less xp).
        await grantLeadXp(player, Math.floor(meta.xp_yield / 2));
    } else {
        await renderCatchResult(player, renderBattle, "escaped");
        await playDialog(player, COMBAT_UI_CONFIG.wildBattle.dialogIds.escaped);
        await logEncounter(meta.id, mapId, "escaped");
    }
    return "resolved";
}

async function buildCurrentWildBattleView(
    combat: WildCombatState,
    meta: Species,
    level: number,
    damage: WildBattleDamageView | null,
    capture: WildBattleCaptureView | WildBattleCaptureState | null,
): Promise<WildBattleView> {
    const lead = (await getPartyWithHealth())[0] ?? null;
    const leadMeta = lead ? (lookupSpecies(lead.species_id) ?? null) : null;
    return buildWildBattleView({
        target: meta,
        targetLevel: level,
        targetCombat: combat,
        lead,
        leadSpecies: leadMeta,
        damage,
        capture,
    });
}

async function renderCatchResult(
    player: RpgPlayer,
    renderBattle: RenderWildBattle,
    state: Exclude<WildBattleCaptureState, "throw">,
): Promise<void> {
    await cueSfx(
        player,
        state === "caught" ? SFX_CUE_CONFIG.catchSuccess : SFX_CUE_CONFIG.catchFail,
    );
    await renderBattle(null, state);
    await delay(CATCH_RESULT_ANIMATION_MS);
}

async function resolveFightAction(
    combat: WildCombatState,
    meta: Species,
    encounterLevel: number,
): Promise<{
    state: WildCombatState;
    appliedDamage: number;
    multiplier: number;
    damage: WildBattleDamageView;
}> {
    const lead = (await getParty())[0];
    const leadMeta = lead ? lookupSpecies(lead.species_id) : undefined;
    const multiplier = wildFightTypeMultiplier(leadMeta, meta);
    const damage = wildFightDamage({
        attackerLevel: lead?.level ?? encounterLevel,
        attackerAttack: leadMeta?.base_stats?.attack,
        defenderDefense: meta.base_stats?.defense,
        typeMultiplier: multiplier,
    });
    const result = applyWildFight(combat, damage);
    return {
        state: result.state,
        appliedDamage: result.damage,
        multiplier,
        damage: buildWildBattleDamage(result.damage, multiplier),
    };
}

async function runCombatItemMenu(player: RpgPlayer): Promise<void> {
    const choices = await listCombatHealingChoices(player);
    if (choices.length === 0) {
        await player.showText(COMBAT_UI_CONFIG.wildBattle.itemMenu.emptyText);
        return;
    }

    const choice = await player.showChoices(COMBAT_UI_CONFIG.wildBattle.itemMenu.prompt, [
        ...choices.map((item) => ({
            text: formatCombatItemChoiceLabel(item),
            value: item.value,
        })),
        { text: COMBAT_UI_CONFIG.wildBattle.itemMenu.backLabel, value: "back" },
    ]);
    if (!choice || choice.value === "back") return;
    if (!choice.value.startsWith("item:")) return;

    const itemId = choice.value.replace("item:", "");
    const result = await useCombatHealingItem(player, itemId);
    await player.showText(formatCombatItemResult(result));
}

export function formatCombatItemChoiceLabel(item: {
    label: string;
    count: number;
    previewHealed: number;
}): string {
    const suffix =
        item.previewHealed > 0
            ? formatGameplayTemplate(COMBAT_UI_CONFIG.wildBattle.itemMenu.healSuffixTemplate, {
                  healed: item.previewHealed,
              })
            : COMBAT_UI_CONFIG.wildBattle.itemMenu.fullSuffix;
    return formatGameplayTemplate(COMBAT_UI_CONFIG.wildBattle.itemMenu.choiceTemplate, {
        item: item.label,
        count: item.count,
        suffix,
    });
}

export function formatCombatItemResult(result: CombatItemUseResult): string {
    if (result.used) {
        return formatGameplayTemplate(COMBAT_UI_CONFIG.wildBattle.itemMenu.usedTemplate, {
            item: result.label,
            healed: result.healed,
            next: result.nextHp,
            max: result.maxHp,
        });
    }

    switch (result.reason) {
        case "empty":
            return COMBAT_UI_CONFIG.wildBattle.itemMenu.emptyTextResult;
        case "full":
            return COMBAT_UI_CONFIG.wildBattle.itemMenu.fullText;
        case "invalid_hp":
            return COMBAT_UI_CONFIG.wildBattle.itemMenu.invalidHpText;
        case "missing":
            return COMBAT_UI_CONFIG.wildBattle.itemMenu.missingText;
    }
}

async function lookupBestAvailablePoki(): Promise<Item | null> {
    const pokiItems = items
        .filter((item) => item.kind === "poki")
        .sort((a, b) => pokiPower(b) - pokiPower(a));

    for (const item of pokiItems) {
        if ((await getInventoryCount(item.id)) > 0) return item;
    }
    return null;
}

function pokiPower(item: Item): number {
    const power = Number(item.power ?? 1);
    return Number.isFinite(power) && power > 0 ? power : 1;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, Math.max(0, ms));
    });
}

function wildFightTypeMultiplier(attacker: Species | undefined, defender: Species): number {
    if (!isTpType(attacker?.type) || !isTpType(defender.type)) return 1;
    return typeMultiplier(attacker.type, defender.type, defender.id.startsWith("waso_"));
}

function isTpType(value: unknown): value is TpType {
    return typeof value === "string" && (TP_TYPES as readonly string[]).includes(value);
}

async function grantSpeciesDrop(player: RpgPlayer, meta: Species): Promise<void> {
    const drop = rollSpeciesItemDrop(meta);
    if (!drop) return;
    await addToInventory(drop.itemId, drop.count);
    await player.showNotification(formatItemDrop(drop), {
        time: NOTIFICATION_CONFIG.itemDrop.timeMs,
    });
}

async function grantLeadXp(player: RpgPlayer, amount: number): Promise<void> {
    await awardLeadVictoryXp(player, amount);
}
