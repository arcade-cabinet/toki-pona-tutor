import ambientRaw from "./ambient.json";
import audioRaw from "./audio.json";
import combatRaw from "./combat.json";
import effectsRaw from "./effects.json";
import eventsRaw from "./events.json";
import itemDropsRaw from "./item-drops.json";
import languageRaw from "./language.json";
import mapsRaw from "./maps.json";
import progressionRaw from "./progression.json";
import questsRaw from "./quests.json";
import shopsRaw from "./shops.json";
import startersRaw from "./starters.json";
import trainersRaw from "./trainers.json";
import uiRaw from "./ui.json";
import visualsRaw from "./visuals.json";
import {
    ambientConfigSchema,
    audioConfigSchema,
    combatConfigSchema,
    effectsConfigSchema,
    eventsConfigSchema,
    itemDropsConfigSchema,
    languageConfigSchema,
    mapsConfigSchema,
    parseGameplayConfig,
    progressionConfigSchema,
    questsConfigSchema,
    shopsConfigSchema,
    startersConfigSchema,
    trainersConfigSchema,
    uiConfigSchema,
    visualsConfigSchema,
    type EffectsConfig,
    type QuestConfig,
} from "./schema";

const ambientConfig = parseGameplayConfig("ambient.json", ambientConfigSchema, ambientRaw);
const audioConfig = parseGameplayConfig("audio.json", audioConfigSchema, audioRaw);
const combatConfig = parseGameplayConfig("combat.json", combatConfigSchema, combatRaw);
const effectsConfig = parseGameplayConfig("effects.json", effectsConfigSchema, effectsRaw);
const eventsConfig = parseGameplayConfig("events.json", eventsConfigSchema, eventsRaw);
const mapsConfig = parseGameplayConfig("maps.json", mapsConfigSchema, mapsRaw);
const progressionConfig = parseGameplayConfig(
    "progression.json",
    progressionConfigSchema,
    progressionRaw,
);
const startersConfig = parseGameplayConfig("starters.json", startersConfigSchema, startersRaw);
const trainersConfig = parseGameplayConfig("trainers.json", trainersConfigSchema, trainersRaw);
const shopsConfig = parseGameplayConfig("shops.json", shopsConfigSchema, shopsRaw);
const itemDropsConfig = parseGameplayConfig("item-drops.json", itemDropsConfigSchema, itemDropsRaw);
const languageConfig = parseGameplayConfig("language.json", languageConfigSchema, languageRaw);
const questsConfig = parseGameplayConfig("quests.json", questsConfigSchema, questsRaw);
const uiConfig = parseGameplayConfig("ui.json", uiConfigSchema, uiRaw);
const visualsConfig = parseGameplayConfig("visuals.json", visualsConfigSchema, visualsRaw);

export type ConfiguredBgmId = Extract<keyof typeof audioRaw.bgm_files, string>;
type ConfiguredSfxEvent = Extract<keyof typeof audioRaw.sfx, string>;
type ConfiguredHpClass = Extract<keyof typeof visualsRaw.combat_hp_bar.colors, string>;
export type ConfiguredTpType = Extract<(typeof combatRaw.types)[number], string>;
export type ConfiguredStatusId = Extract<
    (typeof combatRaw.status_effects.application_rules)[number]["status_id"],
    string
>;

export type RuntimeMapMetadata = {
    biome: string;
    music_track: ConfiguredBgmId;
};

export type RuntimeMapConfig = RuntimeMapMetadata & {
    label: string;
    safe_spawn?: { x: number; y: number };
};

export type RuntimeBgmSelectionConfig = {
    defaultCombatTrack: ConfiguredBgmId;
    gymCombatTrack: ConfiguredBgmId;
    gymMapPrefixes: string[];
    mapCombatOverrides: Record<string, ConfiguredBgmId>;
};

export type RuntimeStatusApplicationRule = {
    moveType: ConfiguredTpType;
    statusId: ConfiguredStatusId;
    chance: number;
    turns: number;
    requires: ConfiguredStatusId[];
    blockedBy: ConfiguredStatusId[];
};

export type RuntimeStatusEffectConfig = {
    applicationRules: RuntimeStatusApplicationRule[];
    tickEffects: Partial<
        Record<
            ConfiguredStatusId,
            {
                damageMaxHpDivisor?: number;
                skipNextTurn?: boolean;
            }
        >
    >;
    damageMultipliers: Array<{
        incomingType: ConfiguredTpType;
        targetStatus: ConfiguredStatusId;
        multiplier: number;
    }>;
};

export type RuntimeShopStockItem = {
    itemId: string;
    count: number;
    price: number;
};

export type RuntimeShopConfig = {
    graphic: string;
    dialogId: string;
    deliveryNpcId: string;
    stock: RuntimeShopStockItem[];
};

export type RuntimeQuestGoal =
    | { kind: "catch_count"; speciesId: string; target: number }
    | { kind: "catch_any_in_biome"; biome: string; target: number }
    | { kind: "defeat_trainer"; npcId: string }
    | { kind: "deliver_item"; itemId: string; toNpcId: string };

export type RuntimeQuest = {
    id: string;
    giverNpcId: string;
    mapId?: string;
    title?: string;
    summary?: string;
    goal: RuntimeQuestGoal;
    reward: {
        xp?: number;
        itemId?: string;
        itemCount?: number;
        rewardClue?: string;
    };
};

export type RuntimeCombatantSpritesheetConfig = {
    id: string;
    image: string;
    layoutId: string;
    attackRow: number;
    skillRow?: number;
    defenseRow?: number;
    hurtRow?: number;
};

export type RuntimeEnemyType = "aggressive" | "defensive" | "ranged" | "tank" | "berserker";

export type RuntimeActionBattleConfig = {
    attackCooldownMs: number;
    visionRange: number;
    attackRange: number;
    fleeThreshold: number;
};

export type RuntimeTrainerBattlePhaseConfig = {
    triggerAtHpFraction: number;
    hp: number;
    atk: number;
    pdef: number;
    enemyType?: RuntimeEnemyType;
    graphic?: string;
    transitionDialogId?: string;
};

export type RuntimeTrainerBattleConfig = {
    npcId: string;
    defeatedFlag?: string;
    badgeFlag?: string;
    rewardClue?: string;
    nextBeatId: string;
    hp: number;
    atk: number;
    pdef: number;
    dialogBase: string;
    xpYield?: number;
    enemyType?: RuntimeEnemyType;
    graphic: string;
    actionBattle: RuntimeActionBattleConfig;
    coinRewardKey?: string;
    faintAnimation?: string;
    phase2?: RuntimeTrainerBattlePhaseConfig;
};

export type RuntimeFinalBossConfig = {
    npcId: string;
    defeatedFlag: string;
    clearedFlag: string;
    requiredBadgeFlags: string[];
    rewardClue: string;
    endingBeatId: string;
    dialogBase: string;
    graphic: string;
    hp: number;
    atk: number;
    pdef: number;
    enemyType: RuntimeEnemyType;
    coinRewardKey: string;
    actionBattle: RuntimeActionBattleConfig;
    deathVisual: {
        graphic: string;
        animationName: string;
        durationMs: number;
        dropPx: number;
        fadeStart: number;
    };
};

export type RuntimeNewGamePlusConfig = {
    requiredClearedFlag: string;
    levelReduction: number;
    startMapId: string;
    startJourneyBeatId: string;
    rewardInventory: Record<string, number>;
    legendaryMultiplierBase: number;
    legendaryMultiplierPerClear: number;
    legendaryMultiplierCap: number;
};

export type RuntimeDaycareConfig = {
    offspringLevel: number;
    defaultChildSuffix: string;
    statJitterFraction: number;
    statMin: number;
    statMax: number;
    parentInheritedMoveLevel: number;
    childLearnsetMaxLevel: number;
    typeInheritance: {
        dominantTypes: ConfiguredTpType[];
        deferToOtherTypes: ConfiguredTpType[];
        pairOverrides: Record<string, ConfiguredTpType>;
    };
};

