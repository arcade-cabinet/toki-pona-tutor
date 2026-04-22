import { type EventDefinition, RpgPlayer, ATK, MAXHP, PDEF } from "@rpgjs/server";
import { BattleAi } from "@rpgjs/action-battle/server";
import { ensureBattleAi, scheduleBattleAi } from "./battle-ai";
import { playDialog } from "./dialog";
import { showCredits } from "./credits-screen";
import { getFlag, setFlag, recordMasteredWord } from "../../platform/persistence/queries";
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
 * Player should have a full party and 4 badges worth of mastered
 * words before reaching this fight.
 *
 * Gating: the final_boss_trigger on the nasin_pi_telo map only fires
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
                            await setFlag(config.defeatedFlag, "1");
                            await setFlag(config.clearedFlag, "1");
                            await recordMasteredWord(config.rewardWord);
                            await preferences.set(KEYS.journeyBeat, config.endingBeatId);
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
                                await showCredits(attacker);
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
            const done = await getFlag(config.defeatedFlag);
            if (done) {
                await playDialog(player, `${config.dialogBase}_victory`);
                return;
            }
            await playDialog(player, `${config.dialogBase}_intro`);
            await activateLeadBattleAvatar(player);
            await cueCombatBgm(player);
        },
    };
}

/**
 * Shape handler — the `final_boss_trigger` Tiled Trigger object on
 * nasin_pi_telo fires when the player walks onto it. Gated by the
 * four-badge check; if any badge is missing, the trigger is silent
 * (the player can still explore the rest of the route).
 */
export async function handleFinalBossTrigger(player: RpgPlayer): Promise<void> {
    const done = await getFlag(FINAL_BOSS_CONFIG.defeatedFlag);
    if (done) return;
    const ready = await allBadgesEarned();
    if (!ready) return;
    await playDialog(player, `${FINAL_BOSS_CONFIG.dialogBase}_intro`);
    await activateLeadBattleAvatar(player);
    await cueCombatBgm(player);
    // The actual BattleAi is attached to the green_dragon event on the
    // nasin_pi_telo map; the trigger's job is just to gate entry and
    // prime the intro dialog. Combat begins when the player attacks.
}
