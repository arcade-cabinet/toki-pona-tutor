import type { RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import WildBattleComponent from "./poki-wild-battle.ce";
import { COMBAT_UI_CONFIG } from "../content/gameplay";

const wildBattleClientModule = defineModule<RpgClient>({
    gui: [
        {
            id: COMBAT_UI_CONFIG.wildBattleGuiId,
            component: WildBattleComponent,
        },
    ],
});

export function provideWildBattleGui() {
    return createModule("WildBattleGui", [
        {
            server: null,
            client: wildBattleClientModule,
        },
    ]);
}