export type RuntimeSpriteDirectionName = "down" | "left" | "right" | "up";

export type RuntimeSpriteLayoutConfig = {
    framesWidth: number;
    framesHeight: number;
    standFrameX: number;
    standRows: Record<RuntimeSpriteDirectionName, number>;
    walkRows: Record<RuntimeSpriteDirectionName, number>;
    walkFrameCount: number;
    walkSpeed: number;
    attackSpeed?: number;
    skillSpeed?: number;
    defenseSpeed?: number;
    hurtSpeed?: number;
};

export type RuntimeHpTierConfig = {
    className: ConfiguredHpClass;
    label: string;
    aboveRatio?: number;
};

export type RuntimeSpritesheetConfig = {
    id: string;
    image: string;
    layoutId: string;
};

export type RuntimeEffectAnimation = {
    frames: number[];
    duration: number;
};

export type RuntimeEffectSpritesheetConfig = {
    id: string;
    image: string;
    framesWidth: number;
    framesHeight: number;
    animations: Record<string, RuntimeEffectAnimation>;
};

export type RuntimeMapEventConfig =
    | {
          kind: "ambient_npc";
          id: string;
          positionOffset?: RuntimePositionOffset;
          graphic: string;
          dialogId: string;
      }
    | {
          kind: "quest_npc";
          id: string;
          positionOffset?: RuntimePositionOffset;
          graphic: string;
          dialogId: string;
          questId: string;
      }
    | { kind: "starter_mentor"; id: string; positionOffset?: RuntimePositionOffset }
    | { kind: "rival"; id: string; positionOffset?: RuntimePositionOffset; trainerId: string }
    | { kind: "gym_leader"; id: string; positionOffset?: RuntimePositionOffset; trainerId: string }
    | { kind: "shop"; id: string; positionOffset?: RuntimePositionOffset; shopId: string }
    | { kind: "green_dragon"; id: string; positionOffset?: RuntimePositionOffset }
    | {
          kind: "warp";
          id: string;
          positionOffset?: RuntimePositionOffset;
          targetPositionOffset?: RuntimePositionOffset;
          gatedDialogId?: string;
      };

export type RuntimePositionOffset = { x: number; y: number };

export const GAMEPLAY_MAPS: Record<string, RuntimeMapConfig> = mapsConfig.maps;
export const DEFAULT_RESPAWN = mapsConfig.default_respawn;
export const MAP_EVENT_CONFIGS: Record<string, RuntimeMapEventConfig[]> = Object.fromEntries(
    Object.entries(eventsConfig.maps).map(([mapId, events]) => [
        mapId,
        events.map(normalizeMapEvent),
    ]),
);
export const MAP_METADATA_CONFIG: Record<string, RuntimeMapMetadata> = Object.fromEntries(
    Object.entries(GAMEPLAY_MAPS).map(([mapId, map]) => [
        mapId,
        { biome: map.biome, music_track: map.music_track },
    ]),
);

export const BADGE_DEFINITIONS = progressionConfig.badges;
export const REGION_XP_CURVE = progressionConfig.gym_xp_curve;
export const LEVEL_CURVE_CONFIG = {
    minLevel: progressionConfig.level_curve.min_level,
    maxLevel: progressionConfig.level_curve.max_level,
    exponent: progressionConfig.level_curve.exponent,
};
export const GAME_RULES_CONFIG = {
    partySizeMax: progressionConfig.game_rules.party_size_max,
    autosaveSlot: progressionConfig.game_rules.autosave_slot,
    manualSaveSlots: progressionConfig.game_rules.manual_save_slots,
};
export const NEW_GAME_PLUS_CONFIG: RuntimeNewGamePlusConfig = {
    requiredClearedFlag: progressionConfig.new_game_plus.required_cleared_flag,
    levelReduction: progressionConfig.new_game_plus.level_reduction,
    startMapId: progressionConfig.new_game_plus.start_map_id,
    startJourneyBeatId: progressionConfig.new_game_plus.start_journey_beat_id,
    rewardInventory: Object.fromEntries(
        progressionConfig.new_game_plus.reward_inventory.map((item) => [item.item_id, item.count]),
    ),
    legendaryMultiplierBase: progressionConfig.new_game_plus.legendary_multiplier_base,
    legendaryMultiplierPerClear: progressionConfig.new_game_plus.legendary_multiplier_per_clear,
    legendaryMultiplierCap: progressionConfig.new_game_plus.legendary_multiplier_cap,
};
export const DAYCARE_CONFIG: RuntimeDaycareConfig = {
    offspringLevel: progressionConfig.daycare.offspring_level,
    defaultChildSuffix: progressionConfig.daycare.default_child_suffix,
    statJitterFraction: progressionConfig.daycare.stat_jitter_fraction,
    statMin: progressionConfig.daycare.stat_min,
    statMax: progressionConfig.daycare.stat_max,
    parentInheritedMoveLevel: progressionConfig.daycare.parent_inherited_move_level,
    childLearnsetMaxLevel: progressionConfig.daycare.child_learnset_max_level,
    typeInheritance: {
        dominantTypes: progressionConfig.daycare.type_inheritance.dominant_types,
        deferToOtherTypes: progressionConfig.daycare.type_inheritance.defer_to_other_types,
        pairOverrides: progressionConfig.daycare.type_inheritance.pair_overrides,
    },
};
export const REMATCH_CONFIG = progressionConfig.rematch;
export const BATTLE_AI_BOOTSTRAP_CONFIG = {
    maxAttempts: trainersConfig.battle_ai_bootstrap.max_attempts,
    retryMs: trainersConfig.battle_ai_bootstrap.retry_ms,
};
export const GYM_PHASE_POLL_MS = trainersConfig.gym_phase_poll_ms;
const defaultActionBattleConfig: RuntimeActionBattleConfig = {
    attackCooldownMs: trainersConfig.default_action_battle.attack_cooldown_ms,
    visionRange: trainersConfig.default_action_battle.vision_range,
    attackRange: trainersConfig.default_action_battle.attack_range,
    fleeThreshold: trainersConfig.default_action_battle.flee_threshold,
};
export const FINAL_BOSS_CONFIG: RuntimeFinalBossConfig = {
    npcId: trainersConfig.final_boss.npc_id,
    defeatedFlag: trainersConfig.final_boss.defeated_flag,
    clearedFlag: trainersConfig.final_boss.cleared_flag,
    requiredBadgeFlags: trainersConfig.final_boss.required_badge_flags,
    rewardClue: trainersConfig.final_boss.reward_clue,
    endingBeatId: trainersConfig.final_boss.ending_beat_id,
    dialogBase: trainersConfig.final_boss.dialog_base,
    graphic: trainersConfig.final_boss.graphic,
    hp: trainersConfig.final_boss.hp,
    atk: trainersConfig.final_boss.atk,
    pdef: trainersConfig.final_boss.pdef,
    enemyType: trainersConfig.final_boss.enemy_type,
    coinRewardKey: trainersConfig.final_boss.coin_reward_key,
    actionBattle: normalizeActionBattleConfig(trainersConfig.final_boss.action_battle),
    deathVisual: {
        graphic: trainersConfig.final_boss.death_visual.graphic,
        animationName: trainersConfig.final_boss.death_visual.animation_name,
        durationMs: trainersConfig.final_boss.death_visual.duration_ms,
        dropPx: trainersConfig.final_boss.death_visual.drop_px,
        fadeStart: trainersConfig.final_boss.death_visual.fade_start,
    },
};
export const TRAINER_BATTLE_CONFIGS: Record<string, RuntimeTrainerBattleConfig> =
    Object.fromEntries(
        Object.entries(trainersConfig.trainers).map(([trainerId, trainer]) => [
            trainerId,
            {
                npcId: trainer.npc_id,
                defeatedFlag: trainer.defeated_flag,
                badgeFlag: trainer.badge_flag,
                rewardClue: trainer.reward_clue,
                nextBeatId: trainer.next_beat_id,
                hp: trainer.hp,
                atk: trainer.atk,
                pdef: trainer.pdef,
                dialogBase: trainer.dialog_base,
                xpYield: trainer.xp_yield,
                enemyType: trainer.enemy_type,
                graphic: trainer.graphic,
                actionBattle: normalizeActionBattleConfig(trainer.action_battle),
                coinRewardKey: trainer.coin_reward_key,
                faintAnimation: trainer.faint_animation,
                phase2: trainer.phase2
                    ? {
                          triggerAtHpFraction: trainer.phase2.trigger_at_hp_fraction,
                          hp: trainer.phase2.hp,
                          atk: trainer.phase2.atk,
                          pdef: trainer.phase2.pdef,
                          enemyType: trainer.phase2.enemy_type,
                          graphic: trainer.phase2.graphic,
                          transitionDialogId: trainer.phase2.transition_dialog_id,
                      }
                    : undefined,
            },
        ]),
    );

