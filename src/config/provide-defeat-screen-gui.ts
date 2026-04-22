import type { RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import DefeatScreenComponent from "./poki-defeat-screen.ce";
import { DEFEAT_SCREEN_CONFIG } from "../content/gameplay";

const defeatScreenClientModule = defineModule<RpgClient>({
    gui: [
        {
            id: DEFEAT_SCREEN_CONFIG.guiId,
            component: DefeatScreenComponent,
        },
    ],
});

export function provideDefeatScreenGui() {
    return createModule("DefeatScreenGui", [
        {
            server: null,
            client: defeatScreenClientModule,
        },
    ]);
}
