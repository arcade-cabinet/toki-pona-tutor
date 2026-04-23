import { provideClientGlobalConfig, provideClientModules } from "@rpgjs/client";
import { provideMain } from "../modules/main/main";
import { provideDialogGui } from "./provide-dialog-gui";
import { provideAudioRuntime } from "./provide-audio-runtime";
import { provideCombatChrome } from "./provide-combat-chrome";
import { provideDefeatScreenGui } from "./provide-defeat-screen-gui";
import { provideDictionaryExportRuntime } from "./provide-dictionary-export";
import { provideHudMenuGui } from "./provide-hud-menu-gui";
import { provideLeadMoveBarGui } from "./provide-lead-movebar-gui";
import { provideMapViewport } from "./provide-map-viewport";
import { provideNotificationGui } from "./provide-notification-gui";
import { providePauseGui } from "./provide-pause-gui";
import { provideTapControls } from "./provide-tap-controls";
import { provideTiledMap } from "./provide-tiled-map";
import { provideTitleGui } from "./provide-title-gui";
import { provideWildBattleGui } from "./provide-wild-battle-gui";
import { provideWarpLoadingGui } from "./provide-warp-loading-gui";
import { provideActionBattle } from "@rpgjs/action-battle/client";
import { bossSpritesheets } from "./boss-sprites";
import { effectSpritesheets } from "./effect-sprites";
import { COMBATANT_SPRITESHEETS } from "./combatant-sprites";
import { CREATURE_SPRITESHEETS } from "./creature-sprites";
import { npcSpritesheets } from "./npc-sprites";
import { PLAYER_SPRITESHEETS } from "./player-sprites";

export default {
    providers: [
        provideTiledMap({
            basePath: "map",
        }),
        provideActionBattle(),
        provideCombatChrome(),
        provideClientGlobalConfig(),
        provideAudioRuntime(),
        provideDictionaryExportRuntime(),
        provideTitleGui(),
        provideDialogGui(),
        provideNotificationGui(),
        provideDefeatScreenGui(),
        provideWildBattleGui(),
        provideWarpLoadingGui(),
        provideLeadMoveBarGui(),
        provideHudMenuGui(),
        providePauseGui(),
        provideMapViewport(),
        provideTapControls(),
        provideMain(),
        provideClientModules([
            {
                spritesheets: [
                    ...effectSpritesheets,
                    ...COMBATANT_SPRITESHEETS,
                    ...CREATURE_SPRITESHEETS,
                    ...bossSpritesheets,
                    ...npcSpritesheets,
                    ...PLAYER_SPRITESHEETS,
                ],
            },
        ]),
    ],
};