export const STARTER_LEVEL = startersConfig.starter_level;
export const STARTER_INITIAL_ITEMS = startersConfig.initial_items.map((item) => ({
    itemId: item.item_id,
    count: item.count,
}));
export const STARTERS = startersConfig.starters;

export const COIN_ITEM_ID = shopsConfig.coin_item_id;
export const BATTLE_COIN_REWARDS = shopsConfig.battle_coin_rewards;
export const SHOPS: Record<string, RuntimeShopConfig> = Object.fromEntries(
    Object.entries(shopsConfig.shops).map(([shopId, shop]) => [
        shopId,
        {
            graphic: shop.graphic,
            dialogId: shop.dialog_id,
            deliveryNpcId: shop.delivery_npc_id,
            stock: shop.stock.map((item) => ({
                itemId: item.item_id,
                count: item.count,
                price: item.price,
            })),
        },
    ]),
);

export const ITEM_DROP_FALLBACK_BY_TYPE = itemDropsConfig.fallback_by_type;
export const ITEM_DROP_TIER_DEFAULTS = itemDropsConfig.tier_defaults;
export const MICRO_GAME_CONFIG = {
    seed: languageConfig.micro_game.seed,
    roundCount: languageConfig.micro_game.round_count,
    action: normalizeLabelMetaCopy(languageConfig.micro_game.action),
    promptTemplate: languageConfig.micro_game.prompt_template,
    correctTemplate: languageConfig.micro_game.correct_template,
    wrongTemplate: languageConfig.micro_game.wrong_template,
    completeTemplate: languageConfig.micro_game.complete_template,
    pool: languageConfig.micro_game.pool.map((entry) => ({
        id: entry.id,
        prompt_tag: entry.prompt_tag,
        text: entry.text,
    })),
};

export const AMBIENT_CONFIG = ambientConfig;
export const TYPE_MATCHUP_CONFIG = {
    types: combatConfig.types as ConfiguredTpType[],
    defaultMultiplier: combatConfig.type_matchups.default_multiplier,
    attackerDefaults: combatConfig.type_matchups.attacker_defaults,
    matrix: combatConfig.type_matchups.matrix,
    defenderTagOverrides: combatConfig.type_matchups.defender_tag_overrides,
};
export const COMBAT_TYPE_LABELS = combatConfig.type_labels as Record<ConfiguredTpType, string>;
export const STATUS_EFFECT_CONFIG: RuntimeStatusEffectConfig = {
    applicationRules: combatConfig.status_effects.application_rules.map((rule) => ({
        moveType: rule.move_type,
        statusId: rule.status_id,
        chance: rule.chance,
        turns: rule.turns,
        requires: rule.requires ?? [],
        blockedBy: rule.blocked_by ?? [],
    })),
    tickEffects: Object.fromEntries(
        Object.entries(combatConfig.status_effects.tick_effects).map(([statusId, effect]) => [
            statusId,
            {
                damageMaxHpDivisor: effect.damage_max_hp_divisor,
                skipNextTurn: effect.skip_next_turn,
            },
        ]),
    ),
    damageMultipliers: combatConfig.status_effects.damage_multipliers.map((entry) => ({
        incomingType: entry.incoming_type,
        targetStatus: entry.target_status,
        multiplier: entry.multiplier,
    })),
};
export const ENCOUNTER_CONFIG = {
    probabilityPerStep: combatConfig.encounter.probability_per_step,
    catchThrowAnimationMs: combatConfig.encounter.catch_throw_animation_ms,
    catchResultAnimationMs: combatConfig.encounter.catch_result_animation_ms,
};
export const WILD_COMBAT_CONFIG = {
    targetHp: {
        baseFloor: combatConfig.wild_combat.target_hp.base_floor,
        levelFloor: combatConfig.wild_combat.target_hp.level_floor,
        levelMultiplier: combatConfig.wild_combat.target_hp.level_multiplier,
    },
    fightDamage: {
        attackerLevelFloor: combatConfig.wild_combat.fight_damage.attacker_level_floor,
        statDeltaDivisor: combatConfig.wild_combat.fight_damage.stat_delta_divisor,
        baseDamage: combatConfig.wild_combat.fight_damage.base_damage,
        levelMultiplier: combatConfig.wild_combat.fight_damage.level_multiplier,
        preMultiplierFloor: combatConfig.wild_combat.fight_damage.pre_multiplier_floor,
        multiplierFallback: combatConfig.wild_combat.fight_damage.multiplier_fallback,
        multiplierMin: combatConfig.wild_combat.fight_damage.multiplier_min,
        outputMin: combatConfig.wild_combat.fight_damage.output_min,
    },
    applyDamage: {
        targetMaxHpFloor: combatConfig.wild_combat.apply_damage.target_max_hp_floor,
        currentHpFloor: combatConfig.wild_combat.apply_damage.current_hp_floor,
        appliedDamageFloor: combatConfig.wild_combat.apply_damage.applied_damage_floor,
        targetHpFloorAfterAttack:
            combatConfig.wild_combat.apply_damage.target_hp_floor_after_attack,
    },
};

export const COMBAT_CHROME_CONFIG = {
    hpBar: {
        width: visualsConfig.combat_hp_bar.width,
        height: visualsConfig.combat_hp_bar.height,
        padding: visualsConfig.combat_hp_bar.padding,
        hitEffectMs: visualsConfig.combat_hp_bar.hit_effect_ms,
        faintEffectMs: visualsConfig.combat_hp_bar.faint_effect_ms,
        damagePopupMs: visualsConfig.combat_hp_bar.damage_popup_ms,
        hpTweenMs: visualsConfig.combat_hp_bar.hp_tween_ms,
        hpLabelTemplate: visualsConfig.combat_hp_bar.hp_label_template,
        damageLabelTemplate: visualsConfig.combat_hp_bar.damage_label_template,
        tiers: visualsConfig.combat_hp_bar.tiers.map((tier) => ({
            className: tier.class,
            label: tier.label,
            aboveRatio: tier.above_ratio,
        })) as RuntimeHpTierConfig[],
        colors: Object.fromEntries(
            Object.entries(visualsConfig.combat_hp_bar.colors).map(([hpClass, color]) => [
                hpClass,
                Number.parseInt(color.slice(1), 16),
            ]),
        ) as Record<ConfiguredHpClass, number>,
    },
    targetReticle: {
        padding: visualsConfig.combat_target_reticle.padding,
        minWidth: visualsConfig.combat_target_reticle.min_width,
        minHeight: visualsConfig.combat_target_reticle.min_height,
        cornerLength: visualsConfig.combat_target_reticle.corner_length,
        strokeWidth: visualsConfig.combat_target_reticle.stroke_width,
        pulseMs: visualsConfig.combat_target_reticle.pulse_ms,
        alphaMin: visualsConfig.combat_target_reticle.alpha_min,
        alphaMax: visualsConfig.combat_target_reticle.alpha_max,
        primaryColor: Number.parseInt(
            visualsConfig.combat_target_reticle.primary_color.slice(1),
            16,
        ),
        shadowColor: Number.parseInt(visualsConfig.combat_target_reticle.shadow_color.slice(1), 16),
    },
};
export const TAP_CONTROL_BLOCKING_UI_SELECTORS = visualsConfig.tap_controls.blocking_ui_selectors;
export const TAP_CONTROL_TARGET_BLOCKING_UI_SELECTORS =
    visualsConfig.tap_controls.target_blocking_ui_selectors;
