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
                        position: { x: 32, y: 96 },
                        requiredFlag: 'badge_telo',
                    }),
                },
            ],
        },
    ],
});
