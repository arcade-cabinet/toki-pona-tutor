import { type EventDefinition, RpgPlayer, ATK, MAXHP, PDEF } from "@rpgjs/server";
import { BattleAi } from "@rpgjs/action-battle/server";
import { ensureBattleAi, scheduleBattleAi } from "./battle-ai";
import { playDialog } from "./dialog";
import { showCredits } from "./credits-screen";
import { getFlag, setFlag, recordClue } from "../../platform/persistence/queries";
import { preferences, KEYS } from "../../platform/persistence/preferences";
import { cueAmbientBgm, cueCombatBgm, cueSfx } from "./audio-cues";
import { BATTLE_COIN_REWARDS, grantBattleCoins } from "./shop";
import {
    COMBAT_TARGET_PARAM,
    playCombatFaintVisual,
    updateCombatDamageVisuals,
} from "./combat-visuals";
import { activateLeadBattleAvatar, restoreLeadBattleAvatar } from "./lead-battle-avatar";
import { FINAL_BOSS_CONFIG, SFX_CUE_CONFIG } from "../../content/gameplay";
import { resolveEnemyType } from "./gym-leader";

/**
 * Final boss — the green dragon. Only creature with a dedicated
 * death animation (STANDARDS.md, memory). No retry-loop parallels
 * the gym leaders; this is the endgame and winning is the ending.
 *
 * Stat check: significantly harder than jan Suli (the hardest gym).
 * Player should have a full party and all four region badges before reaching this fight.
 *
 * Gating: the final_boss_trigger on the rivergate_approach map only fires
 * the dragon if all four region badges are set. This is checked by
 * `allBadgesEarned()` below, not a separate persisted flag.
 */
export async function allBadgesEarned(): Promise<boolean> {
    const badgeValues = await Promise.all(
        FINAL_BOSS_CONFIG.requiredBadgeFlags.map((flag) => getFlag(flag)),
    );
    return badgeValues.every(Boolean);
}

export function GreenDragon(): EventDefinition {
    const config = FINAL_BOSS_CONFIG;
    return {
        onInit() {
            // Idle-animation spritesheet by default. The onDefeated
            // handler swaps to the dedicated death animation — this is
            // the only creature in the game with one (STANDARDS.md §
            // creature tiering, memory entry green-dragon-final-boss).
            this.setGraphic(config.graphic);
            this.param[MAXHP] = config.hp;
            this.param[COMBAT_TARGET_PARAM] = 1;
            this.hp = config.hp;
            this.param[ATK] = config.atk;
            this.param[PDEF] = config.pdef;

            scheduleBattleAi(
                this as never,
                () =>
                    new BattleAi(this as never, {
                        enemyType: resolveEnemyType(config.enemyType),
                        attackCooldown: config.actionBattle.attackCooldownMs,
                        visionRange: config.actionBattle.visionRange,
                        attackRange: config.actionBattle.attackRange,
                        fleeThreshold: config.actionBattle.fleeThreshold,
                        onDefeated: async (event, attacker) => {
                            const deathVisual = config.deathVisual;
                            playCombatFaintVisual(event, {
                                graphic: deathVisual.graphic,
                                animationName: deathVisual.animationName,
                                durationMs: deathVisual.durationMs,
                                dropPx: deathVisual.dropPx,
                                fadeStart: deathVisual.fadeStart,
                            });
                            // Swap to death animation BEFORE any flag/persistence
                            // work so the visual is in-flight while the state
                            // writes happen. The client-side spritesheet is a
                            // 9-frame single-play strip at 1200ms; the dialog
                            // that follows gives it time to finish.
                            try {
                                (event as { setGraphic?: (id: string) => void })?.setGraphic?.(
                                    deathVisual.graphic,
                                );
                            } catch {
                                // Best-effort; if the event is already gone the
                                // flag/dialog work below still runs.
                            }
                            // First-clear vs re-fight (T14 free-exploration loop):
                            // check clearedFlag BEFORE writing to distinguish.
                            const wasClearedBefore = Boolean(
                                await getFlag(config.clearedFlag),
                            );
                            await setFlag(config.defeatedFlag, "1");
                            await setFlag(config.clearedFlag, "1");
                            if (!wasClearedBefore) {
                                // First clear only: record the story clue and
                                // move the journey pointer to the ending beat.
                                await recordClue(config.rewardClue);
                                await preferences.set(KEYS.journeyBeat, config.endingBeatId);
                            }
                            if (attacker) {
                                await cueSfx(attacker, SFX_CUE_CONFIG.trainerFaint);
                                await cueAmbientBgm(attacker);
                                await restoreLeadBattleAvatar(attacker);
                                await grantBattleCoins(
                                    attacker,
                                    BATTLE_COIN_REWARDS[
                                        config.coinRewardKey as keyof typeof BATTLE_COIN_REWARDS
                                    ] ?? 0,
                                );
                                await playDialog(attacker, `${config.dialogBase}_victory`);
                                if (!wasClearedBefore) {
                                    // Credits roll once, on the first clear.
                                    // Re-fights skip straight back to exploration.
                                    await showCredits(attacker);
                                }
                            }
                            if (attacker) {
                                const save = (
                                    attacker as unknown as {
                                        save?: (slot: number) => Promise<void>;
                                    }
                                ).save;
                                if (typeof save === "function") {
                                    try {
                                        await save.call(attacker, 0);
                                    } catch {
                                        /* best-effort */
                                    }
                                }
                            }
                        },
                    }),
            );
        },
        onChanges() {
            updateCombatDamageVisuals(this as never, {
                hurtAnimation: false,
            });
            void ensureBattleAi(this as never);
        },
        async onAction(player: RpgPlayer) {
            const [done, cleared] = await Promise.all([
                getFlag(config.defeatedFlag),
                getFlag(config.clearedFlag),
            ]);
            if (done && !cleared) {
                // Pre-clear with defeatedFlag set should not happen (credits
                // roll sets both). Defensive: surface victory dialog.
                await playDialog(player, `${config.dialogBase}_victory`);
                return;
            }
            if (done && cleared) {
                // Post-clear re-fight — clear defeatedFlag so onDefeated fires
                // again. clearedFlag stays; credits do not re-roll.
                await setFlag(config.defeatedFlag, "");
            }
            await playDialog(player, `${config.dialogBase}_intro`);
            await activateLeadBattleAvatar(player);
            await cueCombatBgm(player);
        },
    };
}

