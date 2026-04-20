import { defineModule } from '@rpgjs/common';
import { RpgServer } from '@rpgjs/server';
import { player } from './player';
import { JanSewi } from './event';
import { JanIke } from './jan-ike';
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
                        position: { x: 32, y: 96 },
                        requiredFlag: 'jan_ike_defeated',
                    }),
                },
            ],
        },
    ],
});
