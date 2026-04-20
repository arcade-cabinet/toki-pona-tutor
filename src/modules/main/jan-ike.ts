import { type EventDefinition, RpgPlayer, ATK, PDEF } from '@rpgjs/server';
import { BattleAi, EnemyType } from '@rpgjs/action-battle/server';
import { playDialog } from './dialog';
import { getFlag, setFlag } from '../../platform/persistence/queries';
import { preferences, KEYS } from '../../platform/persistence/preferences';

/**
 * beat_02 rival — jan Ike, blocks the east warp on nasin_wan until
 * defeated in an action-battle. Defeat sets the `jan_ike_defeated`
 * flag so Warp(warp_east → nena_sewi) opens.
 *
 * Stats and AI: aggressive melee bruiser, level-5-equivalent HP/ATK.
 * The first real-time fight the player faces — intentionally simple.
 * Gym-leader fights will layer in skill use + multi-phase.
 */
export function JanIke(): EventDefinition {
    return {
        onInit() {
            // Hooded rogue with daggers — sneaky rival archetype.
            // Sprite registered in src/config/combatant-sprites.ts.
            this.setGraphic('combatant_rogue_hooded');
            // Equivalent of a level-5 creature with a starter move.
            this.hp = 60;
            this.param[ATK] = 14;
            this.param[PDEF] = 8;

            new BattleAi(this as never, {
                enemyType: EnemyType.Aggressive,
                attackCooldown: 900,
                visionRange: 140,
                attackRange: 28,
                fleeThreshold: 0,
                onDefeated: async (_event, attacker) => {
                    await setFlag('jan_ike_defeated', '1');
                    if (attacker) {
                        await playDialog(attacker, 'jan_ike_victory');
                        await preferences.set(KEYS.journeyBeat, 'beat_03_nena_sewi');
                    }
                },
            });
        },
        async onAction(player: RpgPlayer) {
            const alreadyDefeated = await getFlag('jan_ike_defeated');
            if (alreadyDefeated) {
                await playDialog(player, 'jan_ike_victory');
                return;
            }
            await playDialog(player, 'jan_ike_intro');
        },
    };
}
