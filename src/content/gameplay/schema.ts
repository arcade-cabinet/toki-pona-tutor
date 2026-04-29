import { z } from "zod";

const idSchema = z.string().min(1);
const positiveIntSchema = z.number().int().positive();
const nonNegativeIntSchema = z.number().int().nonnegative();
const intSchema = z.number().int();
const chanceSchema = z.number().min(0).max(1);
const colorByteSchema = z.number().int().min(0).max(255);
const alphaSchema = z.number().min(0).max(1);
const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const hpClassSchema = z.enum(["hp-healthy", "hp-wounded", "hp-critical"]);
const dayPhaseSchema = z.enum(["night", "dawn", "day", "dusk"]);
const weatherSchema = z.enum(["clear", "rain", "snow", "fog"]);
const ambientBiomeSchema = z.enum(["village", "kasi", "lete", "seli", "telo", "nena", "indoor"]);
const mapBiomeSchema = z.enum(["town", "forest", "water", "ice", "peak", "cave"]);
const combatTypeSchema = z.enum(["seli", "telo", "kasi", "lete", "wawa"]);
const directionRowsSchema = z.object({
    down: nonNegativeIntSchema,
    left: nonNegativeIntSchema,
    right: nonNegativeIntSchema,
    up: nonNegativeIntSchema,
});
const enemyTypeSchema = z.enum(["aggressive", "defensive", "ranged", "tank", "berserker"]);
const titleEntryIdSchema = z.enum(["new", "settings", "quit"]);
const titleConfirmChoiceValueSchema = z.enum(["confirm", "cancel"]);
const pauseRouteIdSchema = z.enum([
    "glance",
    "party",
    "vocab",
    "inventory",
    "bestiary",
    "rumors",
    "challenges",
    "settings",
]);
const pauseFooterIdSchema = z.enum(["resume", "save", "title"]);
const saveMenuActionValueSchema = z.enum(["save", "load", "cancel"]);
const settingsChoiceValueSchema = z.enum([
    "sitelen",
    "text_speed",
    "contrast",
    "accessible",
    "bgm",
    "sfx",
    "cancel",
]);
const interactionHintGlyphSchema = z.enum(["talk", "battle", "travel", "search"]);
const defeatScreenPhaseSchema = z.enum(["fallen", "returning"]);
const warpLoadingPhaseSchema = z.enum(["enter", "settle"]);
const wildDamageToneSchema = z.enum(["super", "resisted", "neutral", "miss"]);
const wildBattleCaptureStateSchema = z.enum(["throw", "caught", "escaped"]);
const settingsSummaryValueSchema = z.enum([
    "sitelen",
    "text_speed",
    "contrast",
    "accessible",
    "volume",
]);
const mapMusicTrackSchema = z.enum([
    "bgm_village",
    "bgm_forest",
    "bgm_mountain",
    "bgm_water",
    "bgm_snow",
]);
const statusIdSchema = z.enum(["burn", "wet", "frozen"]);
const assetPathSchema = z.string().startsWith("/");
const spawnSchema = z.object({
    x: nonNegativeIntSchema,
    y: nonNegativeIntSchema,
});

const positionOffsetSchema = z.object({
    x: z.number().int(),
    y: z.number().int(),
});
const labelMetaCopySchema = z.object({
    label: idSchema,
    meta: idSchema,
});
const svgTextSchema = z.object({
    text: idSchema.optional(),
    template: idSchema.optional(),
    x: nonNegativeIntSchema,
    y: nonNegativeIntSchema,
    font_size: positiveIntSchema,
    fill: hexColorSchema,
});
const itemStackSchema = z.object({
    item_id: idSchema,
    count: positiveIntSchema,
});
const actionBattleConfigSchema = z.object({
    attack_cooldown_ms: positiveIntSchema,
    vision_range: positiveIntSchema,
    attack_range: positiveIntSchema,
    flee_threshold: nonNegativeIntSchema,
});
const tintSchema = z.object({
    r: colorByteSchema,
    g: colorByteSchema,
    b: colorByteSchema,
    a: alphaSchema,
});
const animationFrameRangeSchema = z
    .tuple([nonNegativeIntSchema, nonNegativeIntSchema])
    .refine(([start, end]) => end >= start, "frame_range end must be >= start");
const effectAnimationSchema = z.union([
    z.object({
        frames: z.array(nonNegativeIntSchema).min(1),
        duration: positiveIntSchema,
    }),
    z.object({
        frame_range: animationFrameRangeSchema,
        duration: positiveIntSchema,
    }),
]);
const hpTierConfigSchema = z.object({
    class: hpClassSchema,
    label: idSchema,
    above_ratio: chanceSchema.optional(),
});

