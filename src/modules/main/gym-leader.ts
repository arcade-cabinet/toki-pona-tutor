import { type EventDefinition, RpgPlayer, ATK, PDEF } from '@rpgjs/server';
import { BattleAi, EnemyType } from '@rpgjs/action-battle/server';
import { playDialog } from './dialog';
import { getFlag, setFlag, recordMasteredWord } from '../../platform/persistence/queries';
import { preferences, KEYS } from '../../platform/persistence/preferences';

/**
 * Shared factory for the seven jan lawa (region masters). Each fight
 * is structurally identical: an aggressive/defensive BattleAi that,
 * on defeat, flips a badge flag, advances the journey pointer, and
 * grants a reward word via the mastered-words counter.
 *
 * The current implementation runs a single BattleAi entity per
 * leader. Multi-phase (e.g. jan Wawa's "waso_sewi → soweli_lete"
 * sequence) will land when RPG.js's phase-transition hook is wired;
 * for now the entity represents the combined gym with stats merged.
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
    /** Combined HP across both creatures in the leader's party. */
    hp: number;
    /** Attack parameter. */
    atk: number;
    /** Physical defense parameter. */
    pdef: number;
    /** Base dialog id — `<base>` for intro, `<base>_victory` for post-win. */
    dialogBase: string;
    /** AI archetype; defaults to Aggressive. */
    enemyType?: EnemyType;
    /** Graphic id (from config.client.ts spritesheets). */
    graphic?: string;
}

export function GymLeader(opts: GymLeaderOptions): EventDefinition {
    const graphic = opts.graphic ?? 'female';
    return {
        onInit() {
            this.setGraphic(graphic);
            this.hp = opts.hp;
            this.param[ATK] = opts.atk;
            this.param[PDEF] = opts.pdef;

            new BattleAi(this as never, {
                enemyType: opts.enemyType ?? EnemyType.Aggressive,
                attackCooldown: 1000,
                visionRange: 160,
                attackRange: 32,
                fleeThreshold: 0,
                onDefeated: async (_event, attacker) => {
                    await setFlag(opts.badgeFlag, '1');
                    await recordMasteredWord(opts.rewardWord);
                    await preferences.set(KEYS.journeyBeat, opts.nextBeatId);
                    if (attacker) {
                        await playDialog(attacker, `${opts.dialogBase}_victory`);
                    }
                },
            });
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