export const MAP_VIEWPORT_CONFIG = {
    defaultTilePx: visualsConfig.map_viewport.default_tile_px,
    desktopZoom: visualsConfig.map_viewport.desktop_zoom,
    mobileZoom: visualsConfig.map_viewport.mobile_zoom,
    minTileScreenPx: visualsConfig.map_viewport.min_tile_screen_px,
    maxZoom: visualsConfig.map_viewport.max_zoom,
    pollMs: visualsConfig.map_viewport.poll_ms,
};
export const SPRITE_LAYOUTS: Record<string, RuntimeSpriteLayoutConfig> = Object.fromEntries(
    Object.entries(visualsConfig.sprite_layouts).map(([layoutId, layout]) => [
        layoutId,
        {
            framesWidth: layout.frames_width,
            framesHeight: layout.frames_height,
            standFrameX: layout.stand_frame_x,
            standRows: layout.stand_rows,
            walkRows: layout.walk_rows,
            walkFrameCount: layout.walk_frame_count,
            walkSpeed: layout.walk_speed,
            attackSpeed: layout.attack_speed,
            skillSpeed: layout.skill_speed,
            defenseSpeed: layout.defense_speed,
            hurtSpeed: layout.hurt_speed,
        },
    ]),
);
export const PLAYER_SPRITESHEET_CONFIGS: RuntimeSpritesheetConfig[] =
    visualsConfig.player_spritesheets.map(normalizeSpritesheetConfig);
export const NPC_SPRITESHEET_CONFIGS: RuntimeSpritesheetConfig[] =
    visualsConfig.npc_spritesheets.map(normalizeSpritesheetConfig);
export const COMBATANT_SPRITESHEET_CONFIGS: RuntimeCombatantSpritesheetConfig[] =
    visualsConfig.combatant_spritesheets.map((sheet) => ({
        id: sheet.id,
        image: sheet.image,
        layoutId: assertSpriteLayoutId(sheet.layout_id),
        attackRow: sheet.attack_row,
        skillRow: sheet.skill_row,
        defenseRow: sheet.defense_row,
        hurtRow: sheet.hurt_row,
    }));
export const BOSS_SPRITESHEET_CONFIGS: RuntimeEffectSpritesheetConfig[] =
    visualsConfig.boss_spritesheets.map((sheet) => ({
        id: sheet.id,
        image: sheet.image,
        framesWidth: sheet.frames_width,
        framesHeight: sheet.frames_height,
        animations: normalizeEffectAnimations(sheet.animations),
    }));
export const EFFECT_SPRITESHEET_CONFIGS: RuntimeEffectSpritesheetConfig[] =
    effectsConfig.effect_spritesheets.map((sheet) => ({
        id: sheet.id,
        image: sheet.image,
        framesWidth: sheet.frames_width,
        framesHeight: sheet.frames_height,
        animations: normalizeEffectAnimations(sheet.animations),
    }));

export const BGM_FILES = audioConfig.bgm_files as Record<ConfiguredBgmId, string>;
export const BGM_SELECTION_CONFIG: RuntimeBgmSelectionConfig = {
    defaultCombatTrack: audioConfig.bgm_selection.default_combat_track as ConfiguredBgmId,
    gymCombatTrack: audioConfig.bgm_selection.gym_combat_track as ConfiguredBgmId,
    gymMapPrefixes: audioConfig.bgm_selection.gym_map_prefixes,
    mapCombatOverrides: audioConfig.bgm_selection.map_combat_overrides as Record<
        string,
        ConfiguredBgmId
    >,
};
export const SFX_EVENTS = Object.keys(audioConfig.sfx) as ConfiguredSfxEvent[];
export const SFX_FILES = Object.fromEntries(
    Object.entries(audioConfig.sfx).map(([eventId, event]) => [eventId, event.file]),
) as Record<ConfiguredSfxEvent, string>;
export const SFX_BASE_VOLUMES = Object.fromEntries(
    Object.entries(audioConfig.sfx).map(([eventId, event]) => [eventId, event.base_volume]),
) as Record<ConfiguredSfxEvent, number>;
export const SFX_CUE_CONFIG = {
    menuOpen: audioConfig.sfx_cues.menu_open as ConfiguredSfxEvent,
    menuConfirm: audioConfig.sfx_cues.menu_confirm as ConfiguredSfxEvent,
    battleAction: audioConfig.sfx_cues.battle_action as ConfiguredSfxEvent,
    playerDamage: audioConfig.sfx_cues.player_damage as ConfiguredSfxEvent,
    warp: audioConfig.sfx_cues.warp as ConfiguredSfxEvent,
    encounterAppear: audioConfig.sfx_cues.encounter_appear as ConfiguredSfxEvent,
    catchThrow: audioConfig.sfx_cues.catch_throw as ConfiguredSfxEvent,
    catchSuccess: audioConfig.sfx_cues.catch_success as ConfiguredSfxEvent,
    catchFail: audioConfig.sfx_cues.catch_fail as ConfiguredSfxEvent,
    levelUp: audioConfig.sfx_cues.level_up as ConfiguredSfxEvent,
    trainerFaint: audioConfig.sfx_cues.trainer_faint as ConfiguredSfxEvent,
};
export const COMBAT_AUDIO_CONFIG = {
    battleActionAudioRange: audioConfig.combat.battle_action_audio_range,
    monitorMs: audioConfig.combat.monitor_ms,
    activeAiStates: audioConfig.combat.active_ai_states,
};
export const AUDIO_RUNTIME_CONFIG = {
    bgmOverrideEvent: audioConfig.runtime.bgm_override_event,
    bgmCrossfadeMs: audioConfig.runtime.bgm_crossfade_ms,
    bgmStopDelayPaddingMs: audioConfig.runtime.bgm_stop_delay_padding_ms,
    footstepMinIntervalMs: audioConfig.runtime.footstep_min_interval_ms,
};