function validateHpTiers(
    tiers: Array<z.infer<typeof hpTierConfigSchema>>,
    ctx: z.RefinementCtx,
): void {
    const expectedClasses: Array<z.infer<typeof hpClassSchema>> = [
        "hp-healthy",
        "hp-wounded",
        "hp-critical",
    ];
    const classes = new Set(tiers.map((tier) => tier.class));

    for (const expected of expectedClasses) {
        if (!classes.has(expected)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `combat_hp_bar.tiers must include ${expected}`,
            });
        }
    }

    tiers.forEach((tier, index) => {
        const isLast = index === tiers.length - 1;
        if (!isLast && tier.above_ratio === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "only the final HP tier may omit above_ratio",
                path: [index, "above_ratio"],
            });
        }
        if (isLast && tier.above_ratio !== undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "the final HP tier must omit above_ratio as the catch-all tier",
                path: [index, "above_ratio"],
            });
        }
        if (index > 0 && tier.above_ratio !== undefined) {
            const previous = tiers[index - 1]?.above_ratio;
            if (previous !== undefined && tier.above_ratio >= previous) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "HP tier above_ratio values must descend from healthy to critical",
                    path: [index, "above_ratio"],
                });
            }
        }
    });
}

export const mapsConfigSchema = z.object({
    maps: z.record(
        idSchema,
        z.object({
            label: idSchema,
            biome: mapBiomeSchema,
            music_track: mapMusicTrackSchema,
            safe_spawn: spawnSchema.optional(),
        }),
    ),
    default_respawn: z.object({
        map_id: idSchema,
        x: nonNegativeIntSchema,
        y: nonNegativeIntSchema,
    }),
});

export const progressionConfigSchema = z.object({
    level_curve: z
        .object({
            min_level: positiveIntSchema,
            max_level: positiveIntSchema,
            exponent: positiveIntSchema,
        })
        .refine((curve) => curve.max_level >= curve.min_level, "max_level must be >= min_level"),
    game_rules: z.object({
        party_size_max: positiveIntSchema,
        autosave_slot: nonNegativeIntSchema,
        manual_save_slots: z.array(positiveIntSchema).min(1),
    }),
});

export const startersConfigSchema = z.object({
    starter_level: positiveIntSchema,
    initial_items: z.array(itemStackSchema),
    starters: z
        .array(
            z.object({
                id: idSchema,
                label: idSchema,
                starting_clues: z.array(idSchema).min(1),
            }),
        )
        .min(1),
});

export const shopsConfigSchema = z.object({
    coin_item_id: idSchema,
    battle_coin_rewards: z.record(idSchema, positiveIntSchema),
    shops: z.record(
        idSchema,
        z.object({
            graphic: idSchema,
            dialog_id: idSchema,
            delivery_npc_id: idSchema,
            stock: z
                .array(
                    z.object({
                        item_id: idSchema,
                        count: positiveIntSchema,
                        price: positiveIntSchema,
                    }),
                )
                .min(1),
        }),
    ),
});

export const itemDropsConfigSchema = z.object({
    fallback_by_type: z.record(idSchema, idSchema),
    tier_defaults: z.object({
        common: z.object({ chance: chanceSchema, count: positiveIntSchema }),
        uncommon: z.object({ chance: chanceSchema, count: positiveIntSchema }),
        legendary: z.object({ chance: chanceSchema, count: positiveIntSchema }),
    }),
});

export const languageConfigSchema = z.object({
    micro_game: z.object({
        seed: nonNegativeIntSchema,
        round_count: positiveIntSchema,
        action: labelMetaCopySchema,
        prompt_template: idSchema,
        correct_template: idSchema,
        wrong_template: idSchema,
        complete_template: idSchema,
        pool: z
            .array(
                z.object({
                    id: idSchema,
                    prompt_tag: idSchema,
                    text: idSchema,
                }),
            )
            .min(4),
    }),
});

export const audioConfigSchema = z.object({
    bgm_files: z.record(idSchema, assetPathSchema),
    bgm_selection: z.object({
        default_combat_track: idSchema,
        gym_combat_track: idSchema,
        gym_map_prefixes: z.array(idSchema).min(1),
        map_combat_overrides: z.record(idSchema, idSchema),
    }),
    sfx: z.record(
        idSchema,
        z.object({
            file: assetPathSchema,
            base_volume: chanceSchema,
        }),
    ),
    sfx_cues: z.object({
        menu_open: idSchema,
        menu_confirm: idSchema,
        battle_action: idSchema,
        player_damage: idSchema,
        warp: idSchema,
        encounter_appear: idSchema,
        catch_throw: idSchema,
        catch_success: idSchema,
        catch_fail: idSchema,
        level_up: idSchema,
        trainer_faint: idSchema,
    }),
    combat: z.object({
        battle_action_audio_range: positiveIntSchema,
        monitor_ms: positiveIntSchema,
        active_ai_states: z.array(idSchema).min(1),
    }),
    runtime: z.object({
        bgm_override_event: idSchema,
        bgm_crossfade_ms: positiveIntSchema,
        bgm_stop_delay_padding_ms: nonNegativeIntSchema,
        footstep_min_interval_ms: positiveIntSchema,
    }),
});

