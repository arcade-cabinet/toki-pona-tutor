import type { RpgPlayer } from "@rpgjs/server";
import { AUTOSAVE_SLOT } from "../../platform/persistence/constants";
import { loadActiveSeed } from "../../platform/persistence/seed-persistence";
import { seedDisplay } from "../seed";
import { showInventory } from "./inventory-screen";
import {
    consumeInventoryItem,
    getFlag,
    getBestiaryState,
    getInventoryCount,
    getSentenceLogCount,
    getPartyWithHealth,
    getWordSightings,
    listInventoryItems,
    listMasteredWords,
    setPartyOrder,
    setPartyCurrentHp,
} from "../../platform/persistence/queries";
import { showSaveMenu } from "./save-menu";
import { showSettings } from "./settings-screen";
import {
    formatVocabularyGlyphCard,
    formatVocabularyRowLabel,
    showSentenceLog,
    showVocabulary,
} from "./vocabulary-screen";
import {
    getAccessibleMode,
    getBgmVolume,
    getHighContrast,
    getSfxVolume,
    getSitelenOverlay,
    getTextSpeed,
} from "../../platform/persistence/settings";
import { dictionarySize } from "./vocabulary";
import { buildPartyPanelSlot, resolvePartyPanelHp, type PartyPanelSlot } from "./party-panel";
import { promoteToLead } from "./party-order";
import { applyHeal, healingItem } from "./healing-items";
import { leadHpSnapshot, setPlayerHp } from "./player-health";
import {
    activateLeadBattleAvatar,
    isLeadBattleAvatarActive,
    syncLeadCreatureStats,
} from "./lead-battle-avatar";
import { buildBestiaryPanel } from "./bestiary-panel";
import { playMicroGame } from "./micro-game";
import { showDictionaryExport } from "./dictionary-export";
import {
    DICTIONARY_EXPORT_CONFIG,
    GAME_RULES_CONFIG,
    MICRO_GAME_CONFIG,
    PAUSE_MENU_CONFIG,
    PARTY_PANEL_HEAL_ITEM_ID,
    PAUSE_FOOTER_ENTRIES,
    PAUSE_ROUTES_CONFIG,
    SETTINGS_CONFIG,
    VOCABULARY_SCREEN_CONFIG,
} from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

export type PauseMenuAction = { kind: "resume" } | { kind: "title" };

type PauseRoute = (typeof PAUSE_ROUTES_CONFIG)[number]["id"];
const BESTIARY_READ_PREFIX = "bestiary-read:";
const VOCABULARY_CARD_PREFIX = "vocab-card:";
const SENTENCE_LOG_ACTION_ID = "sentence-log";
const MICRO_GAME_ACTION_ID = "micro-game";
const DICTIONARY_EXPORT_ACTION_ID = "dictionary-export";

type PauseEntry = {
    id?: string;
    label: string;
    meta?: string;
    testId?: string;
    disabled?: boolean;
    kind?: "party-slot" | "party-detail";
    portraitSrc?: string | null;
    portraitFallback?: string;
    secondaryLabel?: string | null;
    levelLabel?: string;
    hpLabel?: string;
    hpPercent?: number;
    hpClass?: string;
    typeLabel?: string;
    detailLines?: string[];
    selected?: boolean;
};

const PAUSE_ROUTES: Array<PauseEntry & { id: `route:${PauseRoute}` }> = [
    ...PAUSE_ROUTES_CONFIG.map((route) => ({
        id: `route:${route.id}` as `route:${PauseRoute}`,
        label: route.label,
        testId: route.testId,
    })),
];

async function autosave(player: RpgPlayer): Promise<void> {
    try {
        const save = (player as unknown as { save?: (slot: number) => Promise<void> }).save;
        if (typeof save === "function") {
            await save.call(player, AUTOSAVE_SLOT);
        }
    } catch {
        // Best-effort.
    }
}

