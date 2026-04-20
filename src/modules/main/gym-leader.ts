import { type EventDefinition, RpgPlayer, ATK, PDEF } from '@rpgjs/server';
import { BattleAi, EnemyType } from '@rpgjs/action-battle/server';
import { playDialog } from './dialog';
import { getFlag, setFlag, recordMasteredWord, getParty, awardXpToLead } from '../../platform/persistence/queries';
import { preferences, KEYS } from '../../platform/persistence/preferences';
import { gainXp } from './xp-curve';
import { movesLearnedAtLevel } from './content';

/**
 * Shared factory for the seven jan lawa (region masters).
 *
 * Single-phase mode (omit `phase2`): one BattleAi entity for the
 * whole fight. Used for jan_ike (rival) and any leader whose
 * roster is a single creature.
 *
 * Multi-phase mode (set `phase2`): once this.hp drops below
 * `phase2.triggerAtHpFraction * opts.hp`, the entity's AI is
 * replaced with a fresh BattleAi using the phase 2 archetype/stats
 * tweaks, HP is bumped up to the phase 2 pool, a graphic swap can
 * happen, and an optional phase-transition dialog plays. This
 * mirrors the JOURNEY.md gym rosters (e.g. jan_wawa's
 * "jan_wawa_linja L8 → sijelo_kiwen L10").
 *
 * Polling-based rather than hook-driven because @rpgjs/action-battle
 * doesn't expose a public per-event onDamage hook. A 250ms tick is
 * cheap and the detection latency is imperceptible.
 */
export interface GymLeaderOptions {
    /** Stable NPC id (matches dialog_id conventions + spec NPC id). */
    npcId: string;
    /** Flag set in SQLite on defeat — checked by the Warp event. */
    badgeFlag: string;
    /** TP word granted as a mastered-word on defeat (one sightings bump). */
    rewardWord: string;
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
    /** XP awarded to the lead party creature on defeat. Typical gym
     *  range is 120–220 depending on region difficulty. */
    xpYield: number;
    /** AI archetype for phase 1; defaults to Aggressive. */
    enemyType?: EnemyType;
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
        enemyType?: EnemyType;
        /** Optional graphic swap (second creature in the roster). */
        graphic?: string;
        /** Optional dialog id to play at the transition moment. */
        transitionDialogId?: string;
    };
}

const PHASE_POLL_MS = 250;

export function GymLeader(opts: GymLeaderOptions): EventDefinition {
    const graphic = opts.graphic ?? 'female';
    return {
        onInit() {
            this.setGraphic(graphic);
            this.hp = opts.hp;
            this.param[ATK] = opts.atk;
            this.param[PDEF] = opts.pdef;

            const attachAi = (archetype: EnemyType): void => {
                new BattleAi(this as never, {
                    enemyType: archetype,
                    attackCooldown: 1000,
                    visionRange: 160,
                    attackRange: 32,
                    fleeThreshold: 0,
                    onDefeated: async (_event, attacker) => {
                        await setFlag(opts.badgeFlag, '1');
                        await recordMasteredWord(opts.rewardWord);
                        await preferences.set(KEYS.journeyBeat, opts.nextBeatId);

                        // Award XP to the lead party creature. If the party is
                        // empty (edge case — shouldn't happen post-starter) we
                        // still advance the beat; XP just has nowhere to go.
                        const party = await getParty();
                        const lead = party[0];
                        if (lead && attacker) {
                            const { xp, levelUps } = gainXp(lead.xp, opts.xpYield);
                            const newLevel = levelUps.length
                                ? levelUps[levelUps.length - 1].to
                                : lead.level;
                            await awardXpToLead(xp, newLevel);

                            await (attacker as RpgPlayer).showText(`+${opts.xpYield} xp`);
                            for (const lvl of levelUps) {
                                await (attacker as RpgPlayer).showText(
                                    `${lead.species_id} L${lvl.from} → L${lvl.to}`,
                                );
                                for (const moveId of movesLearnedAtLevel(lead.species_id, lvl.to)) {
                                    await (attacker as RpgPlayer).showText(`learned: ${moveId}`);
                                }
                            }
                        }

                        if (attacker) {
                            await playDialog(attacker, `${opts.dialogBase}_victory`);
                        }

                        // T3-03: autosave after combat end so badge + xp
                        // gains survive if the player quits before the
                        // next map change fires onJoinMap autosave.
                        if (attacker) {
                            const save = (attacker as unknown as {
                                save?: (slot: number) => Promise<void>;
                            }).save;
                            if (typeof save === 'function') {
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

            attachAi(opts.enemyType ?? EnemyType.Aggressive);

            // Phase-2 poller. Runs only if phase2 is configured; self-
            // stops after the transition or if the entity is removed.
            if (opts.phase2) {
                const threshold = opts.hp * opts.phase2.triggerAtHpFraction;
                let transitioned = false;
                const timer = setInterval(() => {
                    // If the entity's been removed from the map, drop.
                    const hp = (this as unknown as { hp?: number }).hp;
                    if (typeof hp !== 'number' || hp <= 0) {
                        clearInterval(timer);
                        return;
                    }
                    if (!transitioned && hp <= threshold) {
                        transitioned = true;
                        clearInterval(timer);
                        void runPhaseTransition(this, opts.phase2!, attachAi);
                    }
                }, PHASE_POLL_MS);
            }
        },
        async onAction(player: RpgPlayer) {
            const already = await getFlag(opts.badgeFlag);
            if (already) {
                await playDialog(player, `${opts.dialogBase}_victory`);
                return;
            }
            await playDialog(player, `${opts.dialogBase}_intro`);
        },
    };
}

async function runPhaseTransition(
    event: unknown,
    phase2: NonNullable<GymLeaderOptions['phase2']>,
    attachAi: (t: EnemyType) => void,
): Promise<void> {
    const typed = event as {
        hp: number;
        param: Record<number, number>;
        setGraphic?: (id: string) => void;
    };
    typed.hp = phase2.hp;
    typed.param[ATK] = phase2.atk;
    typed.param[PDEF] = phase2.pdef;
    if (phase2.graphic && typed.setGraphic) typed.setGraphic(phase2.graphic);
    attachAi(phase2.enemyType ?? EnemyType.Aggressive);
    // Transition dialog is optional and best-effort — we don't know
    // which player triggered the phase, so we cannot showText() here.
    // The dialog id is reserved for a future player-aware hook.
    void phase2.transitionDialogId;
}