export const ambientConfigSchema = z.object({
    day_length_minutes: positiveIntSchema,
    phase_tints: z.record(dayPhaseSchema, tintSchema),
    biome_codes: z.record(ambientBiomeSchema, positiveIntSchema),
    weather_tables: z.record(ambientBiomeSchema, z.partialRecord(weatherSchema, chanceSchema)),
});

export const combatConfigSchema = z.object({
    types: z.array(combatTypeSchema).min(1),
    type_labels: z.record(combatTypeSchema, z.string().min(1)),
    type_matchups: z.object({
        default_multiplier: z.number().positive(),
        attacker_defaults: z.partialRecord(combatTypeSchema, z.number().positive()),
        matrix: z.partialRecord(combatTypeSchema, z.partialRecord(combatTypeSchema, z.number().positive())),
        defender_tag_overrides: z.array(
            z.object({
                attacker: combatTypeSchema,
                defender_tag: idSchema,
                multiplier: z.number().positive(),
            }),
        ),
    }),
    status_effects: z.object({
        application_rules: z
            .array(
                z.object({
                    move_type: combatTypeSchema,
                    status_id: statusIdSchema,
                    chance: chanceSchema,
                    turns: positiveIntSchema,
                    requires: z.array(statusIdSchema).optional(),
                    blocked_by: z.array(statusIdSchema).optional(),
                }),
            )
            .min(1),
        tick_effects: z.partialRecord(
            statusIdSchema,
            z.object({
                damage_max_hp_divisor: positiveIntSchema.optional(),
                skip_next_turn: z.boolean().optional(),
            }),
        ),
        damage_multipliers: z.array(
            z.object({
                incoming_type: combatTypeSchema,
                target_status: statusIdSchema,
                multiplier: z.number().nonnegative(),
            }),
        ),
    }),
    encounter: z.object({
        probability_per_step: chanceSchema,
        catch_throw_animation_ms: positiveIntSchema,
        catch_result_animation_ms: positiveIntSchema,
    }),
    wild_combat: z.object({
        target_hp: z.object({
            base_floor: positiveIntSchema,
            level_floor: positiveIntSchema,
            level_multiplier: positiveIntSchema,
        }),
        fight_damage: z.object({
            attacker_level_floor: positiveIntSchema,
            stat_delta_divisor: positiveIntSchema,
            base_damage: nonNegativeIntSchema,
            level_multiplier: nonNegativeIntSchema,
            pre_multiplier_floor: positiveIntSchema,
            multiplier_fallback: z.number().positive(),
            multiplier_min: z.number().nonnegative(),
            output_min: nonNegativeIntSchema,
        }),
        apply_damage: z.object({
            target_max_hp_floor: positiveIntSchema,
            current_hp_floor: positiveIntSchema,
            applied_damage_floor: positiveIntSchema,
            target_hp_floor_after_attack: positiveIntSchema,
        }),
    }),
});

