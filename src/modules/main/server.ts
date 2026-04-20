import { defineModule } from '@rpgjs/common';
import { RpgServer } from '@rpgjs/server';
import { EnemyType } from '@rpgjs/action-battle/server';
import { player } from './player';
import { JanSewi } from './event';
import { JanIke } from './jan-ike';
import { GymLeader } from './gym-leader';
import { AmbientNpc } from './ambient-npc';
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
                    event: AmbientNpc('female', 'jan_kala_rest'),
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
                        hp: 110,
                        atk: 18,
                        pdef: 12,
                        dialogBase: 'jan_wawa',
                        enemyType: EnemyType.Aggressive,
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
                    event: AmbientNpc('female', 'jan_kala_lake_quest'),
                },
                {
                    id: 'jan-moku',
                    x: 136,
                    y: 72,
                    event: AmbientNpc('female', 'jan_moku_stall'),
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
                        hp: 140,
                        atk: 22,
                        pdef: 14,
                        dialogBase: 'jan_telo',
                        enemyType: EnemyType.Defensive,
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
                    event: AmbientNpc('female', 'jan_anpa_watch'),
                },
                {
                    id: 'jan-kasi',
                    x: 248,
                    y: 168,
                    event: AmbientNpc('female', 'jan_kasi_garden'),
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
                        hp: 170,
                        atk: 26,
                        pdef: 16,
                        dialogBase: 'jan_lete',
                        enemyType: EnemyType.Tank,
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
                    event: AmbientNpc('female', 'jan_pi_kon_meditate'),
                },
                {
                    id: 'jan-pi-nasin',
                    x: 168,
                    y: 120,
                    event: AmbientNpc('female', 'jan_pi_nasin_ask'),
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
                        hp: 210,
                        atk: 32,
                        pdef: 20,
                        dialogBase: 'jan_suli',
                        enemyType: EnemyType.Berserker,
                    }),
                },
                {
                    id: 'warp_north',
                    x: 136,
                    y: 0,
                    event: Warp({
                        targetMap: 'nasin_pi_telo',
                        position: { x: 32, y: 96 },
                        requiredFlag: 'badge_suli',
                    }),
                },
            ],
        },
    ],
});