export const TITLE_START = {
    mapId: uiConfig.title.start_map_id,
    spawn: uiConfig.title.start_spawn,
    journeyBeatId: uiConfig.title.start_journey_beat_id,
};
export const PLAYER_CONFIG = {
    defaultGraphic: uiConfig.title.player_default_graphic,
};
export const TITLE_MENU_CONFIG = {
    guiId: uiConfig.title.gui_id,
    menuTitle: uiConfig.title.menu_title,
    continueLabelPrefix: uiConfig.title.continue_label_prefix,
    continueLabelTemplate: uiConfig.title.continue_label_template,
    confirmNewPrompt: uiConfig.title.confirm_new_prompt,
    confirmNewChoices: uiConfig.title.confirm_new_choices,
    quitWebMessage: uiConfig.title.quit_web_message,
    entries: uiConfig.title.entries,
};
export const STARTER_CEREMONY_CONFIG = {
    alreadyChosenDialogId: uiConfig.starter_ceremony.already_chosen_dialog_id,
    introDialogId: uiConfig.starter_ceremony.intro_dialog_id,
    mentorGraphic: uiConfig.starter_ceremony.mentor_graphic,
    choicePrompt: uiConfig.starter_ceremony.choice_prompt,
    notificationMs: uiConfig.starter_ceremony.notification_ms,
};
export const PAUSE_MENU_CONFIG = {
    guiId: uiConfig.pause.gui_id,
    title: uiConfig.pause.title,
    routesAriaLabel: uiConfig.pause.routes_aria_label,
    defaultRouteId: uiConfig.pause.default_route_id,
    routes: uiConfig.pause.routes.map((route) => ({
        id: route.id,
        label: route.label,
        testId: route.test_id,
    })),
    footerEntries: uiConfig.pause.footer_entries.map((entry) => ({
        id: entry.id,
        label: entry.label,
        testId: entry.test_id,
    })),
    partyPanelHealItemId: uiConfig.pause.party_panel_heal_item_id,
    party: {
        titleTemplate: uiConfig.pause.party.title_template,
        empty: normalizeLabelMetaCopy(uiConfig.pause.party.empty),
        selectHint: normalizeLabelMetaCopy(uiConfig.pause.party.select_hint),
        detailLabelTemplate: uiConfig.pause.party.detail_label_template,
        detailTypeTemplate: uiConfig.pause.party.detail_type_template,
        detailMovesTemplate: uiConfig.pause.party.detail_moves_template,
        promoteLabel: uiConfig.pause.party.promote_label,
        promoteMetaTemplate: uiConfig.pause.party.promote_meta_template,
        faintedMeta: uiConfig.pause.party.fainted_meta,
        healMetaTemplate: uiConfig.pause.party.heal_meta_template,
        healEmptyMeta: uiConfig.pause.party.heal_empty_meta,
        healFullMeta: uiConfig.pause.party.heal_full_meta,
    },
    vocabulary: {
        previewLimit: uiConfig.pause.vocabulary.preview_limit,
        titleTemplate: uiConfig.pause.vocabulary.title_template,
        sightingMetaTemplate: uiConfig.pause.vocabulary.sighting_meta_template,
        empty: normalizeLabelMetaCopy(uiConfig.pause.vocabulary.empty),
        sentenceLogAction: normalizeLabelMetaCopy(uiConfig.pause.vocabulary.sentence_log_action),
        detailAction: normalizeLabelMetaCopy(uiConfig.pause.vocabulary.detail_action),
    },
    inventory: {
        previewLimit: uiConfig.pause.inventory.preview_limit,
        titleTemplate: uiConfig.pause.inventory.title_template,
        badgesLabelTemplate: uiConfig.pause.inventory.badges_label_template,
        badgeLabelTemplate: uiConfig.pause.inventory.badge_label_template,
        badgeHeldState: uiConfig.pause.inventory.badge_held_state,
        badgeMissingState: uiConfig.pause.inventory.badge_missing_state,
        beatLabel: uiConfig.pause.inventory.beat_label,
        unknownBeat: uiConfig.pause.inventory.unknown_beat,
        itemCountMetaTemplate: uiConfig.pause.inventory.item_count_meta_template,
        detailAction: normalizeLabelMetaCopy(uiConfig.pause.inventory.detail_action),
    },
};
export const PAUSE_ROUTES_CONFIG = PAUSE_MENU_CONFIG.routes;
export const PAUSE_FOOTER_ENTRIES = PAUSE_MENU_CONFIG.footerEntries;
export const PARTY_PANEL_HEAL_ITEM_ID = PAUSE_MENU_CONFIG.partyPanelHealItemId;
export const HUD_GUI_IDS = uiConfig.hud.gui_ids;
export const HUD_STATUS_CONFIG = {
    levelLabelTemplate: uiConfig.hud.status.level_label_template,
    masteredLabelTemplate: uiConfig.hud.status.mastered_label_template,
    hpLabelTemplate: uiConfig.hud.status.hp_label_template,
    missingPortraitFallback: uiConfig.hud.status.missing_portrait_fallback,
};
export const HUD_MENU_CONFIG = {
    ariaLabel: uiConfig.hud.menu.aria_label,
};
export const HUD_HINT_CONFIG = {
    ariaLabelTemplate: uiConfig.hud.hint.aria_label_template,
    emptyAriaLabel: uiConfig.hud.hint.empty_aria_label,
    pollMs: uiConfig.hud.hint.poll_ms,
    offsetY: uiConfig.hud.hint.offset_y,
};
export const HUD_NON_BLOCKING_GUI_IDS = uiConfig.hud.non_blocking_gui_ids;
export const INTERACTION_HINT_CONFIG = {
    glyphs: uiConfig.interaction_hint.glyphs,
    encounterFallbackTargetId: uiConfig.interaction_hint.encounter_fallback_target_id,
    battleEventIds: uiConfig.interaction_hint.battle_event_ids,
};
export const INTERACTION_HINT_BATTLE_EVENT_IDS = INTERACTION_HINT_CONFIG.battleEventIds;
export const DIALOG_UI_CONFIG = {
    guiId: uiConfig.dialog.gui_id,
    missingNodeTemplate: uiConfig.dialog.missing_node_template,
    defaultPosition: uiConfig.dialog.default_position,
    sitelenOverlayTestId: uiConfig.dialog.sitelen_overlay_test_id,
    confirmSfxId: uiConfig.dialog.confirm_sfx_id,
    tickSfxId: uiConfig.dialog.tick_sfx_id,
};
export const COMBAT_UI_CONFIG = {
    leadMoveBarGuiId: uiConfig.combat_ui.lead_move_bar_gui_id,
    leadMoveSkillPrefix: uiConfig.combat_ui.lead_move_skill_prefix,
    leadMoveBarLimit: uiConfig.combat_ui.lead_move_bar_limit,
    leadMoveBar: {
        levelLabelTemplate: uiConfig.combat_ui.lead_move_bar.level_label_template,
        energyLabelTemplate: uiConfig.combat_ui.lead_move_bar.energy_label_template,
        defaultTargetLabel: uiConfig.combat_ui.lead_move_bar.default_target_label,
        defaultTargetStatus: uiConfig.combat_ui.lead_move_bar.default_target_status,
        noTargetLabel: uiConfig.combat_ui.lead_move_bar.no_target_label,
        noTargetStatus: uiConfig.combat_ui.lead_move_bar.no_target_status,
        inRangeTemplate: uiConfig.combat_ui.lead_move_bar.in_range_template,
        outOfRangeTemplate: uiConfig.combat_ui.lead_move_bar.out_of_range_template,
        tileSingularLabel: uiConfig.combat_ui.lead_move_bar.tile_singular_label,
        tilePluralLabel: uiConfig.combat_ui.lead_move_bar.tile_plural_label,
        moveMetaTemplate: uiConfig.combat_ui.lead_move_bar.move_meta_template,
        emptyAriaLabel: uiConfig.combat_ui.lead_move_bar.empty_aria_label,
        barAriaTemplate: uiConfig.combat_ui.lead_move_bar.bar_aria_template,
        fallbackMoveLabel: uiConfig.combat_ui.lead_move_bar.fallback_move_label,
        readyLabel: uiConfig.combat_ui.lead_move_bar.ready_label,
        cooldownLabelTemplate: uiConfig.combat_ui.lead_move_bar.cooldown_label_template,
        switchActionLabel: uiConfig.combat_ui.lead_move_bar.switch_action_label,
        switchTitle: uiConfig.combat_ui.lead_move_bar.switch_title,
        switchEmptyLabel: uiConfig.combat_ui.lead_move_bar.switch_empty_label,
        switchCloseLabel: uiConfig.combat_ui.lead_move_bar.switch_close_label,
        switchCurrentMeta: uiConfig.combat_ui.lead_move_bar.switch_current_meta,
        switchFaintedMeta: uiConfig.combat_ui.lead_move_bar.switch_fainted_meta,
        switchSlotMetaTemplate: uiConfig.combat_ui.lead_move_bar.switch_slot_meta_template,
    },
    leadMoveTuning: {
        maxSpFloor: uiConfig.combat_ui.lead_move_tuning.max_sp_floor,
        maxSpCostMultiplier: uiConfig.combat_ui.lead_move_tuning.max_sp_cost_multiplier,
        spCostMin: uiConfig.combat_ui.lead_move_tuning.sp_cost_min,
        spCostMax: uiConfig.combat_ui.lead_move_tuning.sp_cost_max,
        spCostPowerDivisor: uiConfig.combat_ui.lead_move_tuning.sp_cost_power_divisor,
        cooldownMinMs: uiConfig.combat_ui.lead_move_tuning.cooldown_min_ms,
        cooldownBaseMs: uiConfig.combat_ui.lead_move_tuning.cooldown_base_ms,
        cooldownPowerMs: uiConfig.combat_ui.lead_move_tuning.cooldown_power_ms,
        cooldownPriorityMs: uiConfig.combat_ui.lead_move_tuning.cooldown_priority_ms,
        defaultRangeTiles: uiConfig.combat_ui.lead_move_tuning.default_range_tiles,
        rangeTilesByType: uiConfig.combat_ui.lead_move_tuning.range_tiles_by_type,
    },
    wildBattleGuiId: uiConfig.combat_ui.wild_battle_gui_id,
    wildBattle: {
        levelLabelPrefix: uiConfig.combat_ui.wild_battle.level_label_prefix,
        hpLabelPrefix: uiConfig.combat_ui.wild_battle.hp_label_prefix,
        levelLabelTemplate: uiConfig.combat_ui.wild_battle.level_label_template,
        hpLabelTemplate: uiConfig.combat_ui.wild_battle.hp_label_template,
        promptTemplate: uiConfig.combat_ui.wild_battle.prompt_template,
        fightResultActionLabel: uiConfig.combat_ui.wild_battle.fight_result_action_label,
        fightResultTargetLabel: uiConfig.combat_ui.wild_battle.fight_result_target_label,
        fightResultTemplate: uiConfig.combat_ui.wild_battle.fight_result_template,
        unknownTypeLabel: uiConfig.combat_ui.wild_battle.unknown_type_label,
        missingPortraitFallback: uiConfig.combat_ui.wild_battle.missing_portrait_fallback,
        missingLeadLabel: uiConfig.combat_ui.wild_battle.missing_lead_label,
        missingLeadTypeLabel: uiConfig.combat_ui.wild_battle.missing_lead_type_label,
        battleAriaLabel: uiConfig.combat_ui.wild_battle.battle_aria_label,
        battleLabelTemplate: uiConfig.combat_ui.wild_battle.battle_label_template,
        dialogIds: uiConfig.combat_ui.wild_battle.dialog_ids,
        versusLabel: uiConfig.combat_ui.wild_battle.versus_label,
        damageMissLabel: uiConfig.combat_ui.wild_battle.damage_miss_label,
        damageLabelTemplate: uiConfig.combat_ui.wild_battle.damage_label_template,
        damagePopupTemplate: uiConfig.combat_ui.wild_battle.damage_popup_template,
        damageNotificationMs: uiConfig.combat_ui.wild_battle.damage_notification_ms,
        damageToneLabels: uiConfig.combat_ui.wild_battle.damage_tone_labels,
        captureLabels: uiConfig.combat_ui.wild_battle.capture_labels,
        choiceLabels: uiConfig.combat_ui.wild_battle.choice_labels,
        missingPokiText: uiConfig.combat_ui.wild_battle.missing_poki_text,
        itemMenu: {
            prompt: uiConfig.combat_ui.wild_battle.item_menu.prompt,
            emptyText: uiConfig.combat_ui.wild_battle.item_menu.empty_text,
            backLabel: uiConfig.combat_ui.wild_battle.item_menu.back_label,
            choiceTemplate: uiConfig.combat_ui.wild_battle.item_menu.choice_template,
            healSuffixTemplate: uiConfig.combat_ui.wild_battle.item_menu.heal_suffix_template,
            fullSuffix: uiConfig.combat_ui.wild_battle.item_menu.full_suffix,
            usedTemplate: uiConfig.combat_ui.wild_battle.item_menu.used_template,
            emptyTextResult: uiConfig.combat_ui.wild_battle.item_menu.empty_text_result,
            fullText: uiConfig.combat_ui.wild_battle.item_menu.full_text,
            invalidHpText: uiConfig.combat_ui.wild_battle.item_menu.invalid_hp_text,
            missingText: uiConfig.combat_ui.wild_battle.item_menu.missing_text,
        },
    },
    combatFaintAnimationId: uiConfig.combat_ui.combat_faint_animation_id,
};
export const DEFEAT_SCREEN_CONFIG = {
    guiId: uiConfig.defeat_screen.gui_id,
    enterMs: uiConfig.defeat_screen.enter_ms,
    settleMs: uiConfig.defeat_screen.settle_ms,
    defaultPhase: uiConfig.defeat_screen.default_phase,
    reviveDialogId: uiConfig.defeat_screen.revive_dialog_id,
    messageLabel: uiConfig.defeat_screen.message_label,
    ariaLabelTemplate: uiConfig.defeat_screen.aria_label_template,
    phaseLabels: {
        fallen: {
            statusLabel: uiConfig.defeat_screen.phase_labels.fallen.status_label,
            detailLabel: uiConfig.defeat_screen.phase_labels.fallen.detail_label,
        },
        returning: {
            statusLabel: uiConfig.defeat_screen.phase_labels.returning.status_label,
            detailLabel: uiConfig.defeat_screen.phase_labels.returning.detail_label,
        },
    },
};
export const WARP_LOADING_CONFIG = {
    guiId: uiConfig.warp_loading.gui_id,
    enterMs: uiConfig.warp_loading.enter_ms,
    settleMs: uiConfig.warp_loading.settle_ms,
    defaultPhase: uiConfig.warp_loading.default_phase,
    ariaLabelTemplate: uiConfig.warp_loading.aria_label_template,
    phaseLabels: {
        enter: {
            statusLabel: uiConfig.warp_loading.phase_labels.enter.status_label,
            detailLabel: uiConfig.warp_loading.phase_labels.enter.detail_label,
        },
        settle: {
            statusLabel: uiConfig.warp_loading.phase_labels.settle.status_label,
            detailLabel: uiConfig.warp_loading.phase_labels.settle.detail_label,
        },
    },
};
export const TAP_ROUTE_CONFIG = {
    event: uiConfig.tap_route.event,
    snapEvent: uiConfig.tap_route.snap_event,
    maxLength: uiConfig.tap_route.max_length,
    movementTileSize: uiConfig.tap_route.movement_tile_size,
    playerTapRadiusMultiplier: uiConfig.tap_route.player_tap_radius_multiplier,
    pendingSnapKey: uiConfig.tap_route.pending_snap_key,
    bindRetryMs: uiConfig.tap_route.bind_retry_ms,
    bindRetryMaxAttempts: uiConfig.tap_route.bind_retry_max_attempts,
    snapRetryMs: uiConfig.tap_route.snap_retry_ms,
    snapStabilizeMaxAttempts: uiConfig.tap_route.snap_stabilize_max_attempts,
    snapMaxAttempts: uiConfig.tap_route.snap_max_attempts,
};
export const VOCABULARY_SCREEN_CONFIG = {
    masteryThreshold: uiConfig.vocabulary.mastery_threshold,
    pageSize: uiConfig.vocabulary.page_size,
    summaryTemplate: uiConfig.vocabulary.summary_template,
    rowLabelTemplate: uiConfig.vocabulary.row_label_template,
    entryTemplate: uiConfig.vocabulary.entry_template,
    glyphCardTemplate: uiConfig.vocabulary.glyph_card_template,
    sentenceLogSummaryTemplate: uiConfig.vocabulary.sentence_log_summary_template,
    sentenceLogEmptyText: uiConfig.vocabulary.sentence_log_empty_text,
    sentenceDumpLineTemplate: uiConfig.vocabulary.sentence_dump_line_template,
};
export const INVENTORY_SCREEN_CONFIG = {
    badgesHeaderTemplate: uiConfig.inventory_screen.badges_header_template,
    badgeLineTemplate: uiConfig.inventory_screen.badge_line_template,
    badgeHeldState: uiConfig.inventory_screen.badge_held_state,
    badgeMissingState: uiConfig.inventory_screen.badge_missing_state,
    beatTemplate: uiConfig.inventory_screen.beat_template,
    itemsTitle: uiConfig.inventory_screen.items_title,
    itemLineTemplate: uiConfig.inventory_screen.item_line_template,
    emptyLine: uiConfig.inventory_screen.empty_line,
    questsTitle: uiConfig.inventory_screen.quests_title,
    emptyPartyText: uiConfig.inventory_screen.empty_party_text,
    partyHeaderTemplate: uiConfig.inventory_screen.party_header_template,
    partyLineTemplate: uiConfig.inventory_screen.party_line_template,
};
export const PARTY_PANEL_CONFIG = {
    unknownTypeLabel: uiConfig.party_panel.unknown_type_label,
    missingPortraitFallback: uiConfig.party_panel.missing_portrait_fallback,
    levelLabelTemplate: uiConfig.party_panel.level_label_template,
    hpLabelTemplate: uiConfig.party_panel.hp_label_template,
    xpLabelTemplate: uiConfig.party_panel.xp_label_template,
    xpMaxLabelTemplate: uiConfig.party_panel.xp_max_label_template,
    nextXpLabelTemplate: uiConfig.party_panel.next_xp_label_template,
    maxLevelLabel: uiConfig.party_panel.max_level_label,
    movesEmptyLabel: uiConfig.party_panel.moves_empty_label,
    moveSeparator: uiConfig.party_panel.move_separator,
};
export const BESTIARY_PANEL_CONFIG = {
    titleTemplate: uiConfig.bestiary_panel.title_template,
    unknownLabelTemplate: uiConfig.bestiary_panel.unknown_label_template,
    unknownTypeLabel: uiConfig.bestiary_panel.unknown_type_label,
    caughtMetaTemplate: uiConfig.bestiary_panel.caught_meta_template,
    seenMetaTemplate: uiConfig.bestiary_panel.seen_meta_template,
    unknownMeta: uiConfig.bestiary_panel.unknown_meta,
    descriptionTextTemplate: uiConfig.bestiary_panel.description_text_template,
    missingDescriptionText: uiConfig.bestiary_panel.missing_description_text,
};
export const SAVE_MENU_CONFIG = {
    prompt: uiConfig.save_menu.prompt,
    autoLabel: uiConfig.save_menu.auto_label,
    cancelLabel: uiConfig.save_menu.cancel_label,
    emptyLabel: uiConfig.save_menu.empty_label,
    emptySlotTemplate: uiConfig.save_menu.empty_slot_template,
    emptyDetailTemplate: uiConfig.save_menu.empty_detail_template,
    filledSlotTemplate: uiConfig.save_menu.filled_slot_template,
    filledDetailTemplate: uiConfig.save_menu.filled_detail_template,
    beatSuffixTemplate: uiConfig.save_menu.beat_suffix_template,
    autoDetailTemplate: uiConfig.save_menu.auto_detail_template,
    existingSlotPromptTemplate: uiConfig.save_menu.existing_slot_prompt_template,
    actions: uiConfig.save_menu.actions,
    missingSaveApiTemplate: uiConfig.save_menu.missing_save_api_template,
    saveSuccessTemplate: uiConfig.save_menu.save_success_template,
    saveErrorTemplate: uiConfig.save_menu.save_error_template,
    loadSuccessTemplate: uiConfig.save_menu.load_success_template,
    loadErrorTemplate: uiConfig.save_menu.load_error_template,
    loadedPositionSnapDelayMs: uiConfig.save_menu.loaded_position_snap_delay_ms,
};
export const QUEST_UI_CONFIG = {
    offerTemplate: uiConfig.quest.offer_template,
    progressTemplate: uiConfig.quest.progress_template,
    journalActiveMark: uiConfig.quest.journal_active_mark,
    journalCompletedMark: uiConfig.quest.journal_completed_mark,
    journalLineTemplate: uiConfig.quest.journal_line_template,
    acceptedTemplate: uiConfig.quest.accepted_template,
    completedText: uiConfig.quest.completed_text,
    acceptLabel: uiConfig.quest.accept_label,
    backLabel: uiConfig.quest.back_label,
    rewardSuccessTemplate: uiConfig.quest.reward_success_template,
    rewardNotReadyTemplate: uiConfig.quest.reward_not_ready_template,
    deliveryTemplate: uiConfig.quest.delivery_template,
    goalTemplates: uiConfig.quest.goal_templates,
    rewardTemplates: uiConfig.quest.reward_templates,
    notificationRewardTemplate: uiConfig.quest.notification_reward_template,
    notificationProgressTemplate: uiConfig.quest.notification_progress_template,
    notificationReadyTemplate: uiConfig.quest.notification_ready_template,
    notificationMs: uiConfig.quest.notification_ms,
};
export const DICTIONARY_EXPORT_CONFIG = {
    runtime: {
        action: normalizeLabelMetaCopy(uiConfig.dictionary_export.runtime.action),
        defaultPlayerName: uiConfig.dictionary_export.runtime.default_player_name,
        downloadFilename: uiConfig.dictionary_export.runtime.download_filename,
    },
    textCard: {
        header: uiConfig.dictionary_export.text_card.header,
        playerTemplate: uiConfig.dictionary_export.text_card.player_template,
        clearedBadge: uiConfig.dictionary_export.text_card.cleared_badge,
        ngPlusBadgeTemplate: uiConfig.dictionary_export.text_card.ng_plus_badge_template,
        inProgressBadge: uiConfig.dictionary_export.text_card.in_progress_badge,
        exportedAtTemplate: uiConfig.dictionary_export.text_card.exported_at_template,
        wordCountTemplate: uiConfig.dictionary_export.text_card.word_count_template,
        emptyWords: uiConfig.dictionary_export.text_card.empty_words,
        topWordsHeader: uiConfig.dictionary_export.text_card.top_words_header,
        wordRowTemplate: uiConfig.dictionary_export.text_card.word_row_template,
        sightingMark: uiConfig.dictionary_export.text_card.sighting_mark,
        topWordsLimit: uiConfig.dictionary_export.text_card.top_words_limit,
        wordColumnWidth: uiConfig.dictionary_export.text_card.word_column_width,
        sightingMarkCap: uiConfig.dictionary_export.text_card.sighting_mark_cap,
    },
    svgCard: {
        width: uiConfig.dictionary_export.svg_card.width,
        height: uiConfig.dictionary_export.svg_card.height,
        viewBox: uiConfig.dictionary_export.svg_card.view_box,
        fontFamily: uiConfig.dictionary_export.svg_card.font_family,
        backgroundFill: uiConfig.dictionary_export.svg_card.background_fill,
        border: {
            x: uiConfig.dictionary_export.svg_card.border.x,
            y: uiConfig.dictionary_export.svg_card.border.y,
            width: uiConfig.dictionary_export.svg_card.border.width,
            height: uiConfig.dictionary_export.svg_card.border.height,
            stroke: uiConfig.dictionary_export.svg_card.border.stroke,
            strokeWidth: uiConfig.dictionary_export.svg_card.border.stroke_width,
        },
        grid: {
            x: uiConfig.dictionary_export.svg_card.grid.x,
            y: uiConfig.dictionary_export.svg_card.grid.y,
            columns: uiConfig.dictionary_export.svg_card.grid.columns,
            cellWidth: uiConfig.dictionary_export.svg_card.grid.cell_width,
            cellHeight: uiConfig.dictionary_export.svg_card.grid.cell_height,
            wordLimit: uiConfig.dictionary_export.svg_card.grid.word_limit,
            wordFontBase: uiConfig.dictionary_export.svg_card.grid.word_font_base,
            wordFontBonusCap: uiConfig.dictionary_export.svg_card.grid.word_font_bonus_cap,
            wordFontSightingDivisor:
                uiConfig.dictionary_export.svg_card.grid.word_font_sighting_divisor,
            wordFill: uiConfig.dictionary_export.svg_card.grid.word_fill,
        },
        title: normalizeSvgText(uiConfig.dictionary_export.svg_card.title),
        subtitle: normalizeSvgText(uiConfig.dictionary_export.svg_card.subtitle),
        player: normalizeSvgText(uiConfig.dictionary_export.svg_card.player),
        wordCount: normalizeSvgText(uiConfig.dictionary_export.svg_card.word_count),
        wordCountLabel: normalizeSvgText(uiConfig.dictionary_export.svg_card.word_count_label),
        clearedBadge: normalizeSvgText(uiConfig.dictionary_export.svg_card.cleared_badge),
        date: normalizeSvgText(uiConfig.dictionary_export.svg_card.date),
    },
};
export const SHOP_UI_CONFIG = {
    promptTemplate: uiConfig.shop.prompt_template,
    backLabel: uiConfig.shop.back_label,
    choiceTemplate: uiConfig.shop.choice_template,
    coinGrantTemplate: uiConfig.shop.coin_grant_template,
    coinGrantNotificationMs: uiConfig.shop.coin_grant_notification_ms,
    purchaseSuccessTemplate: uiConfig.shop.purchase_success_template,
    insufficientTemplate: uiConfig.shop.insufficient_template,
    missingTemplate: uiConfig.shop.missing_template,
};
export const NOTIFICATION_CONFIG = {
    victory: {
        timeMs: uiConfig.notifications.victory.time_ms,
        xpTemplate: uiConfig.notifications.victory.xp_template,
        levelTemplate: uiConfig.notifications.victory.level_template,
        moveTemplate: uiConfig.notifications.victory.move_template,
    },
    itemDrop: {
        timeMs: uiConfig.notifications.item_drop.time_ms,
        template: uiConfig.notifications.item_drop.template,
    },
    benchSwitch: {
        timeMs: uiConfig.notifications.bench_switch.time_ms,
        template: uiConfig.notifications.bench_switch.template,
    },
};
export const SETTINGS_CONFIG = {
    textSpeedPresets: uiConfig.settings.text_speed_presets,
    defaultTextSpeed: uiConfig.settings.default_text_speed,
    textSpeedValueTemplate: uiConfig.settings.text_speed_value_template,
    volumePresets: uiConfig.settings.volume_presets,
    defaultVolume: uiConfig.settings.default_volume,
    stateLabels: uiConfig.settings.state_labels,
    summaryTitle: uiConfig.settings.summary_title,
    summaryRows: uiConfig.settings.summary_rows.map((row) => ({
        value: row.value,
        label: row.label,
        template: row.template,
    })),
    pauseSummary: {
        title: uiConfig.settings.pause_summary.title,
        rows: uiConfig.settings.pause_summary.rows.map((row) => ({
            value: row.value,
            label: row.label,
            metaTemplate: row.meta_template,
        })),
        detailAction: normalizeLabelMetaCopy(uiConfig.settings.pause_summary.detail_action),
    },
    choicePrompt: uiConfig.settings.choice_prompt,
    choiceFormats: uiConfig.settings.choice_formats,
    changeMessages: uiConfig.settings.change_messages,
    choices: uiConfig.settings.choices,
};
export const CREDITS_PAGES = uiConfig.credits_pages.map((page) => page.join("\n"));
export const OPENING_SCENE_CONFIG = {
    flagId: uiConfig.opening_scene.flag_id,
    postSceneDialogId: uiConfig.opening_scene.post_scene_dialog_id,
    beats: uiConfig.opening_scene.beats,
} as const;
export const PIXI_GUARDED_FX_ALIASES = visualsConfig.pixi.guarded_fx_aliases;