export async function showPauseMenu(player: RpgPlayer): Promise<PauseMenuAction> {
    let activeRoute: PauseRoute = PAUSE_MENU_CONFIG.defaultRouteId;
    let selectedPartySlot: number | null = null;
    for (;;) {
        const choice = await showPauseScreen(player, activeRoute, selectedPartySlot);
        if (!choice?.id || choice.id === "resume") return { kind: "resume" };

        if (choice.id.startsWith("route:")) {
            activeRoute = choice.id.replace("route:", "") as PauseRoute;
            if (activeRoute !== "party") selectedPartySlot = null;
            continue;
        }

        if (choice.id.startsWith("party-slot:")) {
            selectedPartySlot = Number(choice.id.replace("party-slot:", ""));
            activeRoute = "party";
            continue;
        }

        if (choice.id.startsWith("party-promote:")) {
            const slot = Number(choice.id.replace("party-promote:", ""));
            await promotePartySlotToLead(player, slot);
            selectedPartySlot = 0;
            activeRoute = "party";
            continue;
        }

        if (choice.id.startsWith("party-heal:")) {
            const [, itemId, slotRaw] = choice.id.split(":");
            const slot = Number(slotRaw);
            await healPartySlot(player, itemId, slot);
            selectedPartySlot = slot;
            activeRoute = "party";
            continue;
        }

        if (choice.id.startsWith(BESTIARY_READ_PREFIX)) {
            await showBestiaryReadText(player, choice.id.slice(BESTIARY_READ_PREFIX.length));
            selectedPartySlot = null;
            activeRoute = "bestiary";
            continue;
        }

        if (choice.id.startsWith(VOCABULARY_CARD_PREFIX)) {
            await showVocabularyGlyphCard(
                player,
                decodeURIComponent(choice.id.slice(VOCABULARY_CARD_PREFIX.length)),
            );
            selectedPartySlot = null;
            activeRoute = "vocab";
            continue;
        }

        if (choice.id === SENTENCE_LOG_ACTION_ID) {
            await showSentenceLog(player);
            selectedPartySlot = null;
            activeRoute = "vocab";
            continue;
        }

        if (choice.id === MICRO_GAME_ACTION_ID) {
            await playMicroGame(player);
            selectedPartySlot = null;
            activeRoute = "vocab";
            continue;
        }

        if (choice.id === DICTIONARY_EXPORT_ACTION_ID) {
            await showDictionaryExport(player);
            selectedPartySlot = null;
            activeRoute = "vocab";
            continue;
        }

        switch (choice.id) {
            case "open-detail":
                if (activeRoute === "party" || activeRoute === "inventory") {
                    await showInventory(player);
                } else if (activeRoute === "vocab") {
                    await showVocabulary(player);
                } else {
                    await showSettings(player);
                }
                break;
            case "inventory":
                await showInventory(player);
                break;
            case "vocab":
                await showVocabulary(player);
                break;
            case "save":
                await showSaveMenu(player);
                break;
            case "settings":
                await showSettings(player);
                break;
            case "title": {
                await autosave(player);
                return { kind: "title" };
            }
        }
    }
}

async function showPauseScreen(
    player: RpgPlayer,
    activeRoute: PauseRoute,
    selectedPartySlot: number | null,
): Promise<{ id?: string } | null> {
    const gui = player.gui(PAUSE_MENU_CONFIG.guiId);
    gui.on("select", (selection) => {
        gui.close(selection);
    });

    const content = await buildRouteContent(player, activeRoute, selectedPartySlot);
    return gui.open(
        {
            title: PAUSE_MENU_CONFIG.title,
            activeRoute,
            routes: PAUSE_ROUTES,
            contentTitle: content.title,
            contentRows: content.rows,
            footerEntries: PAUSE_FOOTER_ENTRIES,
        },
        {
            waitingAction: true,
            blockPlayerInput: true,
        },
    ) as Promise<{ id?: string } | null>;
}

async function buildRouteContent(
    player: RpgPlayer,
    route: PauseRoute,
    selectedPartySlot: number | null,
): Promise<{ title: string; rows: PauseEntry[] }> {
    switch (route) {
        case "glance":
            return buildGlanceContent();
        case "party":
            return buildPartyContent(player, selectedPartySlot);
        case "vocab":
            return buildVocabContent();
        case "inventory":
            return buildInventoryContent();
        case "bestiary":
            return buildBestiaryContent();
        case "settings":
            return buildSettingsContent();
    }
}

/**
 * T11-09 — glance dashboard.
 *
 * Read-only snapshot that the player sees first when they open the
 * pause menu. The row set stays the same regardless of game state
 * (party empty or full, clues zero or mastered, starter chosen or
 * not) — the widget's job is to tell the player "here's where you
 * are, here's what's next" in four lines. Other routes do the
 * interactive work.
 */
