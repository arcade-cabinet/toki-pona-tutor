import { type EventDefinition, RpgPlayer, ATK, MAXHP, PDEF } from "@rpgjs/server";
import { BattleAi, EnemyType } from "@rpgjs/action-battle/server";
import { playDialog } from "./dialog";
import { ensureBattleAi, scheduleBattleAi } from "./battle-ai";
import { getFlag, setFlag, recordClue } from "../../platform/persistence/queries";
import { preferences, KEYS } from "../../platform/persistence/preferences";
import { cueAmbientBgm, cueCombatBgm, cueSfx } from "./audio-cues";
import { BATTLE_COIN_REWARDS, grantBattleCoins } from "./shop";
import {
    COMBAT_TARGET_PARAM,
    playCombatFaintVisual,
    updateCombatDamageVisuals,
} from "./combat-visuals";
import { awardLeadVictoryXp } from "./victory-rewards";
import { activateLeadBattleAvatar, restoreLeadBattleAvatar } from "./lead-battle-avatar";
import { recordQuestEventForActive } from "./quest-runtime";
import {
    FINAL_BOSS_CONFIG,
    GYM_PHASE_POLL_MS,
    REGION_XP_CURVE,
    SFX_CUE_CONFIG,
    type RuntimeActionBattleConfig,
    type RuntimeEnemyType,
} from "../../content/gameplay";

/**
 * After a badge flag is set, check whether every required badge is now
 * present. If so, fire `proofs_all_four` — the derived flag gating
 * warden_ghost's dossier dialog at Dreadpeak. Called from the single
 * place a badge is ever set (gym-leader.ts onDefeated) so the check
 * runs exactly when progression changes, not on every map load.
 */
async function maybeSetProofsAllFour(): Promise<void> {
    for (const flag of FINAL_BOSS_CONFIG.requiredBadgeFlags) {
        const value = await getFlag(flag);
        if (!value || value === "0") return;
    }
    await setFlag("proofs_all_four", "1");
}

/**
 * Shared factory for the current four region masters.
 *
 * Single-phase mode (omit `phase2`): one BattleAi entity for the
 * whole fight. Used for rook (rival) and any leader whose
 * roster is a single creature.
 *
 * Multi-phase mode (set `phase2`): once this.hp drops below
 * `phase2.triggerAtHpFraction * opts.hp`, the entity's AI is
 * replaced with a fresh BattleAi using the phase 2 archetype/stats
 * tweaks, HP is bumped up to the phase 2 pool, a graphic swap can
 * happen, and an optional phase-transition dialog plays. This
 * mirrors the JOURNEY.md gym rosters (e.g. tarrin's
 * "chainback L8 → quartz_shell L10").
 *
 * Polling-based rather than hook-driven because @rpgjs/action-battle
 * doesn't expose a public per-event onDamage hook. A 250ms tick is
 * cheap and the detection latency is imperceptible.
 */
export interface GymLeaderOptions {
    /** Stable NPC id (matches dialog_id conventions + spec NPC id). */
    npcId: string;
    /** Flag set in SQLite on defeat — checked by the Warp event. */
    badgeFlag?: string;
    /** Investigation clue granted on defeat. */
    rewardClue?: string;
    /** Journey beat id to advance to on defeat (persisted to preferences). */
    nextBeatId: string;
    /** Phase-1 HP (or combined HP if no phase2 is set). */
    hp: number;
    /** Phase-1 attack parameter. */
    atk: number;
    /** Phase-1 physical defense parameter. */
    pdef: number;
    /** Base dialog id — `<base>_intro` pre-fight, `<base>_victory` post. */
    dialogBase: string;
    /** Action-battle tuning shared with the runtime BattleAi adapter. */
    actionBattle: RuntimeActionBattleConfig;
    /** XP awarded to the lead party creature on defeat. Optional —
     *  defaults to REGION_XP_CURVE[opts.badgeFlag] so callers don't
     *  duplicate the per-region XP schedule. Override only for
     *  non-gym leaders (e.g. the endgame rival). */
    xpYield?: number;
    /** AI archetype for phase 1; defaults to Aggressive. */
    enemyType?: RuntimeEnemyType;
    /** Graphic id (from config.client.ts spritesheets). */
    graphic?: string;
    /** Optional second phase. Triggers when hp / opts.hp < triggerAtHpFraction. */
    phase2?: {
        /** Fraction of phase-1 HP at which the transition fires. 0.0..1.0. */
        triggerAtHpFraction: number;
        /** Fresh HP pool for phase 2 (restored to the entity). */
        hp: number;
        /** Phase-2 attack. */
        atk: number;
        /** Phase-2 physical defense. */
        pdef: number;
        /** Phase-2 AI archetype. */
        enemyType?: RuntimeEnemyType;
        /** Optional graphic swap (second creature in the roster). */
        graphic?: string;
        /** Optional dialog id to play at the transition moment. */
        transitionDialogId?: string;
    };
}

export { REGION_XP_CURVE };