export const SIDE_QUEST_CONFIGS: RuntimeQuest[] = questsConfig.quests.map(normalizeQuest);

function normalizeQuest(quest: QuestConfig): RuntimeQuest {
    return {
        id: quest.id,
        giverNpcId: quest.giver_npc_id,
        mapId: quest.map_id,
        title: quest.title,
        summary: quest.summary,
        goal: normalizeQuestGoal(quest.goal),
        reward: {
            xp: quest.reward.xp,
            itemId: quest.reward.item_id,
            itemCount: quest.reward.item_count,
            rewardClue: quest.reward.reward_clue,
        },
    };
}

function normalizeLabelMetaCopy(copy: { label: string; meta: string }): {
    label: string;
    meta: string;
} {
    return {
        label: copy.label,
        meta: copy.meta,
    };
}

function normalizeSvgText(copy: {
    text?: string;
    template?: string;
    x: number;
    y: number;
    font_size: number;
    fill: string;
}): { text?: string; template?: string; x: number; y: number; fontSize: number; fill: string } {
    return {
        text: copy.text,
        template: copy.template,
        x: copy.x,
        y: copy.y,
        fontSize: copy.font_size,
        fill: copy.fill,
    };
}

function normalizeSpritesheetConfig(sheet: {
    id: string;
    image: string;
    layout_id: string;
}): RuntimeSpritesheetConfig {
    return {
        id: sheet.id,
        image: sheet.image,
        layoutId: assertSpriteLayoutId(sheet.layout_id),
    };
}