async function buildGlanceContent(): Promise<{ title: string; rows: PauseEntry[] }> {
    const copy = PAUSE_MENU_CONFIG.glance;
    const [party, mastered, bestiary, starterFlag, activeSeed] = await Promise.all([
        getPartyWithHealth(),
        listMasteredWords(VOCABULARY_SCREEN_CONFIG.masteryThreshold),
        getBestiaryState(),
        getFlag("starter_chosen"),
        loadActiveSeed(),
    ]);
    const partyMax = GAME_RULES_CONFIG.partySizeMax;
    const lead = party[0];
    // BestiaryState is a keyed record; split entries into seen-only
    // vs caught. An entry with caughtAt counts as caught (and is no
    // longer "just seen"), matching how the bestiary panel displays
    // tier progression.
    let seenCount = 0;
    let caughtCount = 0;
    for (const rec of Object.values(bestiary)) {
        if (rec.caughtAt) caughtCount++;
        else if (rec.seenAt) seenCount++;
    }
    const totalSpecies = seenCount + caughtCount;

    const rows: PauseEntry[] = [
        {
            id: "glance-party",
            label: formatGameplayTemplate(copy.partyRowLabelTemplate, {
                count: party.length,
                max: partyMax,
            }),
            meta: lead
                ? formatGameplayTemplate(copy.partyRowMetaLeadTemplate, {
                      name: lead.species_id,
                  })
                : copy.partyRowMetaEmpty,
            testId: "glance-party",
            disabled: true,
        },
        {
            id: "glance-clues",
            label: formatGameplayTemplate(copy.cluesRowLabelTemplate, {
                count: mastered.length,
            }),
            meta:
                mastered.length === 0
                    ? copy.cluesRowMetaEmpty
                    : formatGameplayTemplate(copy.cluesRowMetaTemplate, {
                          count: mastered.length,
                      }),
            testId: "glance-clues",
            disabled: true,
        },
        {
            id: "glance-bestiary",
            label: formatGameplayTemplate(copy.bestiaryRowLabelTemplate, {
                seen: seenCount,
                caught: caughtCount,
            }),
            meta: formatGameplayTemplate(copy.bestiaryRowMetaTotalTemplate, {
                total: totalSpecies,
            }),
            testId: "glance-bestiary",
            disabled: true,
        },
        {
            id: "glance-objective",
            label: starterFlag
                ? copy.objectiveRowLabelPostStarter
                : copy.objectiveRowLabelPreStarter,
            meta: copy.objectiveRowMeta,
            testId: "glance-objective",
            disabled: true,
        },
        {
            id: "glance-seed",
            label: activeSeed !== null
                ? formatGameplayTemplate(copy.seedRowLabelTemplate, { seed: seedDisplay(activeSeed) })
                : copy.seedRowLabelTemplate.replace("{seed}", "—"),
            meta: copy.seedRowMeta,
            testId: "glance-seed",
            disabled: true,
        },
    ];

    return { title: copy.title, rows };
}

async function buildPartyContent(
    player: RpgPlayer,
    selectedPartySlot: number | null,
): Promise<{ title: string; rows: PauseEntry[] }> {
    const copy = PAUSE_MENU_CONFIG.party;
    const [party, kiliCount] = await Promise.all([
        getPartyWithHealth(),
        getInventoryCount(PARTY_PANEL_HEAL_ITEM_ID),
    ]);
    const leadHp = leadHpSnapshot(player);
    const slots = party.map((slot) =>
        buildPartyPanelSlot(slot, {
            selectedSlot: selectedPartySlot,
            leadHp: slot.slot === 0 ? leadHp : null,
        }),
    );
    const rows: PauseEntry[] = slots.length ? slots.map(partySlotEntry) : [copy.empty];
    const selected = slots.find((slot) => slot.slot === selectedPartySlot);
    if (selected) {
        rows.push(partyDetailEntry(selected));
        const healEntry = partyHealEntry(selected, kiliCount);
        if (healEntry) {
            rows.push(healEntry);
        }
        if (!selected.isLead) {
            const fainted = selected.currentHp <= 0;
            rows.push({
                id: fainted ? undefined : `party-promote:${selected.slot}`,
                label: copy.promoteLabel,
                meta: fainted
                    ? copy.faintedMeta
                    : formatGameplayTemplate(copy.promoteMetaTemplate, { from: selected.slot + 1 }),
                testId: `party-promote-${selected.slot}`,
                disabled: fainted,
            });
        }
    } else if (slots.length > 0) {
        rows.push(copy.selectHint);
    }
    return {
        title: formatGameplayTemplate(copy.titleTemplate, {
            count: party.length,
            max: GAME_RULES_CONFIG.partySizeMax,
        }),
        rows,
    };
}