export const visualsConfigSchema = z.object({
    combat_hp_bar: z.object({
        width: positiveIntSchema,
        height: positiveIntSchema,
        padding: nonNegativeIntSchema,
        hit_effect_ms: positiveIntSchema,
        faint_effect_ms: positiveIntSchema,
        damage_popup_ms: positiveIntSchema,
        hp_tween_ms: positiveIntSchema,
        hp_label_template: idSchema,
        damage_label_template: idSchema,
        tiers: z.array(hpTierConfigSchema).min(1).superRefine(validateHpTiers),
        colors: z.record(hpClassSchema, hexColorSchema),
    }),
    combat_target_reticle: z
        .object({
            padding: nonNegativeIntSchema,
            min_width: positiveIntSchema,
            min_height: positiveIntSchema,
            corner_length: positiveIntSchema,
            stroke_width: positiveIntSchema,
            pulse_ms: positiveIntSchema,
            alpha_min: z.number().min(0).max(1),
            alpha_max: z.number().min(0).max(1),
            primary_color: hexColorSchema,
            shadow_color: hexColorSchema,
        })
        .refine((reticle) => reticle.alpha_min <= reticle.alpha_max, {
            message: "combat_target_reticle.alpha_min must be <= alpha_max",
        }),
    tap_controls: z.object({
        blocking_ui_selectors: z.array(idSchema).min(1),
        target_blocking_ui_selectors: z.array(idSchema).min(1),
    }),
    map_viewport: z
        .object({
            default_tile_px: positiveIntSchema,
            desktop_zoom: z.number().positive(),
            mobile_zoom: z.number().positive(),
            min_tile_screen_px: positiveIntSchema,
            max_zoom: z.number().positive(),
            poll_ms: positiveIntSchema,
        })
        .superRefine((viewport, ctx) => {
            if (viewport.desktop_zoom > viewport.max_zoom) {
                ctx.addIssue({
                    code: "custom",
                    path: ["desktop_zoom"],
                    message: "map_viewport.desktop_zoom must be <= max_zoom",
                });
            }
            if (viewport.mobile_zoom > viewport.max_zoom) {
                ctx.addIssue({
                    code: "custom",
                    path: ["mobile_zoom"],
                    message: "map_viewport.mobile_zoom must be <= max_zoom",
                });
            }
            if (viewport.min_tile_screen_px / viewport.default_tile_px > viewport.max_zoom) {
                ctx.addIssue({
                    code: "custom",
                    path: ["min_tile_screen_px"],
                    message: "map_viewport.min_tile_screen_px cannot require zoom above max_zoom",
                });
            }
        }),
    pixi: z.object({
        guarded_fx_aliases: z.array(idSchema).min(1),
    }),
    sprite_layouts: z.record(
        idSchema,
        z.object({
            frames_width: positiveIntSchema,
            frames_height: positiveIntSchema,
            stand_frame_x: nonNegativeIntSchema,
            stand_rows: directionRowsSchema,
            walk_rows: directionRowsSchema,
            walk_frame_count: positiveIntSchema,
            walk_speed: positiveIntSchema,
            attack_speed: positiveIntSchema.optional(),
            skill_speed: positiveIntSchema.optional(),
            defense_speed: positiveIntSchema.optional(),
            hurt_speed: positiveIntSchema.optional(),
        }),
    ),
    player_spritesheets: z
        .array(
            z.object({
                id: idSchema,
                image: idSchema,
                layout_id: idSchema,
            }),
        )
        .min(1),
    npc_spritesheets: z
        .array(
            z.object({
                id: idSchema,
                image: idSchema,
                layout_id: idSchema,
            }),
        )
        .min(1),
    combatant_spritesheets: z
        .array(
            z.object({
                id: idSchema,
                image: idSchema,
                layout_id: idSchema,
                attack_row: nonNegativeIntSchema,
                skill_row: nonNegativeIntSchema.optional(),
                defense_row: nonNegativeIntSchema.optional(),
                hurt_row: nonNegativeIntSchema.optional(),
            }),
        )
        .min(1),
    boss_spritesheets: z
        .array(
            z.object({
                id: idSchema,
                image: idSchema,
                frames_width: positiveIntSchema,
                frames_height: positiveIntSchema,
                animations: z.record(idSchema, effectAnimationSchema),
            }),
        )
        .min(1),
});

export const effectsConfigSchema = z.object({
    effect_spritesheets: z
        .array(
            z.object({
                id: idSchema,
                image: idSchema,
                frames_width: positiveIntSchema,
                frames_height: positiveIntSchema,
                animations: z.record(idSchema, effectAnimationSchema),
            }),
        )
        .min(1),
});

const actionBattleTuningSchema = z.object({
    attack_cooldown_ms: positiveIntSchema.optional(),
    vision_range: positiveIntSchema.optional(),
    attack_range: positiveIntSchema.optional(),
    flee_threshold: nonNegativeIntSchema.optional(),
});

const trainerPhaseSchema = z.object({
    trigger_at_hp_fraction: chanceSchema,
    hp: positiveIntSchema,
    atk: positiveIntSchema,
    pdef: positiveIntSchema,
    enemy_type: enemyTypeSchema.optional(),
    graphic: idSchema.optional(),
    transition_dialog_id: idSchema.optional(),
});

export const trainersConfigSchema = z.object({
    battle_ai_bootstrap: z.object({
        max_attempts: positiveIntSchema,
        retry_ms: positiveIntSchema,
    }),
    gym_phase_poll_ms: positiveIntSchema,
    default_action_battle: actionBattleConfigSchema,
    trainers: z.record(
        idSchema,
        z.object({
            npc_id: idSchema,
            defeated_flag: idSchema.optional(),
            badge_flag: idSchema.optional(),
            reward_clue: idSchema.optional(),
            next_beat_id: idSchema,
            dialog_base: idSchema,
            graphic: idSchema,
            hp: positiveIntSchema,
            atk: positiveIntSchema,
            pdef: positiveIntSchema,
            xp_yield: positiveIntSchema.optional(),
            coin_reward_key: idSchema.optional(),
            enemy_type: enemyTypeSchema.optional(),
            action_battle: actionBattleTuningSchema.optional(),
            faint_animation: idSchema.optional(),
            phase2: trainerPhaseSchema.optional(),
        }),
    ),
});