function normalizeMapEvent(
    event: (typeof eventsConfig.maps)[string][number],
): RuntimeMapEventConfig {
    const base = {
        id: event.id,
        positionOffset: normalizePositionOffset(event.position_offset),
    };
    switch (event.kind) {
        case "ambient_npc":
            return {
                ...base,
                kind: event.kind,
                graphic: event.graphic,
                dialogId: event.dialog_id,
            };
        case "quest_npc":
            return {
                ...base,
                kind: event.kind,
                graphic: event.graphic,
                dialogId: event.dialog_id,
                questId: event.quest_id,
            };
        case "starter_mentor":
        case "green_dragon":
            return {
                ...base,
                kind: event.kind,
            };
        case "rival":
        case "gym_leader":
            return {
                ...base,
                kind: event.kind,
                trainerId: event.trainer_id,
            };
        case "shop":
            return {
                ...base,
                kind: event.kind,
                shopId: event.shop_id,
            };
        case "warp":
            return {
                ...base,
                kind: event.kind,
                targetPositionOffset: normalizePositionOffset(event.target_position_offset),
                gatedDialogId: event.gated_dialog_id,
            };
    }
}

function normalizePositionOffset(offset?: {
    x: number;
    y: number;
}): RuntimePositionOffset | undefined {
    return offset ? { x: offset.x, y: offset.y } : undefined;
}

