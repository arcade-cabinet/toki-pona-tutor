import { defineModule } from '@rpgjs/common';
import { RpgServer } from '@rpgjs/server';
import { player } from './player';
import { JanSewi } from './event';

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
            ],
        },
    ],
});