export type FinalBossTriggerDecision =
    | "not_ready" // badges missing; trigger is silent
    | "start_fight" // first-time fight (pre-clear)
    | "restart_fight" // post-clear re-fight; defeatedFlag must be cleared first
    | "blocked_defeated_pre_clear"; // defeatedFlag set but clearedFlag not — defensive

/**
 * Pure decision for handleFinalBossTrigger — given the three flag reads,
 * returns what the trigger should do. Separated from the RPG.js shape
 * handler so the state machine can be unit-tested without an engine.
 */
export function decideFinalBossTrigger(flags: {
    defeated: boolean;
    cleared: boolean;
    badgesEarned: boolean;
}): FinalBossTriggerDecision {
    if (!flags.badgesEarned) return "not_ready";
    if (flags.defeated && flags.cleared) return "restart_fight";
    if (flags.defeated && !flags.cleared) return "blocked_defeated_pre_clear";
    return "start_fight";
}

/**
 * Shape handler — the `final_boss_trigger` Tiled Trigger object on
 * rivergate_approach fires when the player walks onto it. Gated by the
 * four-badge check; if any badge is missing, the trigger is silent
 * (the player can still explore the rest of the route).
 *
 * Post-clear re-fight (T14 — free exploration loop): once `clearedFlag`
 * is set and credits have rolled, the `defeatedFlag` no longer blocks
 * re-entering the fight. This is the post-clear loop named in
 * docs/STORY.md — the player can come back to catch the dragon, top up
 * their bestiary, or just replay the fight. The `clearedFlag` stays set
 * so credits do not roll again on subsequent wins.
 */
export async function handleFinalBossTrigger(player: RpgPlayer): Promise<void> {
    const [defeatedFlag, clearedFlag, badgesEarned] = await Promise.all([
        getFlag(FINAL_BOSS_CONFIG.defeatedFlag),
        getFlag(FINAL_BOSS_CONFIG.clearedFlag),
        allBadgesEarned(),
    ]);
    const decision = decideFinalBossTrigger({
        defeated: Boolean(defeatedFlag),
        cleared: Boolean(clearedFlag),
        badgesEarned,
    });
    switch (decision) {
        case "not_ready":
        case "blocked_defeated_pre_clear":
            return;
        case "restart_fight":
            await setFlag(FINAL_BOSS_CONFIG.defeatedFlag, "");
            break;
        case "start_fight":
            break;
    }
    await playDialog(player, `${FINAL_BOSS_CONFIG.dialogBase}_intro`);
    await activateLeadBattleAvatar(player);
    await cueCombatBgm(player);
    // The actual BattleAi is attached to the green_dragon event on the
    // rivergate_approach map; the trigger's job is just to gate entry and
    // prime the intro dialog. Combat begins when the player attacks.
}
