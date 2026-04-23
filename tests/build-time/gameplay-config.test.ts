import { describe, expect, it } from 'vitest';
import worldRaw from '../../src/content/generated/world.json';
import {
    BADGE_DEFINITIONS,
    AUDIO_RUNTIME_CONFIG,
    BATTLE_AI_BOOTSTRAP_CONFIG,
    BGM_FILES,
    BGM_SELECTION_CONFIG,
    BOSS_SPRITESHEET_CONFIGS,
    BATTLE_COIN_REWARDS,
    BESTIARY_PANEL_CONFIG,
    COIN_ITEM_ID,
    COMBATANT_SPRITESHEET_CONFIGS,
    COMBAT_CHROME_CONFIG,
    CREDITS_PAGES,
    DAYCARE_CONFIG,
    DEFAULT_RESPAWN,
    DEFEAT_SCREEN_CONFIG,
    DIALOG_UI_CONFIG,
    DICTIONARY_EXPORT_CONFIG,
    EFFECT_SPRITESHEET_CONFIGS,
    ENCOUNTER_CONFIG,
    FINAL_BOSS_CONFIG,
    GAMEPLAY_MAPS,
    GAME_RULES_CONFIG,
    GYM_PHASE_POLL_MS,
    HUD_HINT_CONFIG,
    HUD_MENU_CONFIG,
    HUD_NON_BLOCKING_GUI_IDS,
    HUD_GUI_IDS,
    HUD_STATUS_CONFIG,
    INTERACTION_HINT_CONFIG,
    INTERACTION_HINT_BATTLE_EVENT_IDS,
    INVENTORY_SCREEN_CONFIG,
    ITEM_DROP_FALLBACK_BY_TYPE,
    ITEM_DROP_TIER_DEFAULTS,
    LEVEL_CURVE_CONFIG,
    MAP_EVENT_CONFIGS,
    MICRO_GAME_CONFIG,
    NEW_GAME_PLUS_CONFIG,
    NOTIFICATION_CONFIG,
    NPC_SPRITESHEET_CONFIGS,
    PAUSE_MENU_CONFIG,
    PAUSE_FOOTER_ENTRIES,
    PAUSE_ROUTES_CONFIG,
    PARTY_PANEL_CONFIG,
    PARTY_PANEL_HEAL_ITEM_ID,
    PIXI_GUARDED_FX_ALIASES,
    PLAYER_CONFIG,
    PLAYER_SPRITESHEET_CONFIGS,
    REGION_XP_CURVE,
    REMATCH_CONFIG,
    SAVE_MENU_CONFIG,
    SETTINGS_CONFIG,
    SFX_BASE_VOLUMES,
    SFX_CUE_CONFIG,
    SFX_EVENTS,
    SFX_FILES,
    SHOP_UI_CONFIG,
    TAP_CONTROL_BLOCKING_UI_SELECTORS,
    TAP_CONTROL_TARGET_BLOCKING_UI_SELECTORS,
    TAP_ROUTE_CONFIG,
    SHOPS,
    SIDE_QUEST_CONFIGS,
    QUEST_UI_CONFIG,
    STARTER_INITIAL_ITEMS,
    STARTER_CEREMONY_CONFIG,
    STARTERS,
    STATUS_EFFECT_CONFIG,
    SPRITE_LAYOUTS,
    TITLE_MENU_CONFIG,
    TITLE_START,
    TRAINER_BATTLE_CONFIGS,
    WARP_LOADING_CONFIG,
    WILD_COMBAT_CONFIG,
    VOCABULARY_SCREEN_CONFIG,
    COMBAT_UI_CONFIG,
    COMBAT_AUDIO_CONFIG,
    TYPE_MATCHUP_CONFIG,
} from '../../src/content/gameplay';
import { runtimeEventPosition, runtimeWarpTarget } from '../../src/modules/main/runtime-map-events';

const WORLD = worldRaw as {
    species: Array<{ id: string }>;
    items: Array<{ id: string }>;
    dialog: Array<{ id: string }>;
};

const speciesIds = new Set(WORLD.species.map((species) => species.id));
const itemIds = new Set(WORLD.items.map((item) => item.id));
const dialogIds = new Set(WORLD.dialog.map((dialog) => dialog.id));
const mapIds = new Set(Object.keys(GAMEPLAY_MAPS));
const biomeIds = new Set(Object.values(GAMEPLAY_MAPS).map((map) => map.biome));

