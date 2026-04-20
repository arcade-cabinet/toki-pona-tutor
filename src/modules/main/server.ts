import { defineModule } from '@rpgjs/common';
import { RpgServer } from '@rpgjs/server';
import { EnemyType } from '@rpgjs/action-battle/server';
import { player } from './player';
import { JanSewi } from './event';
import { JanIke } from './jan-ike';
import { GymLeader } from './gym-leader';
import { AmbientNpc } from './ambient-npc';
import { GreenDragon } from './green-dragon';
import { Warp } from './warp';

export default defineModule<RpgServer>({
    player,
    maps: [
        {
            id: 'ma_tomo_lili',
            events: [
                {
                    id: 'jan-sewi',
                    x: 160,
                    y: 96,
                    event: JanSewi(),
                },
                {
                    id: 'warp_east',
                    x: 240,
                    y: 80,
                    event: Warp({
                        targetMap: 'nasin_wan',
                        position: { x: 32, y: 96 },
                        requiredFlag: 'starter_chosen',
                        gatedDialogId: 'jan_sewi_starter_intro',
                    }),
                },
            ],
        },
        {
            id: 'nasin_wan',
            events: [
                {
                    id: 'jan-ike',
                    x: 448,
                    y: 88,
                    event: JanIke(),
                },
                {
                    id: 'warp_east',
                    x: 496,
                    y: 80, // matches nasin_wan.tmj object layer (was 88 — CR #3107839130)
                    event: Warp({
                        targetMap: 'nena_sewi',
                        position: { x: 24, y: 120 }, // from_nasin_wan spawn on nena_sewi
                        requiredFlag: 'jan_ike_defeated',
                    }),
                },
            ],
        },
        {
            id: 'nena_sewi',
            events: [
                {
                    id: 'jan-kala',
                    x: 168,
                    y: 136,
                    // Hiker on mountain pass — hark's hooded ranger look.
                    event: AmbientNpc('npc_villager_masc_hark', 'jan_kala_rest'),
                },
                {
                    id: 'jan-wawa',
                    x: 392,
                    y: 56,
                    event: GymLeader({
                        npcId: 'jan_wawa',
                        badgeFlag: 'badge_sewi',
                        rewardWord: 'sewi',
                        nextBeatId: 'beat_04_ma_telo',
                        // Orange axe-warrior — raw physical strength, wawa type.
                        graphic: 'combatant_warrior_axe',
                        hp: 60,  // phase 1: waso_sewi L8 — lighter
                        atk: 16,
                        pdef: 10,
                        dialogBase: 'jan_wawa',
                        enemyType: EnemyType.Aggressive,
                        phase2: {
                            triggerAtHpFraction: 0.0, // when phase 1 drops, swap
                            hp: 80,  // phase 2: soweli_lete L10 — bulkier
                            atk: 20,
                            pdef: 14,
                            enemyType: EnemyType.Tank,
                        },
                    }),
                },
                {
                    id: 'warp_north',
                    x: 392,
                    y: 0,
                    event: Warp({
                        targetMap: 'ma_telo',
                        position: { x: 40, y: 104 }, // from_nena_sewi spawn on ma_telo
                        requiredFlag: 'badge_sewi',
                    }),
                },
            ],
        },
        {
            id: 'ma_telo',
            events: [
                {
                    id: 'jan-kala-lake',
                    x: 88,
                    y: 216,
                    // Lake fisher — vash's practical outdoor gear suits a shore-side angler.
                    event: AmbientNpc('npc_villager_fem_vash', 'jan_kala_lake_quest'),
                },
                {
                    id: 'jan-moku',
                    x: 136,
                    y: 72,
                    // Food-stall cook — seza's apron / vendor look is a direct match.
                    event: AmbientNpc('npc_villager_fem_seza', 'jan_moku_stall'),
                },
                {
                    id: 'jan-telo',
                    x: 248,
                    y: 136,
                    event: GymLeader({
                        npcId: 'jan_telo',
                        badgeFlag: 'badge_telo',
                        rewardWord: 'telo',
                        nextBeatId: 'beat_05_ma_lete',
                        // Red-robed elemental mage — water/lake aesthetic.
                        graphic: 'combatant_mage_fem_red',
                        hp: 80,  // phase 1: kala_suli L10 — slippery
                        atk: 20,
                        pdef: 12,
                        dialogBase: 'jan_telo',
                        enemyType: EnemyType.Defensive,
                        phase2: {
                            triggerAtHpFraction: 0.0,
                            hp: 100,  // phase 2: kasi_pona L12 — type wrinkle
                            atk: 24,
                            pdef: 16,
                            enemyType: EnemyType.Defensive,
                        },
                    }),
                },
                {
                    id: 'warp_north',
                    x: 248,
                    y: 0,
                    event: Warp({
                        targetMap: 'ma_lete',
                        position: { x: 40, y: 104 }, // from_ma_telo spawn on ma_lete
                        requiredFlag: 'badge_telo',
                    }),
                },
            ],
        },
        {
            id: 'ma_lete',
            events: [
                {
                    id: 'jan-anpa',
                    x: 104,
                    y: 72,
                    // Watchman in cold village — grym's heavy weathered look fits cold-region.
                    event: AmbientNpc('npc_villager_masc_grym', 'jan_anpa_watch'),
                },
                {
                    id: 'jan-kasi',
                    x: 248,
                    y: 168,
                    // Garden-tender — vash's practical outdoors gear.
                    event: AmbientNpc('npc_villager_fem_vash', 'jan_kasi_garden'),
                },
                {
                    id: 'jan-lete',
                    x: 280,
                    y: 72,
                    event: GymLeader({
                        npcId: 'jan_lete',
                        badgeFlag: 'badge_lete',
                        rewardWord: 'lete',
                        nextBeatId: 'beat_06_nena_suli',
                        // Hooded brown mage — cold, withdrawn ice master.
                        graphic: 'combatant_mage_hooded_brown',
                        hp: 90,  // phase 1: waso_lete L10 — quick
                        atk: 22,
                        pdef: 14,
                        dialogBase: 'jan_lete',
                        enemyType: EnemyType.Ranged,
                        phase2: {
                            triggerAtHpFraction: 0.0,
                            hp: 120,  // phase 2: soweli_lete_suli L13 — bear
                            atk: 30,
                            pdef: 20,
                            enemyType: EnemyType.Tank,
                        },
                    }),
                },
                {
                    id: 'warp_north',
                    x: 280,
                    y: 0,
                    event: Warp({
                        targetMap: 'nena_suli',
                        position: { x: 40, y: 200 }, // from_ma_lete spawn on nena_suli
                        requiredFlag: 'badge_lete',
                    }),
                },
            ],
        },
        {
            id: 'nena_suli',
            events: [
                {
                    id: 'jan-pi-kon',
                    x: 88,
                    y: 168,
                    // Meditating figure on great peak — nyro's mystic robes.
                    event: AmbientNpc('npc_villager_masc_nyro', 'jan_pi_kon_meditate'),
                },
                {
                    id: 'jan-pi-nasin',
                    x: 168,
                    y: 120,
                    // Trail-asking NPC — janik's distinguished artisan look.
                    event: AmbientNpc('npc_villager_masc_janik', 'jan_pi_nasin_ask'),
                },
                {
                    id: 'jan-suli',
                    x: 136,
                    y: 40,
                    event: GymLeader({
                        npcId: 'jan_suli',
                        badgeFlag: 'badge_suli',
                        rewardWord: 'suli',
                        nextBeatId: 'beat_07_nasin_pi_telo',
                        // Paladin — champion-tier, hardest gym before endgame.
                        graphic: 'combatant_warrior_paladin',
                        hp: 110,  // phase 1: waso_sewi L12 — eagle skills
                        atk: 28,
                        pdef: 18,
                        dialogBase: 'jan_suli',
                        enemyType: EnemyType.Aggressive,
                        phase2: {
                            triggerAtHpFraction: 0.0,
                            hp: 140,  // phase 2: soweli_lete_suli L14 — the bear
                            atk: 36,
                            pdef: 22,
                            enemyType: EnemyType.Berserker,
                        },
                    }),
                },
                {
                    id: 'warp_north',
                    x: 136,
                    y: 0,
                    event: Warp({
                        targetMap: 'nasin_pi_telo',
                        position: { x: 40, y: 104 }, // from_nena_suli spawn on nasin_pi_telo
                        requiredFlag: 'badge_suli',
                    }),
                },
            ],
        },
        {
            id: 'nasin_pi_telo',
            events: [
                {
                    id: 'jan-kala-lili',
                    x: 120,
                    y: 152,
                    // Lighter-duty young fisher — hana's warm casual look.
                    event: AmbientNpc('npc_villager_fem_hana', 'jan_kala_lili_flavor'),
                },
                {
                    id: 'jan-moku-pona',
                    x: 200,
                    y: 88,
                    // Grillmaster — artun's youthful energetic look for a roadside cook.
                    event: AmbientNpc('npc_villager_masc_artun', 'jan_moku_pona_grill'),
                },
                {
                    id: 'jan-kala-suli',
                    x: 280,
                    y: 152,
                    // Veteran fisher (suli = big/experienced) — heaviest warrior sprite.
                    event: AmbientNpc('npc_warrior_2h_sword', 'jan_kala_suli_tuneup'),
                },
                {
                    id: 'jan-olin-telo',
                    x: 360,
                    y: 88,
                    // Quiet lake-lover — reza's traveller look for a riverside contemplator.
                    event: AmbientNpc('npc_villager_masc_reza', 'jan_olin_telo_quiet'),
                },
                {
                    id: 'green-dragon',
                    x: 432,
                    y: 104,
                    event: GreenDragon(),
                },
            ],
        },
    ],
});
