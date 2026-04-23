import type { RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import PauseScreenComponent from "./poki-pause-screen.ce";
import { PAUSE_MENU_CONFIG } from "../content/gameplay";

const pauseClientModule = defineModule<RpgClient>({
    gui: [
        {
            id: PAUSE_MENU_CONFIG.guiId,
            component: PauseScreenComponent,
        },
    ],
});

export function providePauseGui() {
    return createModule("PauseGui", [
        {
            server: null,
            client: pauseClientModule,
        },
    ]);
}