describe('gameplay JSON config', () => {
    it('keeps map labels, music, and respawn anchors in config', () => {
        expect(mapIds.has(DEFAULT_RESPAWN.map_id)).toBe(true);
        expect(GAMEPLAY_MAPS[DEFAULT_RESPAWN.map_id]?.safe_spawn).toEqual({
            x: DEFAULT_RESPAWN.x,
            y: DEFAULT_RESPAWN.y,
        });
        expect(Object.values(GAMEPLAY_MAPS).filter((map) => map.safe_spawn)).toHaveLength(3);
        expect(GAMEPLAY_MAPS.rivergate_approach?.label).toBe('Rivergate Approach');
    });

    it('keeps badge, starter, and shop data referentially valid', () => {
        expect(BADGE_DEFINITIONS.map((badge) => badge.flag)).toEqual([
            'badge_sewi',
            'badge_telo',
            'badge_lete',
            'badge_suli',
        ]);
        for (const badge of BADGE_DEFINITIONS) {
            expect(REGION_XP_CURVE[badge.flag], badge.flag).toBeGreaterThan(0);
        }
        expect(LEVEL_CURVE_CONFIG).toEqual({
            minLevel: 1,
            maxLevel: 50,
            exponent: 3,
        });
        expect(GAME_RULES_CONFIG).toEqual({
            partySizeMax: 6,
            autosaveSlot: 0,
            manualSaveSlots: [1, 2, 3],
        });
        expect(mapIds.has(NEW_GAME_PLUS_CONFIG.startMapId)).toBe(true);
        expect(NEW_GAME_PLUS_CONFIG.startJourneyBeatId).toBe('beat_01_riverside_home');
        expect(NEW_GAME_PLUS_CONFIG.requiredClearedFlag).toBe('game_cleared');
        expect(NEW_GAME_PLUS_CONFIG.levelReduction).toBeGreaterThan(0);
        expect(NEW_GAME_PLUS_CONFIG.legendaryMultiplierCap).toBeGreaterThanOrEqual(
            NEW_GAME_PLUS_CONFIG.legendaryMultiplierBase,
        );
        for (const itemId of Object.keys(NEW_GAME_PLUS_CONFIG.rewardInventory)) {
            expect(itemIds.has(itemId), itemId).toBe(true);
        }
        expect(itemIds.has(COIN_ITEM_ID)).toBe(true);
        expect(Object.values(BATTLE_COIN_REWARDS).every((amount) => amount > 0)).toBe(true);

        for (const starter of STARTERS) {
            expect(speciesIds.has(starter.id), starter.id).toBe(true);
            expect(starter.starting_clues).toContain('capture-pods');
        }
        for (const item of STARTER_INITIAL_ITEMS) {
            expect(itemIds.has(item.itemId), item.itemId).toBe(true);
        }
        for (const shop of Object.values(SHOPS)) {
            expect(dialogIds.has(shop.dialogId), shop.dialogId).toBe(true);
            expect(shop.deliveryNpcId.length).toBeGreaterThan(0);
            expect(shop.graphic.length).toBeGreaterThan(0);
            for (const item of shop.stock) {
                expect(itemIds.has(item.itemId), item.itemId).toBe(true);
            }
        }
    });

    it('keeps side quests connected to known maps, items, species, and biomes', () => {
        const questIds = new Set<string>();
        for (const quest of SIDE_QUEST_CONFIGS) {
            expect(questIds.has(quest.id), quest.id).toBe(false);
            questIds.add(quest.id);

            if (quest.mapId) expect(mapIds.has(quest.mapId), quest.id).toBe(true);
            if (quest.reward.itemId) expect(itemIds.has(quest.reward.itemId), quest.id).toBe(true);

            switch (quest.goal.kind) {
                case 'catch_count':
                    expect(speciesIds.has(quest.goal.speciesId), quest.id).toBe(true);
                    break;
                case 'catch_any_in_biome':
                    expect(biomeIds.has(quest.goal.biome), quest.id).toBe(true);
                    break;
                case 'deliver_item':
                    expect(itemIds.has(quest.goal.itemId), quest.id).toBe(true);
                    break;
                case 'defeat_trainer':
                    expect(quest.goal.npcId.length, quest.id).toBeGreaterThan(0);
                    break;
            }
        }
    });

    it('keeps runtime map events connected to known maps, dialogs, quests, and trainers', () => {
        const questIds = new Set(SIDE_QUEST_CONFIGS.map((quest) => quest.id));
        for (const [mapId, events] of Object.entries(MAP_EVENT_CONFIGS)) {
            expect(mapIds.has(mapId), mapId).toBe(true);
            expect(events.length, mapId).toBeGreaterThanOrEqual(5);

            const eventIds = new Set<string>();
            for (const event of events) {
                expect(eventIds.has(event.id), `${mapId}:${event.id}`).toBe(false);
                eventIds.add(event.id);
                expect(runtimeEventPosition(mapId, event), `${mapId}:${event.id}`).toMatchObject({
                    x: expect.any(Number),
                    y: expect.any(Number),
                });

                if (event.kind === 'ambient_npc' || event.kind === 'quest_npc') {
                    expect(dialogIds.has(event.dialogId), `${mapId}:${event.id}`).toBe(true);
                }
                if (event.kind === 'quest_npc') {
                    expect(questIds.has(event.questId), `${mapId}:${event.id}`).toBe(true);
                }
                if (event.kind === 'rival' || event.kind === 'gym_leader') {
                    expect(TRAINER_BATTLE_CONFIGS[event.trainerId], `${mapId}:${event.id}`).toBeDefined();
                }
                if (event.kind === 'warp') {
                    const target = runtimeWarpTarget(mapId, event);
                    expect(mapIds.has(target.targetMap), `${mapId}:${event.id}`).toBe(true);
                }
            }
        }
        expect(MAP_EVENT_CONFIGS.rivergate_approach?.some((event) => event.kind === 'green_dragon')).toBe(true);
        expect(runtimeEventPosition('greenwood_road', MAP_EVENT_CONFIGS.greenwood_road!.find((event) => event.id === 'jan-ike')!))
            .toEqual({ x: 448, y: 88 });
        expect(runtimeWarpTarget(
            'riverside_home',
            MAP_EVENT_CONFIGS.riverside_home!.find((event) => event.id === 'warp_east') as Extract<
                (typeof MAP_EVENT_CONFIGS.riverside_home)[number],
                { kind: 'warp' }
            >,
        ).position).toEqual({ x: 32, y: 96 });
    });

    it('keeps species item-drop fallback data item-backed and tier-backed', () => {
        for (const itemId of Object.values(ITEM_DROP_FALLBACK_BY_TYPE)) {
            expect(itemIds.has(itemId), itemId).toBe(true);
        }
        expect(ITEM_DROP_TIER_DEFAULTS.common.chance).toBeGreaterThan(0);
        expect(ITEM_DROP_TIER_DEFAULTS.uncommon.chance).toBeGreaterThan(
            ITEM_DROP_TIER_DEFAULTS.common.chance,
        );
        expect(ITEM_DROP_TIER_DEFAULTS.legendary.chance).toBe(1);
    });

    it('keeps Field Notes micro-game data in gameplay JSON', () => {
        expect(MICRO_GAME_CONFIG.action).toEqual({ label: 'Field Notes', meta: 'clue check' });
        expect(MICRO_GAME_CONFIG.roundCount).toBe(3);
        expect(MICRO_GAME_CONFIG.pool.length).toBeGreaterThanOrEqual(4);
        expect(new Set(MICRO_GAME_CONFIG.pool.map((entry) => entry.text)).size).toBe(
            MICRO_GAME_CONFIG.pool.length,
        );
    });

    it('keeps status-effect combat tuning data-backed', () => {
        expect(STATUS_EFFECT_CONFIG.applicationRules.map((rule) => rule.statusId)).toEqual([
            'burn',
            'wet',
            'frozen',
        ]);
        expect(STATUS_EFFECT_CONFIG.tickEffects.burn?.damageMaxHpDivisor).toBe(16);
        expect(STATUS_EFFECT_CONFIG.tickEffects.frozen?.skipNextTurn).toBe(true);
        expect(STATUS_EFFECT_CONFIG.damageMultipliers).toContainEqual({
            incomingType: 'lete',
            targetStatus: 'wet',
            multiplier: 1.5,
        });
        expect(WILD_COMBAT_CONFIG.targetHp).toEqual({
            baseFloor: 1,
            levelFloor: 1,
            levelMultiplier: 2,
        });
        expect(WILD_COMBAT_CONFIG.fightDamage).toMatchObject({
            statDeltaDivisor: 6,
            baseDamage: 8,
            levelMultiplier: 3,
        });
        expect(WILD_COMBAT_CONFIG.applyDamage.targetHpFloorAfterAttack).toBe(1);
    });

    it('keeps daycare offspring tuning data-backed', () => {
        expect(DAYCARE_CONFIG.offspringLevel).toBe(1);
        expect(DAYCARE_CONFIG.defaultChildSuffix).toBe('_lili');
        expect(DAYCARE_CONFIG.statJitterFraction).toBe(0.1);
        expect(DAYCARE_CONFIG.statMin).toBeLessThan(DAYCARE_CONFIG.statMax);
        expect(DAYCARE_CONFIG.parentInheritedMoveLevel).toBe(1);
        expect(DAYCARE_CONFIG.childLearnsetMaxLevel).toBe(5);
        expect(DAYCARE_CONFIG.typeInheritance.dominantTypes).toEqual(['wawa']);
        expect(DAYCARE_CONFIG.typeInheritance.deferToOtherTypes).toEqual(['lete']);
        expect(DAYCARE_CONFIG.typeInheritance.pairOverrides.seli_telo).toBe('kasi');
    });

    it('keeps audio, title, and credits config structurally usable', () => {
        expect(Object.keys(BGM_FILES)).toContain('bgm_menu');
        expect(Object.values(BGM_FILES).every((file) => file.endsWith('.ogg'))).toBe(true);
        expect(BGM_FILES[BGM_SELECTION_CONFIG.defaultCombatTrack]).toMatch(/\.ogg$/);
        expect(BGM_FILES[BGM_SELECTION_CONFIG.gymCombatTrack]).toMatch(/\.ogg$/);
        expect(BGM_SELECTION_CONFIG.gymMapPrefixes).toEqual([
            'highridge_pass',
            'lakehaven',
            'frostvale',
            'dreadpeak_cavern',
        ]);
        expect(BGM_SELECTION_CONFIG.mapCombatOverrides).toEqual({ rivergate_approach: 'bgm_boss' });
        expect(SFX_EVENTS).toHaveLength(12);
        expect(new Set(SFX_EVENTS).size).toBe(SFX_EVENTS.length);
        for (const eventId of SFX_EVENTS) {
            expect(SFX_FILES[eventId], eventId).toMatch(/\.ogg$/);
            expect(SFX_BASE_VOLUMES[eventId], eventId).toBeGreaterThan(0);
        }
        for (const [cueName, eventId] of Object.entries(SFX_CUE_CONFIG)) {
            expect(SFX_FILES[eventId], cueName).toBeDefined();
        }
        expect(SFX_CUE_CONFIG).toMatchObject({
            battleAction: 'sfx_hit',
            encounterAppear: 'sfx_encounter_appear',
            trainerFaint: 'sfx_faint',
        });

        expect(mapIds.has(TITLE_START.mapId)).toBe(true);
        expect(TITLE_START.spawn).toEqual(GAMEPLAY_MAPS[TITLE_START.mapId]?.safe_spawn);
        expect(TITLE_START.journeyBeatId).toBe('beat_01_riverside_home');
        expect(PLAYER_CONFIG.defaultGraphic).toBe('hero');
        expect(TITLE_MENU_CONFIG.guiId).toBe('rpg-title-screen');
        expect(TITLE_MENU_CONFIG.menuTitle).toBe('Rivers Reckoning');
        expect(TITLE_MENU_CONFIG.continueLabelTemplate).toBe('{prefix} — {slot}');
        expect(TITLE_MENU_CONFIG.confirmNewChoices.map((choice) => choice.value)).toEqual(['confirm', 'cancel']);
        expect(TITLE_MENU_CONFIG.entries.map((entry) => entry.id)).toEqual(['new', 'settings', 'quit']);
        expect(STARTER_CEREMONY_CONFIG).toMatchObject({
            mentorGraphic: 'npc_villager_fem_nel',
            choicePrompt: 'Choose your first companion.',
            notificationMs: 3500,
        });
        expect(PAUSE_MENU_CONFIG.guiId).toBe('poki-pause-screen');
        expect(PAUSE_MENU_CONFIG.title).toBe('Menu');
        expect(PAUSE_MENU_CONFIG.routesAriaLabel).toBe('Pause routes');
        expect(PAUSE_MENU_CONFIG.defaultRouteId).toBe('party');
        expect(PAUSE_ROUTES_CONFIG.map((route) => route.id)).toEqual([
            'party',
            'vocab',
            'inventory',
            'bestiary',
            'settings',
        ]);
        expect(PAUSE_FOOTER_ENTRIES.map((entry) => entry.id)).toEqual(['resume', 'save', 'title']);
        expect(PAUSE_MENU_CONFIG.party.titleTemplate).toBe('Party {count} / {max}');
        expect(PAUSE_MENU_CONFIG.party.healMetaTemplate).toBe('+{healed} HP | ×{count}');
        expect(PAUSE_MENU_CONFIG.vocabulary.previewLimit).toBe(6);
        expect(PAUSE_MENU_CONFIG.vocabulary.sentenceLogAction).toEqual({
            label: 'Field Log',
            meta: '{count} entries',
        });
        expect(PAUSE_MENU_CONFIG.inventory.badgeHeldState).toBe('✓');
        expect(itemIds.has(PARTY_PANEL_HEAL_ITEM_ID)).toBe(true);
        expect(HUD_GUI_IDS).toEqual({
            status: 'poki-hud-status',
            hint: 'poki-hud-hint',
            menu: 'poki-hud-menu-toggle',
        });
        expect(HUD_STATUS_CONFIG.hpLabelTemplate).toBe('HP {current} / {max}');
        expect(HUD_MENU_CONFIG.ariaLabel).toBe('Pause menu');
        expect(HUD_HINT_CONFIG).toMatchObject({
            ariaLabelTemplate: 'Interact hint {glyph}',
            emptyAriaLabel: 'Interact hint',
            pollMs: 150,
            offsetY: -18,
        });
        expect(HUD_NON_BLOCKING_GUI_IDS).toContain('poki-hud-menu-toggle');
        expect(INTERACTION_HINT_CONFIG.glyphs).toEqual({
            default: 'talk',
            battle: 'battle',
            warp: 'travel',
            encounter: 'search',
        });
        expect(INTERACTION_HINT_CONFIG.encounterFallbackTargetId).toBe('encounter');
        expect(INTERACTION_HINT_BATTLE_EVENT_IDS).toContain('green-dragon');
        expect(DIALOG_UI_CONFIG.guiId).toBe('rpg-dialog');
        expect(AUDIO_RUNTIME_CONFIG.bgmOverrideEvent).toBe('rivers-reckoning:audio:bgm-override');
        expect(COMBAT_UI_CONFIG).toMatchObject({
            leadMoveBarGuiId: 'poki-lead-movebar',
            leadMoveBarLimit: 4,
            leadMoveBar: {
                levelLabelTemplate: 'L{level}',
                energyLabelTemplate: '{sp} SP',
                defaultTargetStatus: 'move close, then tap a move',
                inRangeTemplate: 'in range · {tiles} {tile_label}',
                moveMetaTemplate: '{type} · power {power} · {sp} SP',
                emptyAriaLabel: 'lead creature moves',
                readyLabel: 'ready',
                switchActionLabel: 'Party',
                switchTitle: 'Switch lead',
            },
            leadMoveTuning: {
                maxSpFloor: 12,
                maxSpCostMultiplier: 3,
                spCostMin: 1,
                spCostMax: 8,
                defaultRangeTiles: 3,
                rangeTilesByType: { wawa: 1 },
            },
            wildBattleGuiId: 'poki-wild-battle',
            wildBattle: {
                levelLabelPrefix: 'L',
                hpLabelPrefix: 'HP',
                levelLabelTemplate: '{prefix}{level}',
                hpLabelTemplate: '{prefix} {current} / {max}',
                promptTemplate: '{label} {level}\n{hp} · {tier}',
                fightResultTemplate: '{action}: {damage}\n{target} {hp} · {tier}',
                damageMissLabel: 'Miss',
                damageLabelTemplate: '-{damage} {hp_label}',
                damagePopupTemplate: '{damage} · {tone}',
                damageNotificationMs: 1200,
                captureLabels: {
                    throw: 'Throw!',
                    caught: 'Caught!',
                    escaped: 'It broke free!',
                },
                choiceLabels: {
                    fight: 'Fight',
                    catch: 'Catch',
                    item: 'Item',
                    flee: 'Run',
                },
                missingPokiText: 'No capture tools',
                missingLeadLabel: 'No companion',
                missingLeadTypeLabel: 'party',
                battleLabelTemplate: '{lead} vs {target}',
                dialogIds: {
                    appear: 'wild_encounter_appear',
                    caught: 'wild_encounter_caught',
                    escaped: 'wild_encounter_escaped',
                },
            },
        });
        for (const dialogId of Object.values(COMBAT_UI_CONFIG.wildBattle.dialogIds)) {
            expect(dialogIds.has(dialogId), dialogId).toBe(true);
        }
        expect(DEFEAT_SCREEN_CONFIG.guiId).toBe('poki-defeat-screen');
        expect(DEFEAT_SCREEN_CONFIG.enterMs + DEFEAT_SCREEN_CONFIG.settleMs).toBeGreaterThanOrEqual(700);
        expect(DEFEAT_SCREEN_CONFIG.defaultPhase).toBe('fallen');
        expect(dialogIds.has(DEFEAT_SCREEN_CONFIG.reviveDialogId)).toBe(true);
        expect(DEFEAT_SCREEN_CONFIG.ariaLabelTemplate).toBe('{status}: {label}');
        expect(DEFEAT_SCREEN_CONFIG.messageLabel).toBe('Returning to the last safe place.');
        expect(DEFEAT_SCREEN_CONFIG.phaseLabels.returning.statusLabel).toBe('Heading back');
        expect(WARP_LOADING_CONFIG.guiId).toBe('poki-warp-loading');
        expect(WARP_LOADING_CONFIG.enterMs + WARP_LOADING_CONFIG.settleMs).toBeGreaterThanOrEqual(600);
        expect(WARP_LOADING_CONFIG.defaultPhase).toBe('enter');
        expect(WARP_LOADING_CONFIG.ariaLabelTemplate).toBe('{status}: {label}');
        expect(WARP_LOADING_CONFIG.phaseLabels.enter.statusLabel).toBe('Crossing over');
        expect(TAP_ROUTE_CONFIG).toMatchObject({
            event: 'poki:tap-route',
            maxLength: 256,
            movementTileSize: 32,
            bindRetryMs: 50,
            bindRetryMaxAttempts: 200,
            snapRetryMs: 50,
            snapStabilizeMaxAttempts: 20,
            snapMaxAttempts: 300,
        });
        expect(VOCABULARY_SCREEN_CONFIG).toEqual({
            masteryThreshold: 3,
            pageSize: 8,
            summaryTemplate: '{mastered} / {total}',
            rowLabelTemplate: '{glyph} {word}',
            entryTemplate: '{word}  ({sightings}x)',
            glyphCardTemplate: '{glyph}\n{word}\nseen: {sightings}x',
            sentenceLogSummaryTemplate: 'Field log: {count}',
            sentenceLogEmptyText: 'No field notes yet.',
            sentenceDumpLineTemplate: '{text}    // sightings={sightings}    first={first_seen}',
        });
        expect(INVENTORY_SCREEN_CONFIG.partyHeaderTemplate).toBe('Party: {count} / {max}');
        expect(INVENTORY_SCREEN_CONFIG.itemLineTemplate).toBe('  {item} ×{count}');
        expect(PARTY_PANEL_CONFIG.hpLabelTemplate).toBe('HP {current} / {max}');
        expect(PARTY_PANEL_CONFIG.movesEmptyLabel).toBe('moves: none');
        expect(BESTIARY_PANEL_CONFIG.titleTemplate).toBe('Bestiary {caught} / {total}');
        expect(BESTIARY_PANEL_CONFIG.unknownLabelTemplate).toBe('??? {index}');
        expect(BESTIARY_PANEL_CONFIG.descriptionTextTemplate).toBe('{label}\n{description}');
        expect(BESTIARY_PANEL_CONFIG.missingDescriptionText).toBe('Details are still unknown.');
        expect(SAVE_MENU_CONFIG.prompt).toBe('Save');
        expect(SAVE_MENU_CONFIG.actions.map((action) => action.value)).toEqual(['save', 'load', 'cancel']);
        expect(SAVE_MENU_CONFIG.loadedPositionSnapDelayMs).toEqual([500, 1500]);
        expect(DIALOG_UI_CONFIG.missingNodeTemplate).toBe('({dialog_id})');
        expect(DIALOG_UI_CONFIG.defaultPosition).toBe('bottom');
        expect(DIALOG_UI_CONFIG.sitelenOverlayTestId).toBe('dialog-sitelen-overlay');
        expect(DIALOG_UI_CONFIG.confirmSfxId).toBe('sfx_menu_confirm');
        expect(DIALOG_UI_CONFIG.tickSfxId).toBe('sfx_menu_tick');
        expect(QUEST_UI_CONFIG.acceptLabel).toBe('Accept');
        expect(QUEST_UI_CONFIG.goalTemplates.deliver_item).toBe('Deliver: {item} -> {npc}');
        expect(QUEST_UI_CONFIG.journalLineTemplate).toBe('  {mark} {title}: {progress}');
        expect(QUEST_UI_CONFIG.notificationMs).toBe(2500);
        expect(DICTIONARY_EXPORT_CONFIG.runtime).toEqual({
            action: { label: 'Export Clues', meta: 'SVG' },
            defaultPlayerName: 'Rivers',
            downloadFilename: 'rivers-reckoning-clues.svg',
        });
        expect(DICTIONARY_EXPORT_CONFIG.textCard.topWordsLimit).toBe(20);
        expect(DICTIONARY_EXPORT_CONFIG.svgCard.viewBox).toBe('0 0 400 600');
        expect(DICTIONARY_EXPORT_CONFIG.svgCard.grid.wordLimit).toBe(24);
        expect(SHOP_UI_CONFIG.choiceTemplate).toBe('{item} ×{count} · {coin} {price}');
        expect(SHOP_UI_CONFIG.coinGrantNotificationMs).toBe(2500);
        expect(NOTIFICATION_CONFIG.victory.xpTemplate).toBe('{species} +{amount} XP');
        expect(NOTIFICATION_CONFIG.itemDrop.template).toBe('{item} ×{count}');
        expect(NOTIFICATION_CONFIG.benchSwitch.timeMs).toBe(1500);
        expect(CREDITS_PAGES.length).toBeGreaterThan(0);
        expect(CREDITS_PAGES[0]).toContain('Rivers Reckoning');
    });

    it('keeps visual config usable by runtime render adapters', () => {
        expect(COMBAT_CHROME_CONFIG.hpBar.hpLabelTemplate).toBe('HP {current} / {max}');
        expect(COMBAT_CHROME_CONFIG.hpBar.damageLabelTemplate).toBe('-{damage}');
        expect(COMBAT_CHROME_CONFIG.hpBar.tiers).toEqual([
            { className: 'hp-healthy', label: 'healthy', aboveRatio: 0.5 },
            { className: 'hp-wounded', label: 'hurt', aboveRatio: 0.2 },
            { className: 'hp-critical', label: 'critical', aboveRatio: undefined },
        ]);
        expect(COMBAT_CHROME_CONFIG.hpBar.colors['hp-healthy']).toBe(0x4a9d5a);
        expect(COMBAT_CHROME_CONFIG.targetReticle).toMatchObject({
            minWidth: 34,
            minHeight: 32,
            primaryColor: 0x4fd8ff,
            shadowColor: 0x12333d,
        });
        expect(TAP_CONTROL_BLOCKING_UI_SELECTORS).toContain('.rr-dialog');
        expect(TAP_CONTROL_TARGET_BLOCKING_UI_SELECTORS).toContain('.rr-lead-movebar');
        expect(PIXI_GUARDED_FX_ALIASES).toEqual(['fx_settings', 'fx_spritesheet']);
        expect(SPRITE_LAYOUTS.player_three_frame).toMatchObject({
            framesWidth: 3,
            framesHeight: 4,
            standFrameX: 1,
            walkFrameCount: 3,
            attackSpeed: 6,
        });
        expect(SPRITE_LAYOUTS.npc_four_by_thirty_one.walkRows.up).toBe(9);
        expect(SPRITE_LAYOUTS.combatant_four_by_thirty_one).toMatchObject({
            framesWidth: 4,
            framesHeight: 31,
            walkFrameCount: 4,
            hurtSpeed: 8,
        });
        expect(PLAYER_SPRITESHEET_CONFIGS.map((sheet) => sheet.id)).toEqual(['hero', 'female']);
        expect(PLAYER_SPRITESHEET_CONFIGS.every((sheet) => sheet.layoutId === 'player_three_frame'))
            .toBe(true);
        expect(NPC_SPRITESHEET_CONFIGS).toHaveLength(20);
        expect(NPC_SPRITESHEET_CONFIGS.map((sheet) => sheet.id)).toContain('npc_guard_spear');
        expect(NPC_SPRITESHEET_CONFIGS.every((sheet) => sheet.layoutId === 'npc_four_by_thirty_one'))
            .toBe(true);
        expect(COMBATANT_SPRITESHEET_CONFIGS.map((sheet) => sheet.id)).toEqual([
            'combatant_mage_fem_red',
            'combatant_mage_hooded_brown',
            'combatant_rogue_hooded',
            'combatant_warrior_axe',
            'combatant_warrior_paladin',
        ]);
        expect(COMBATANT_SPRITESHEET_CONFIGS.every((sheet) => sheet.attackRow >= 0)).toBe(true);
        expect(COMBATANT_SPRITESHEET_CONFIGS.every((sheet) => sheet.layoutId === 'combatant_four_by_thirty_one'))
            .toBe(true);
        expect(BOSS_SPRITESHEET_CONFIGS.map((sheet) => sheet.id)).toEqual([
            'green_dragon_idle',
            'green_dragon_death',
        ]);
        expect(BOSS_SPRITESHEET_CONFIGS[0]?.animations.idle.frames).toHaveLength(32);
        expect(BOSS_SPRITESHEET_CONFIGS[1]?.animations.death.frames).toHaveLength(9);
        expect(EFFECT_SPRITESHEET_CONFIGS).toHaveLength(29);
        expect(EFFECT_SPRITESHEET_CONFIGS.map((sheet) => sheet.id)).toContain('fx_spell_bursts_14');
        expect(EFFECT_SPRITESHEET_CONFIGS.every((sheet) => Object.keys(sheet.animations).length > 0))
            .toBe(true);
    });

    it('keeps settings choices and preset cycles config-driven', () => {
        expect(SETTINGS_CONFIG.choices.map((choice) => choice.value)).toEqual([
            'sitelen',
            'text_speed',
            'contrast',
            'accessible',
            'bgm',
            'sfx',
            'cancel',
        ]);
        expect(SETTINGS_CONFIG.textSpeedPresets).toContain(SETTINGS_CONFIG.defaultTextSpeed);
        expect(SETTINGS_CONFIG.textSpeedValueTemplate).toBe('{value} / sec');
        expect(SETTINGS_CONFIG.defaultVolume).toBeGreaterThanOrEqual(0);
        expect(SETTINGS_CONFIG.defaultVolume).toBeLessThanOrEqual(100);
        expect(SETTINGS_CONFIG.stateLabels).toEqual({
            on: 'on',
            off: 'off',
            instant: 'instant',
            muted: 'muted',
        });
        expect(SETTINGS_CONFIG.summaryRows.map((row) => row.value)).toEqual([
            'sitelen',
            'text_speed',
            'contrast',
            'accessible',
            'volume',
        ]);
        expect(SETTINGS_CONFIG.pauseSummary.title).toBe('Save / Settings');
        expect(SETTINGS_CONFIG.choiceFormats.boolean).toBe('{label}  [{state}]');
    });

    it('keeps combat audio tuning config-driven', () => {
        expect(COMBAT_AUDIO_CONFIG.battleActionAudioRange).toBeGreaterThan(0);
        expect(COMBAT_AUDIO_CONFIG.monitorMs).toBeGreaterThan(0);
        expect(COMBAT_AUDIO_CONFIG.activeAiStates).toEqual(['alert', 'combat', 'flee', 'stunned']);
        expect(AUDIO_RUNTIME_CONFIG).toEqual({
            bgmOverrideEvent: 'rivers-reckoning:audio:bgm-override',
            bgmCrossfadeMs: 800,
            bgmStopDelayPaddingMs: 50,
            footstepMinIntervalMs: 140,
        });
    });

    it('keeps type matchup rules config-driven', () => {
        expect(TYPE_MATCHUP_CONFIG.types).toEqual(['seli', 'telo', 'kasi', 'lete', 'wawa']);
        expect(TYPE_MATCHUP_CONFIG.matrix.seli?.kasi).toBe(2);
        expect(TYPE_MATCHUP_CONFIG.matrix.seli?.telo).toBe(0.5);
        expect(TYPE_MATCHUP_CONFIG.attackerDefaults.lete).toBe(0.5);
        expect(TYPE_MATCHUP_CONFIG.defenderTagOverrides).toContainEqual({
            attacker: 'lete',
            defender_tag: 'waso',
            multiplier: 2,
        });
        expect(ENCOUNTER_CONFIG).toEqual({
            probabilityPerStep: 0.12,
            catchThrowAnimationMs: 700,
            catchResultAnimationMs: 320,
        });
    });

    it('keeps trainer battle stats and action-battle tuning config-driven', () => {
        expect(BATTLE_AI_BOOTSTRAP_CONFIG).toEqual({
            maxAttempts: 20,
            retryMs: 25,
        });
        expect(GYM_PHASE_POLL_MS).toBe(250);

        expect(Object.keys(TRAINER_BATTLE_CONFIGS).sort()).toEqual([
            'jan_ike',
            'jan_lete',
            'jan_suli',
            'jan_telo',
            'jan_wawa',
        ]);
        expect(TRAINER_BATTLE_CONFIGS.jan_ike).toMatchObject({
            npcId: 'jan_ike',
            defeatedFlag: 'jan_ike_defeated',
            graphic: 'combatant_rogue_hooded',
            hp: 60,
            atk: 14,
            pdef: 8,
            xpYield: 100,
            enemyType: 'aggressive',
            actionBattle: {
                attackCooldownMs: 900,
                visionRange: 140,
                attackRange: 28,
                fleeThreshold: 0,
            },
        });
        expect(TRAINER_BATTLE_CONFIGS.jan_wawa).toMatchObject({
            badgeFlag: 'badge_sewi',
            rewardClue: 'highridge-proof',
            phase2: {
                hp: 80,
                enemyType: 'tank',
            },
        });
        for (const trainer of Object.values(TRAINER_BATTLE_CONFIGS)) {
            expect(trainer.actionBattle.attackCooldownMs, trainer.npcId).toBeGreaterThan(0);
            expect(trainer.actionBattle.visionRange, trainer.npcId).toBeGreaterThan(0);
        }

        expect(FINAL_BOSS_CONFIG).toMatchObject({
            npcId: 'green_dragon',
            defeatedFlag: 'green_dragon_defeated',
            clearedFlag: 'game_cleared',
            rewardClue: 'green-dragon-proof',
            endingBeatId: 'ending',
            dialogBase: 'green_dragon',
            graphic: 'green_dragon_idle',
            hp: 320,
            atk: 42,
            pdef: 28,
            enemyType: 'berserker',
            coinRewardKey: 'greenDragon',
            actionBattle: {
                attackCooldownMs: 700,
                visionRange: 200,
                attackRange: 40,
                fleeThreshold: 0,
            },
            deathVisual: {
                graphic: 'green_dragon_death',
                animationName: 'death',
                durationMs: 1200,
            },
        });
        expect(FINAL_BOSS_CONFIG.requiredBadgeFlags).toEqual(BADGE_DEFINITIONS.map((badge) => badge.flag));
        expect(BATTLE_COIN_REWARDS[FINAL_BOSS_CONFIG.coinRewardKey]).toBeGreaterThan(0);
    });

    it('keeps rematch scaling and rewards config-driven', () => {
        expect(REMATCH_CONFIG.cooldown_hours).toBeGreaterThan(0);
        expect(REMATCH_CONFIG.xp_multiplier_cap).toBeGreaterThan(1);
        expect(REMATCH_CONFIG.level_cap).toBeGreaterThan(REMATCH_CONFIG.level_step);
        expect(REMATCH_CONFIG.default_reward.flag_prefix).toBe('trophy_');
        expect(REMATCH_CONFIG.rewards.map((reward) => reward.clear_count)).toEqual([1, 2, 3]);
    });
});