export const uiConfigSchema = z.object({
    title: z.object({
        gui_id: idSchema,
        menu_title: idSchema,
        player_default_graphic: idSchema,
        player_name_tag: z.object({
            text: idSchema,
            fill: idSchema,
            stroke: idSchema,
            font_size: positiveIntSchema,
            font_weight: idSchema,
            margin_bottom: z.number().int(),
        }),
        start_map_id: idSchema,
        start_spawn: spawnSchema,
        start_journey_beat_id: idSchema,
        continue_label_prefix: idSchema,
        continue_label_template: idSchema,
        confirm_new_prompt: idSchema,
        confirm_new_choices: z
            .array(
                z.object({
                    value: titleConfirmChoiceValueSchema,
                    label: idSchema,
                }),
            )
            .min(1),
        quit_web_message: idSchema,
        entries: z
            .array(
                z.object({
                    id: titleEntryIdSchema,
                    label: idSchema,
                }),
            )
            .min(1),
        seed_picker: z.object({
            prompt: idSchema,
            random_label: idSchema,
            famous_seed_template: idSchema,
            famous_seeds: z.array(z.object({ label: idSchema, input: idSchema })).min(1),
        }),
    }),
    starter_ceremony: z.object({
        already_chosen_dialog_id: idSchema,
        intro_dialog_id: idSchema,
        mentor_graphic: idSchema,
        choice_prompt: idSchema,
        notification_ms: positiveIntSchema,
    }),
    pause: z.object({
        gui_id: idSchema,
        title: idSchema,
        routes_aria_label: idSchema,
        default_route_id: pauseRouteIdSchema,
        routes: z
            .array(
                z.object({
                    id: pauseRouteIdSchema,
                    label: idSchema,
                    test_id: idSchema,
                }),
            )
            .min(1),
        footer_entries: z
            .array(
                z.object({
                    id: pauseFooterIdSchema,
                    label: idSchema,
                    test_id: idSchema,
                }),
            )
            .min(1),
        party_panel_heal_item_id: idSchema,
        glance: z.object({
            title: idSchema,
            party_row_label_template: idSchema,
            party_row_meta_lead_template: idSchema,
            party_row_meta_empty: idSchema,
            clues_row_label_template: idSchema,
            clues_row_meta_empty: idSchema,
            clues_row_meta_template: idSchema,
            bestiary_row_label_template: idSchema,
            bestiary_row_meta_total_template: idSchema,
            objective_row_label_pre_starter: idSchema,
            objective_row_label_post_starter: idSchema,
            objective_row_meta: idSchema,
            seed_row_label_template: idSchema,
            seed_row_meta: idSchema,
        }),
        party: z.object({
            title_template: idSchema,
            empty: labelMetaCopySchema,
            select_hint: labelMetaCopySchema,
            detail_label_template: idSchema,
            detail_type_template: idSchema,
            detail_moves_template: idSchema,
            promote_label: idSchema,
            promote_meta_template: idSchema,
            fainted_meta: idSchema,
            heal_meta_template: idSchema,
            heal_empty_meta: idSchema,
            heal_full_meta: idSchema,
        }),
        vocabulary: z.object({
            preview_limit: positiveIntSchema,
            title_template: idSchema,
            sighting_meta_template: idSchema,
            empty: labelMetaCopySchema,
            sentence_log_action: labelMetaCopySchema,
            detail_action: labelMetaCopySchema,
        }),
        inventory: z.object({
            preview_limit: positiveIntSchema,
            title_template: idSchema,
            badges_label_template: idSchema,
            badge_label_template: idSchema,
            badge_held_state: idSchema,
            badge_missing_state: idSchema,
            beat_label: idSchema,
            unknown_beat: idSchema,
            item_count_meta_template: idSchema,
            detail_action: labelMetaCopySchema,
        }),
    }),
    hud: z.object({
        gui_ids: z.object({
            status: idSchema,
            goal: idSchema,
            hint: idSchema,
            menu: idSchema,
        }),
        status: z.object({
            level_label_template: idSchema,
            mastered_label_template: idSchema,
            hp_label_template: idSchema,
            missing_portrait_fallback: idSchema,
        }),
        goal: z.object({
            aria_label: idSchema,
            party_label_template: idSchema,
            heading_pre_starter: idSchema,
            heading_post_starter: idSchema,
            objective_pre_starter: idSchema,
            objective_post_starter: idSchema,
            poll_ms: positiveIntSchema,
        }),
        menu: z.object({
            aria_label: idSchema,
        }),
        hint: z.object({
            aria_label_template: idSchema,
            empty_aria_label: idSchema,
            poll_ms: positiveIntSchema,
            offset_y: intSchema,
        }),
        non_blocking_gui_ids: z.array(idSchema).min(1),
    }),
    interaction_hint: z.object({
        glyphs: z.object({
            default: interactionHintGlyphSchema,
            battle: interactionHintGlyphSchema,
            warp: interactionHintGlyphSchema,
            encounter: interactionHintGlyphSchema,
        }),
        encounter_fallback_target_id: idSchema,
        battle_event_ids: z.array(idSchema).min(1),
    }),
    dialog: z.object({
        gui_id: idSchema,
        missing_node_template: idSchema,
        default_position: idSchema,
        sitelen_overlay_test_id: idSchema,
        confirm_sfx_id: idSchema,
        tick_sfx_id: idSchema,
    }),
    combat_ui: z.object({
        lead_move_bar_gui_id: idSchema,
        lead_move_skill_prefix: idSchema,
        lead_move_bar_limit: positiveIntSchema,
        lead_move_bar: z.object({
            level_label_template: idSchema,
            energy_label_template: idSchema,
            default_target_label: idSchema,
            default_target_status: idSchema,
            no_target_label: idSchema,
            no_target_status: idSchema,
            in_range_template: idSchema,
            out_of_range_template: idSchema,
            tile_singular_label: idSchema,
            tile_plural_label: idSchema,
            move_meta_template: idSchema,
            empty_aria_label: idSchema,
            bar_aria_template: idSchema,
            fallback_move_label: idSchema,
            ready_label: idSchema,
            cooldown_label_template: idSchema,
            switch_action_label: idSchema,
            switch_title: idSchema,
            switch_empty_label: idSchema,
            switch_close_label: idSchema,
            switch_current_meta: idSchema,
            switch_fainted_meta: idSchema,
            switch_slot_meta_template: idSchema,
        }),
        lead_move_tuning: z
            .object({
                max_sp_floor: positiveIntSchema,
                max_sp_cost_multiplier: positiveIntSchema,
                sp_cost_min: positiveIntSchema,
                sp_cost_max: positiveIntSchema,
                sp_cost_power_divisor: positiveIntSchema,
                cooldown_min_ms: positiveIntSchema,
                cooldown_base_ms: positiveIntSchema,
                cooldown_power_ms: positiveIntSchema,
                cooldown_priority_ms: positiveIntSchema,
                default_range_tiles: positiveIntSchema,
                range_tiles_by_type: z.partialRecord(combatTypeSchema, positiveIntSchema),
            })
            .refine(
                (config) => config.sp_cost_max >= config.sp_cost_min,
                "sp_cost_max must be >= sp_cost_min",
            ),
        wild_battle_gui_id: idSchema,
        wild_battle: z.object({
            level_label_prefix: idSchema,
            hp_label_prefix: idSchema,
            level_label_template: idSchema,
            hp_label_template: idSchema,
            prompt_template: idSchema,
            fight_result_action_label: idSchema,
            fight_result_target_label: idSchema,
            fight_result_template: idSchema,
            unknown_type_label: idSchema,
            missing_portrait_fallback: idSchema,
            missing_lead_label: idSchema,
            missing_lead_type_label: idSchema,
            battle_aria_label: idSchema,
            battle_label_template: idSchema,
            dialog_ids: z.object({
                appear: idSchema,
                caught: idSchema,
                escaped: idSchema,
            }),
            versus_label: idSchema,
            damage_miss_label: idSchema,
            damage_label_template: idSchema,
            damage_popup_template: idSchema,
            damage_notification_ms: positiveIntSchema,
            damage_tone_labels: z.record(wildDamageToneSchema, idSchema),
            capture_labels: z.record(wildBattleCaptureStateSchema, idSchema),
            choice_labels: z.object({
                fight: idSchema,
                catch: idSchema,
                item: idSchema,
                flee: idSchema,
            }),
            missing_poki_text: idSchema,
            item_menu: z.object({
                prompt: idSchema,
                empty_text: idSchema,
                back_label: idSchema,
                choice_template: idSchema,
                heal_suffix_template: idSchema,
                full_suffix: idSchema,
                used_template: idSchema,
                empty_text_result: idSchema,
                full_text: idSchema,
                invalid_hp_text: idSchema,
                missing_text: idSchema,
            }),
        }),
        combat_faint_animation_id: idSchema,
    }),
    defeat_screen: z.object({
        gui_id: idSchema,
        enter_ms: positiveIntSchema,
        settle_ms: positiveIntSchema,
        default_phase: defeatScreenPhaseSchema,
        revive_dialog_id: idSchema,
        message_label: idSchema,
        aria_label_template: idSchema,
        phase_labels: z.record(
            defeatScreenPhaseSchema,
            z.object({
                status_label: idSchema,
                detail_label: idSchema,
            }),
        ),
    }),
    warp_loading: z.object({
        gui_id: idSchema,
        enter_ms: positiveIntSchema,
        settle_ms: positiveIntSchema,
        default_phase: warpLoadingPhaseSchema,
        aria_label_template: idSchema,
        phase_labels: z.record(
            warpLoadingPhaseSchema,
            z.object({
                status_label: idSchema,
                detail_label: idSchema,
            }),
        ),
    }),
    tap_route: z.object({
        event: idSchema,
        snap_event: idSchema,
        max_length: positiveIntSchema,
        movement_tile_size: positiveIntSchema,
        player_tap_radius_multiplier: z.number().positive(),
        pending_snap_key: idSchema,
        bind_retry_ms: positiveIntSchema,
        bind_retry_max_attempts: positiveIntSchema,
        snap_retry_ms: positiveIntSchema,
        snap_stabilize_max_attempts: positiveIntSchema,
        snap_max_attempts: positiveIntSchema,
    }),
    vocabulary: z.object({
        mastery_threshold: positiveIntSchema,
        page_size: positiveIntSchema,
        summary_template: idSchema,
        row_label_template: idSchema,
        entry_template: idSchema,
        glyph_card_template: idSchema,
        sentence_log_summary_template: idSchema,
        sentence_log_empty_text: idSchema,
        sentence_dump_line_template: idSchema,
    }),
    inventory_screen: z.object({
        badges_header_template: idSchema,
        badge_line_template: idSchema,
        badge_held_state: idSchema,
        badge_missing_state: idSchema,
        beat_template: idSchema,
        items_title: idSchema,
        item_line_template: idSchema,
        empty_line: idSchema,
        quests_title: idSchema,
        empty_party_text: idSchema,
        party_header_template: idSchema,
        party_line_template: idSchema,
    }),
    party_panel: z.object({
        unknown_type_label: idSchema,
        missing_portrait_fallback: idSchema,
        level_label_template: idSchema,
        hp_label_template: idSchema,
        xp_label_template: idSchema,
        xp_max_label_template: idSchema,
        next_xp_label_template: idSchema,
        max_level_label: idSchema,
        moves_empty_label: idSchema,
        move_separator: idSchema,
    }),
    bestiary_panel: z.object({
        title_template: idSchema,
        unknown_label_template: idSchema,
        unknown_type_label: idSchema,
        caught_meta_template: idSchema,
        seen_meta_template: idSchema,
        unknown_meta: idSchema,
        description_text_template: idSchema,
        missing_description_text: idSchema,
    }),
    save_menu: z.object({
        prompt: idSchema,
        auto_label: idSchema,
        cancel_label: idSchema,
        empty_label: idSchema,
        empty_slot_template: idSchema,
        empty_detail_template: idSchema,
        filled_slot_template: idSchema,
        filled_detail_template: idSchema,
        beat_suffix_template: idSchema,
        auto_detail_template: idSchema,
        existing_slot_prompt_template: idSchema,
        actions: z
            .array(
                z.object({
                    value: saveMenuActionValueSchema,
                    label: idSchema,
                }),
            )
            .min(1),
        missing_save_api_template: idSchema,
        save_success_template: idSchema,
        save_error_template: idSchema,
        load_success_template: idSchema,
        load_error_template: idSchema,
        loaded_position_snap_delay_ms: z.array(positiveIntSchema),
    }),
    quest: z.object({
        offer_template: idSchema,
        progress_template: idSchema,
        journal_active_mark: idSchema,
        journal_completed_mark: idSchema,
        journal_line_template: idSchema,
        accepted_template: idSchema,
        completed_text: idSchema,
        accept_label: idSchema,
        back_label: idSchema,
        reward_success_template: idSchema,
        reward_not_ready_template: idSchema,
        delivery_template: idSchema,
        goal_templates: z.object({
            catch_count: idSchema,
            catch_any_in_biome: idSchema,
            defeat_trainer: idSchema,
            deliver_item: idSchema,
        }),
        reward_templates: z.object({
            item: idSchema,
            xp: idSchema,
            word: idSchema,
        }),
        notification_reward_template: idSchema,
        notification_progress_template: idSchema,
        notification_ready_template: idSchema,
        notification_ms: positiveIntSchema,
    }),
    dictionary_export: z.object({
        runtime: z.object({
            action: labelMetaCopySchema,
            default_player_name: idSchema,
            download_filename: idSchema,
        }),
        text_card: z.object({
            header: idSchema,
            player_template: idSchema,
            cleared_badge: idSchema,
            ng_plus_badge_template: idSchema,
            in_progress_badge: idSchema,
            exported_at_template: idSchema,
            word_count_template: idSchema,
            empty_words: idSchema,
            top_words_header: idSchema,
            word_row_template: idSchema,
            sighting_mark: idSchema,
            top_words_limit: positiveIntSchema,
            word_column_width: positiveIntSchema,
            sighting_mark_cap: positiveIntSchema,
        }),
        svg_card: z.object({
            width: positiveIntSchema,
            height: positiveIntSchema,
            view_box: idSchema,
            font_family: idSchema,
            background_fill: hexColorSchema,
            border: z.object({
                x: nonNegativeIntSchema,
                y: nonNegativeIntSchema,
                width: positiveIntSchema,
                height: positiveIntSchema,
                stroke: hexColorSchema,
                stroke_width: positiveIntSchema,
            }),
            grid: z.object({
                x: nonNegativeIntSchema,
                y: nonNegativeIntSchema,
                columns: positiveIntSchema,
                cell_width: positiveIntSchema,
                cell_height: positiveIntSchema,
                word_limit: positiveIntSchema,
                word_font_base: positiveIntSchema,
                word_font_bonus_cap: nonNegativeIntSchema,
                word_font_sighting_divisor: positiveIntSchema,
                word_fill: hexColorSchema,
            }),
            title: svgTextSchema.extend({ text: idSchema }),
            subtitle: svgTextSchema.extend({ text: idSchema }),
            player: svgTextSchema.extend({ template: idSchema }),
            word_count: svgTextSchema,
            word_count_label: svgTextSchema.extend({ text: idSchema }),
            cleared_badge: svgTextSchema.extend({ text: idSchema }),
            date: svgTextSchema,
        }),
    }),
    shop: z.object({
        prompt_template: idSchema,
        back_label: idSchema,
        choice_template: idSchema,
        coin_grant_template: idSchema,
        coin_grant_notification_ms: positiveIntSchema,
        purchase_success_template: idSchema,
        insufficient_template: idSchema,
        missing_template: idSchema,
    }),
    notifications: z.object({
        victory: z.object({
            time_ms: positiveIntSchema,
            xp_template: idSchema,
            level_template: idSchema,
            move_template: idSchema,
        }),
        item_drop: z.object({
            time_ms: positiveIntSchema,
            template: idSchema,
        }),
        bench_switch: z.object({
            time_ms: positiveIntSchema,
            template: idSchema,
        }),
    }),
    settings: z.object({
        text_speed_presets: z.array(nonNegativeIntSchema).min(1),
        default_text_speed: nonNegativeIntSchema,
        text_speed_value_template: idSchema,
        volume_presets: z.array(nonNegativeIntSchema.max(100)).min(1),
        default_volume: nonNegativeIntSchema.max(100),
        state_labels: z.object({
            on: idSchema,
            off: idSchema,
            instant: idSchema,
            muted: idSchema,
        }),
        summary_title: idSchema,
        summary_rows: z
            .array(
                z.object({
                    value: settingsSummaryValueSchema,
                    label: idSchema,
                    template: idSchema,
                }),
            )
            .min(1),
        pause_summary: z.object({
            title: idSchema,
            rows: z
                .array(
                    z.object({
                        value: settingsSummaryValueSchema,
                        label: idSchema,
                        meta_template: idSchema,
                    }),
                )
                .min(1),
            detail_action: labelMetaCopySchema,
        }),
        choice_prompt: idSchema,
        choice_formats: z.object({
            boolean: idSchema,
            text_speed: idSchema,
            volume: idSchema,
            default: idSchema,
        }),
        change_messages: z.object({
            text_speed: idSchema,
            volume: idSchema,
        }),
        choices: z
            .array(
                z.object({
                    value: settingsChoiceValueSchema,
                    label: idSchema,
                }),
            )
            .min(1),
    }),
    credits_pages: z.array(z.array(z.string())).min(1),
    challenge: z.object({
        accept_label: idSchema,
        decline_label: idSchema,
        defer_label: idSchema,
        offer_footer: idSchema,
        resolve_fallback: idSchema,
        journal_section_label: idSchema,
        journal_empty_label: idSchema,
        journal_entry_template: idSchema,
    }),
    opening_scene: z.object({
        flag_id: idSchema,
        post_scene_dialog_id: idSchema,
        beats: z.array(z.string()).min(1),
    }),
});

export type MapsConfig = z.infer<typeof mapsConfigSchema>;
export type ProgressionConfig = z.infer<typeof progressionConfigSchema>;
export type StartersConfig = z.infer<typeof startersConfigSchema>;
export type ShopsConfig = z.infer<typeof shopsConfigSchema>;
export type ItemDropsConfig = z.infer<typeof itemDropsConfigSchema>;
export type LanguageConfig = z.infer<typeof languageConfigSchema>;
export type AudioConfig = z.infer<typeof audioConfigSchema>;
export type AmbientConfig = z.infer<typeof ambientConfigSchema>;
export type CombatConfig = z.infer<typeof combatConfigSchema>;
export type VisualsConfig = z.infer<typeof visualsConfigSchema>;
export type EffectsConfig = z.infer<typeof effectsConfigSchema>;
export type TrainersConfig = z.infer<typeof trainersConfigSchema>;
export type UiConfig = z.infer<typeof uiConfigSchema>;

export function parseGameplayConfig<T>(label: string, schema: z.ZodType<T>, raw: unknown): T {
    const result = schema.safeParse(raw);
    if (result.success) return result.data;

    const issueText = z.prettifyError(result.error);
    throw new Error(`[gameplay-config] invalid ${label}\n${issueText}`);
}