function partySlotEntry(slot: PartyPanelSlot): PauseEntry {
    return {
        id: `party-slot:${slot.slot}`,
        kind: "party-slot",
        label: slot.primaryLabel,
        meta: slot.levelLabel,
        testId: `party-slot-${slot.slot}`,
        portraitSrc: slot.portraitSrc,
        portraitFallback: slot.portraitFallback,
        secondaryLabel: slot.secondaryLabel,
        levelLabel: slot.levelLabel,
        hpLabel: slot.hpLabel,
        hpPercent: slot.hpPercent,
        hpClass: slot.hpClass,
        typeLabel: slot.typeLabel,
        selected: slot.selected,
    };
}

function partyDetailEntry(slot: PartyPanelSlot): PauseEntry {
    const copy = PAUSE_MENU_CONFIG.party;
    return {
        kind: "party-detail",
        label: formatGameplayTemplate(copy.detailLabelTemplate, { name: slot.primaryLabel }),
        testId: "party-detail-card",
        detailLines: [
            formatGameplayTemplate(copy.detailTypeTemplate, { type: slot.typeLabel }),
            slot.xpLabel,
            slot.nextXpLabel,
            formatGameplayTemplate(copy.detailMovesTemplate, { moves: slot.moveSummary }),
        ],
    };
}

function partyHealEntry(slot: PartyPanelSlot, inventoryCount: number): PauseEntry | null {
    const copy = PAUSE_MENU_CONFIG.party;
    const item = healingItem(PARTY_PANEL_HEAL_ITEM_ID);
    if (!item) return null;
    const preview = applyHeal(slot, item.amount);
    const disabled = inventoryCount <= 0 || preview.healed <= 0;
    return {
        id: `party-heal:${item.id}:${slot.slot}`,
        label: item.label,
        meta: disabled
            ? inventoryCount <= 0
                ? copy.healEmptyMeta
                : copy.healFullMeta
            : formatGameplayTemplate(copy.healMetaTemplate, {
                  healed: preview.healed,
                  count: inventoryCount,
              }),
        testId: `party-heal-${slot.slot}`,
        disabled,
    };
}

async function promotePartySlotToLead(player: RpgPlayer, slot: number): Promise<void> {
    const currentLeadHp = leadHpSnapshot(player);
    if (currentLeadHp) {
        await setPartyCurrentHp(0, currentLeadHp.currentHp);
    }

    const party = await getPartyWithHealth();
    const fromIndex = party.findIndex((member) => member.slot === slot);
    if (fromIndex <= 0) return;
    const promotedHp = resolvePartyPanelHp(party[fromIndex]);
    await setPartyOrder(promoteToLead(party, fromIndex));
    setPlayerHp(player, promotedHp.currentHp);
    if (isLeadBattleAvatarActive(player)) {
        await activateLeadBattleAvatar(player);
    } else {
        await syncLeadCreatureStats(player);
    }
}

async function healPartySlot(player: RpgPlayer, itemId: string, slot: number): Promise<void> {
    const item = healingItem(itemId);
    if (!item) return;

    const party = await getPartyWithHealth();
    const member = party.find((row) => row.slot === slot);
    if (!member) return;

    const panelSlot = buildPartyPanelSlot(member, {
        leadHp: slot === 0 ? leadHpSnapshot(player) : null,
    });
    const heal = applyHeal(panelSlot, item.amount);
    if (heal.healed <= 0) return;

    const consumed = await consumeInventoryItem(item.id, 1);
    if (!consumed) return;

    await setPartyCurrentHp(slot, heal.nextHp);
    if (slot === 0) {
        setPlayerHp(player, heal.nextHp);
        await syncLeadCreatureStats(player);
    }
}