function normalizeActionBattleConfig(
    override:
        | {
              attack_cooldown_ms?: number;
              vision_range?: number;
              attack_range?: number;
              flee_threshold?: number;
          }
        | undefined,
): RuntimeActionBattleConfig {
    return {
        attackCooldownMs:
            override?.attack_cooldown_ms ?? defaultActionBattleConfig.attackCooldownMs,
        visionRange: override?.vision_range ?? defaultActionBattleConfig.visionRange,
        attackRange: override?.attack_range ?? defaultActionBattleConfig.attackRange,
        fleeThreshold: override?.flee_threshold ?? defaultActionBattleConfig.fleeThreshold,
    };
}

export function spriteLayout(layoutId: string): RuntimeSpriteLayoutConfig {
    const layout = SPRITE_LAYOUTS[layoutId];
    if (!layout) throw new Error(`[gameplay-config] missing sprite layout: ${layoutId}`);
    return layout;
}

function assertSpriteLayoutId(layoutId: string): string {
    spriteLayout(layoutId);
    return layoutId;
}

function normalizeQuestGoal(goal: QuestConfig["goal"]): RuntimeQuestGoal {
    switch (goal.kind) {
        case "catch_count":
            return { kind: "catch_count", speciesId: goal.species_id, target: goal.target };
        case "catch_any_in_biome":
            return { kind: "catch_any_in_biome", biome: goal.biome, target: goal.target };
        case "defeat_trainer":
            return { kind: "defeat_trainer", npcId: goal.npc_id };
        case "deliver_item":
            return { kind: "deliver_item", itemId: goal.item_id, toNpcId: goal.to_npc_id };
    }
}

function normalizeEffectAnimations(
    animations: EffectsConfig["effect_spritesheets"][number]["animations"],
): Record<string, RuntimeEffectAnimation> {
    return Object.fromEntries(
        Object.entries(animations).map(([name, animation]) => [
            name,
            {
                frames:
                    "frames" in animation
                        ? animation.frames
                        : frameRange(animation.frame_range[0], animation.frame_range[1]),
                duration: animation.duration,
            },
        ]),
    );
}

function frameRange(start: number, end: number): number[] {
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
