import type { RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import DialogComponent from "./rpg-dialog.ce";
import { DIALOG_UI_CONFIG } from "../content/gameplay";

const dialogClientModule = defineModule<RpgClient>({
    gui: [
        {
            id: DIALOG_UI_CONFIG.guiId,
            component: DialogComponent,
        },
    ],
});

export function provideDialogGui() {
    return createModule("DialogGui", [
        {
            server: null,
            client: dialogClientModule,
        },
    ]);
}