export function GymLeader(opts: GymLeaderOptions): EventDefinition {
    const badgeFlag = requiredGymConfig(opts.badgeFlag, opts.npcId, "badgeFlag");
    const rewardClue = requiredGymConfig(opts.rewardClue, opts.npcId, "rewardClue");
    const graphic = requiredGymConfig(opts.graphic, opts.npcId, "graphic");
    return {
        onInit() {
            this.setGraphic(graphic);
            this.param[MAXHP] = opts.hp;
            this.param[COMBAT_TARGET_PARAM] = 1;
            this.hp = opts.hp;
            this.param[ATK] = opts.atk;
            this.param[PDEF] = opts.pdef;

            const attachAi = (
                archetype: RuntimeEnemyType | undefined,
                actionBattle = opts.actionBattle,
            ) => {
                return new BattleAi(this as never, {
                    enemyType: resolveEnemyType(archetype),
                    attackCooldown: actionBattle.attackCooldownMs,
                    visionRange: actionBattle.visionRange,
                    attackRange: actionBattle.attackRange,
                    fleeThreshold: actionBattle.fleeThreshold,
                    onDefeated: async (event, attacker) => {
                        playCombatFaintVisual(event, {
                            animationName: "hurt",
                        });
                        await setFlag(badgeFlag, "1");
                        await maybeSetProofsAllFour();
                        await recordClue(rewardClue);
                        await preferences.set(KEYS.journeyBeat, opts.nextBeatId);
                        if (attacker) {
                            await cueSfx(attacker as RpgPlayer, SFX_CUE_CONFIG.trainerFaint);
                            await cueAmbientBgm(attacker as RpgPlayer);
                            await restoreLeadBattleAvatar(attacker as RpgPlayer);
                            await grantBattleCoins(
                                attacker as RpgPlayer,
                                BATTLE_COIN_REWARDS[
                                    badgeFlag as keyof typeof BATTLE_COIN_REWARDS
                                ] ?? 6,
                            );
                        }

                        const xpYield = opts.xpYield ?? REGION_XP_CURVE[badgeFlag] ?? 100;
                        if (attacker) {
                            await awardLeadVictoryXp(attacker as RpgPlayer, xpYield);
                            await recordQuestEventForActive(attacker as RpgPlayer, {
                                type: "defeat",
                                npcId: opts.npcId,
                            });
                        }

                        if (attacker) {
                            await playDialog(attacker, `${opts.dialogBase}_victory`);
                        }

                        // T3-03: autosave after combat end so badge + xp
                        // gains survive if the player quits before the
                        // next map change fires onJoinMap autosave.
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
                });
            };

            scheduleBattleAi(this as never, () => attachAi(opts.enemyType));

            // Phase-2 poller. Runs only if phase2 is configured; self-
            // stops after the transition or if the entity is removed.
            if (opts.phase2) {
                const threshold = opts.hp * opts.phase2.triggerAtHpFraction;
                let transitioned = false;
                const timer = setInterval(() => {
                    // If the entity's been removed from the map, drop.
                    const hp = (this as unknown as { hp?: number }).hp;
                    if (typeof hp !== "number" || hp <= 0) {
                        clearInterval(timer);
                        return;
                    }
                    if (!transitioned && hp <= threshold) {
                        transitioned = true;
                        clearInterval(timer);
                        void runPhaseTransition(this, opts.phase2!, attachAi);
                    }
                }, GYM_PHASE_POLL_MS);
            }
        },
        onChanges() {
            updateCombatDamageVisuals(this as never);
            void ensureBattleAi(this as never);
        },
        async onAction(player: RpgPlayer) {
            const already = await getFlag(badgeFlag);
            if (already) {
                await playDialog(player, `${opts.dialogBase}_victory`);
                return;
            }
            await playDialog(player, `${opts.dialogBase}_intro`);
            await activateLeadBattleAvatar(player);
            await cueCombatBgm(player);
        },
    };
}

function requiredGymConfig(value: string | undefined, npcId: string, key: string): string {
    if (value) return value;
    throw new Error(`[gym-leader] ${npcId} is missing ${key}`);
}

async function runPhaseTransition(
    event: unknown,
    phase2: NonNullable<GymLeaderOptions["phase2"]>,
    attachAi: (t: RuntimeEnemyType | undefined) => void,
): Promise<void> {
    const typed = event as {
        hp: number;
        param: Record<string | number, number>;
        setGraphic?: (id: string) => void;
    };
    typed.param[MAXHP] = phase2.hp;
    typed.param[COMBAT_TARGET_PARAM] = 1;
    typed.hp = phase2.hp;
    typed.param[ATK] = phase2.atk;
    typed.param[PDEF] = phase2.pdef;
    if (phase2.graphic && typed.setGraphic) typed.setGraphic(phase2.graphic);
    attachAi(phase2.enemyType);
    // Transition dialog is optional and best-effort — we don't know
    // which player triggered the phase, so we cannot showText() here.
    // The dialog id is reserved for a future player-aware hook.
    void phase2.transitionDialogId;
}

export function resolveEnemyType(type: RuntimeEnemyType | undefined): EnemyType {
    switch (type) {
        case "defensive":
            return EnemyType.Defensive;
        case "ranged":
            return EnemyType.Ranged;
        case "tank":
            return EnemyType.Tank;
        case "berserker":
            return EnemyType.Berserker;
        case "aggressive":
        case undefined:
            return EnemyType.Aggressive;
    }
}
