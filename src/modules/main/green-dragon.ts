import { type EventDefinition, RpgPlayer, ATK, PDEF } from '@rpgjs/server';
import { BattleAi, EnemyType } from '@rpgjs/action-battle/server';
import { playDialog } from './dialog';
import { getFlag, setFlag, recordMasteredWord } from '../../platform/persistence/queries';
import { preferences, KEYS } from '../../platform/persistence/preferences';

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
    const [sewi, telo, lete, suli] = await Promise.all([
        getFlag('badge_sewi'),
        getFlag('badge_telo'),
        getFlag('badge_lete'),
        getFlag('badge_suli'),
    ]);
    return Boolean(sewi && telo && lete && suli);
}

export function GreenDragon(): EventDefinition {
    return {
        onInit() {
            this.setGraphic('female'); // placeholder — swap to dragon spritesheet in V15
            this.hp = 320;
            this.param[ATK] = 42;
            this.param[PDEF] = 28;

            new BattleAi(this as never, {
                enemyType: EnemyType.Berserker,
                attackCooldown: 700,
                visionRange: 200,
                attackRange: 40,
                fleeThreshold: 0,
                onDefeated: async (_event, attacker) => {
                    await setFlag('green_dragon_defeated', '1');
                    await recordMasteredWord('kala'); // green dragon = final kala
                    await preferences.set(KEYS.journeyBeat, 'ending');
                    if (attacker) {
                        await playDialog(attacker, 'green_dragon_victory');
                    }
                },
            });
        },
        async onAction(player: RpgPlayer) {
            const done = await getFlag('green_dragon_defeated');
            if (done) {
                await playDialog(player, 'green_dragon_victory');
                return;
            }
            await playDialog(player, 'green_dragon_intro');
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
    const done = await getFlag('green_dragon_defeated');
    if (done) return;
    const ready = await allBadgesEarned();
    if (!ready) return;
    await playDialog(player, 'green_dragon_intro');
    // The actual BattleAi is attached to the green_dragon event on the
    // nasin_pi_telo map; the trigger's job is just to gate entry and
    // prime the intro dialog. Combat begins when the player attacks.
}
