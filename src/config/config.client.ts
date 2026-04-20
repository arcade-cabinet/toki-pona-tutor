import { provideClientGlobalConfig, provideClientModules, Presets } from '@rpgjs/client';
import { provideMain } from '../modules/main';
import { provideTiledMap } from '@rpgjs/tiledmap/client';
import { provideActionBattle } from '@rpgjs/action-battle/client';
import { effectSpritesheets } from './effect-sprites';
import { COMBATANT_SPRITESHEETS } from './combatant-sprites';
import { npcSpritesheets } from './npc-sprites';

export default {
    providers: [
        provideTiledMap({
            basePath: 'map',
        }),
        provideActionBattle(),
        provideClientGlobalConfig(),
        provideMain(),
        provideClientModules([
            {
                spritesheets: [
                    ...effectSpritesheets,
                    ...COMBATANT_SPRITESHEETS,
                    ...npcSpritesheets,
                    {
                        id: 'hero',
                        image: 'spritesheets/hero.png',
                        ...Presets.RMSpritesheet(3, 4),
                    },
                    {
                        id: 'female',
                        image: 'spritesheets/female.png',
                        ...Presets.RMSpritesheet(3, 4),
                    },
                    // Green dragon — final boss. 96×96 per frame; multi-file
                    // layout (one strip per animation) loaded as separate
                    // spritesheets keyed by animation name. The
                    // `setGraphic('green_dragon_idle')` default on the
                    // event swaps to 'green_dragon_death' from the
                    // onDefeated callback per the unique-death-animation
                    // rule (STANDARDS.md § creature tiering, memory entry
                    // green-dragon-final-boss).
                    {
                        id: 'green_dragon_idle',
                        image: 'assets/bosses/green-dragon/idle-green.png',
                        framesWidth: 32,
                        framesHeight: 1,
                        animations: {
                            default: {
                                frames: Array.from({ length: 32 }, (_, i) => i),
                                duration: 1500,
                            },
                        },
                    },
                    {
                        id: 'green_dragon_death',
                        image: 'assets/bosses/green-dragon/death-animation.png',
                        framesWidth: 9,
                        framesHeight: 1,
                        animations: {
                            default: {
                                frames: Array.from({ length: 9 }, (_, i) => i),
                                duration: 1200,
                            },
                        },
                    },
                ],
            },
        ]),
    ],
};