async function buildVocabContent(): Promise<{ title: string; rows: PauseEntry[] }> {
    const copy = PAUSE_MENU_CONFIG.vocabulary;
    const [mastered, sentenceCount] = await Promise.all([
        listMasteredWords(VOCABULARY_SCREEN_CONFIG.masteryThreshold),
        getSentenceLogCount(),
    ]);
    const rows: PauseEntry[] = [];
    for (const word of mastered.slice(0, copy.previewLimit)) {
        const sightings = await getWordSightings(word);
        rows.push({
            id: `${VOCABULARY_CARD_PREFIX}${encodeURIComponent(word)}`,
            label: formatVocabularyRowLabel(word),
            meta: formatGameplayTemplate(copy.sightingMetaTemplate, {
                count: sightings,
            }),
            testId: `vocab-entry-${word}`,
        });
    }
    if (mastered.length === 0) {
        rows.push(copy.empty);
    }
    rows.push({
        id: SENTENCE_LOG_ACTION_ID,
        label: copy.sentenceLogAction.label,
        meta: formatGameplayTemplate(copy.sentenceLogAction.meta ?? "", {
            count: sentenceCount,
        }),
        testId: "sentence-log-action",
    });
    rows.push({
        id: MICRO_GAME_ACTION_ID,
        label: MICRO_GAME_CONFIG.action.label,
        meta: MICRO_GAME_CONFIG.action.meta,
        testId: "micro-game-action",
    });
    rows.push({
        id: DICTIONARY_EXPORT_ACTION_ID,
        label: DICTIONARY_EXPORT_CONFIG.runtime.action.label,
        meta: DICTIONARY_EXPORT_CONFIG.runtime.action.meta,
        testId: "dictionary-export-action",
    });
    return {
        title: formatGameplayTemplate(copy.titleTemplate, {
            count: mastered.length,
            total: dictionarySize(),
        }),
        rows: [...rows, { id: "open-detail", ...copy.detailAction }],
    };
}

async function showVocabularyGlyphCard(player: RpgPlayer, word: string): Promise<void> {
    const sightings = await getWordSightings(word);
    await player.showText(formatVocabularyGlyphCard(word, sightings));
}

async function buildInventoryContent(): Promise<{ title: string; rows: PauseEntry[] }> {
    const copy = PAUSE_MENU_CONFIG.inventory;
    const items = await listInventoryItems();
    return {
        title: formatGameplayTemplate(copy.titleTemplate, { count: items.length }),
        rows: [
            ...items.slice(0, copy.previewLimit).map((item) => ({
                label: item.item_id.replace(/_/g, " "),
                meta: formatGameplayTemplate(copy.itemCountMetaTemplate, { count: item.count }),
            })),
            { id: "open-detail", ...copy.detailAction },
        ],
    };
}

async function buildBestiaryContent(): Promise<{ title: string; rows: PauseEntry[] }> {
    const panel = buildBestiaryPanel(await getBestiaryState());
    return {
        title: panel.title,
        rows: panel.rows.map((row) => ({
            id: row.readText ? `${BESTIARY_READ_PREFIX}${row.speciesId}` : undefined,
            label: row.label,
            meta: row.meta,
            testId: row.testId,
            disabled: !row.readText,
        })),
    };
}

async function showBestiaryReadText(player: RpgPlayer, speciesId: string): Promise<void> {
    const panel = buildBestiaryPanel(await getBestiaryState());
    const row = panel.rows.find((entry) => entry.speciesId === speciesId);
    if (!row?.readText) return;
    await player.showText(row.readText);
}

async function buildSettingsContent(): Promise<{ title: string; rows: PauseEntry[] }> {
    const [sitelen, textSpeed, highContrast, accessibleMode, bgm, sfx] = await Promise.all([
        getSitelenOverlay(),
        getTextSpeed(),
        getHighContrast(),
        getAccessibleMode(),
        getBgmVolume(),
        getSfxVolume(),
    ]);
    const state = { sitelen, textSpeed, highContrast, accessibleMode, bgm, sfx };
    return {
        title: SETTINGS_CONFIG.pauseSummary.title,
        rows: [
            ...SETTINGS_CONFIG.pauseSummary.rows.map((row) => ({
                label: row.label,
                meta: settingsPauseSummaryMeta(row.value, row.metaTemplate, state),
            })),
            { id: "open-detail", ...SETTINGS_CONFIG.pauseSummary.detailAction },
        ],
    };
}

function settingsPauseSummaryMeta(
    value: string,
    template: string,
    state: {
        sitelen: boolean;
        textSpeed: number;
        highContrast: boolean;
        accessibleMode: boolean;
        bgm: number;
        sfx: number;
    },
): string {
    const stateLabels = SETTINGS_CONFIG.stateLabels;
    switch (value) {
        case "sitelen":
            return formatGameplayTemplate(template, {
                state: state.sitelen ? stateLabels.on : stateLabels.off,
            });
        case "text_speed":
            return formatGameplayTemplate(template, { value: state.textSpeed });
        case "contrast":
            return formatGameplayTemplate(template, {
                state: state.highContrast ? stateLabels.on : stateLabels.off,
            });
        case "accessible":
            return formatGameplayTemplate(template, {
                state: state.accessibleMode ? stateLabels.on : stateLabels.off,
            });
        case "volume":
            return formatGameplayTemplate(template, { bgm: state.bgm, sfx: state.sfx });
        default:
            return template;
    }
}
