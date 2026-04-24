import { type EventDefinition, RpgPlayer, ATK, MAXHP, PDEF } from "@rpgjs/server";
import { BattleAi } from "@rpgjs/action-battle/server";
import { playDialog } from "./dialog";
import { ensureBattleAi, scheduleBattleAi } from "./battle-ai";
import { getFlag, setFlag } from "../../platform/persistence/queries";
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
import { SFX_CUE_CONFIG, TRAINER_BATTLE_CONFIGS } from "../../content/gameplay";
import { resolveEnemyType } from "./gym-leader";

const JAN_IKE_CONFIG = TRAINER_BATTLE_CONFIGS.rook;

/**
 * beat_02 rival — jan Ike, blocks the east warp on greenwood_road until
 * defeated in an action-battle. Defeat sets the `rook_defeated`
 * flag so Warp(warp_east → highridge_pass) opens.
 *
 * Stats and AI: aggressive melee bruiser, level-5-equivalent HP/ATK.
 * The first real-time fight the player faces — intentionally simple.
 * Gym-leader fights will layer in skill use + multi-phase.
 */
export function JanIke(): EventDefinition {
    if (!JAN_IKE_CONFIG) throw new Error("[jan-ike] missing trainer battle config: rook");
    const config = JAN_IKE_CONFIG;
    const defeatedFlag = config.defeatedFlag ?? `${config.npcId}_defeated`;
    return {
        onInit() {
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
                            playCombatFaintVisual(event, {
                                graphic: config.graphic,
                                animationName: config.faintAnimation,
                            });
                            await setFlag(defeatedFlag, "1");
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
                                await awardLeadVictoryXp(attacker, config.xpYield ?? 0);
                                await recordQuestEventForActive(attacker, {
                                    type: "defeat",
                                    npcId: config.npcId,
                                });
                                await playDialog(attacker, `${config.dialogBase}_victory`);
                                await preferences.set(KEYS.journeyBeat, config.nextBeatId);
                            }
                        },
                    }),
            );
        },
        onChanges() {
            updateCombatDamageVisuals(this as never);
            void ensureBattleAi(this as never);
        },
        async onAction(player: RpgPlayer) {
            const alreadyDefeated = await getFlag(defeatedFlag);
            if (alreadyDefeated) {
                await playDialog(player, `${config.dialogBase}_victory`);
                return;
            }
            await playDialog(player, `${config.dialogBase}_intro`);
            await activateLeadBattleAvatar(player);
            await cueCombatBgm(player);
        },
    };
}
