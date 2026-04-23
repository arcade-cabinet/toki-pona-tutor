import type { RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import LeadMoveBarComponent from "./poki-lead-movebar.ce";
import { COMBAT_UI_CONFIG } from "../content/gameplay";

const leadMoveBarClientModule = defineModule<RpgClient>({
    gui: [
        {
            id: COMBAT_UI_CONFIG.leadMoveBarGuiId,
            component: LeadMoveBarComponent,
        },
    ],
});

export function provideLeadMoveBarGui() {
    return createModule("LeadMoveBarGui", [
        {
            server: null,
            client: leadMoveBarClientModule,
        },
    ]);
}
