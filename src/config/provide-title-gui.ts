import type { RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import TitleScreenComponent from "./rr-title-screen.ce";
import { TITLE_MENU_CONFIG } from "../content/gameplay";

const titleClientModule = defineModule<RpgClient>({
    gui: [
        {
            id: TITLE_MENU_CONFIG.guiId,
            component: TitleScreenComponent,
        },
    ],
});

export function provideTitleGui() {
    return createModule("TitleGui", [
        {
            server: null,
            client: titleClientModule,
        },
    ]);
}
