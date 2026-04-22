import type { RpgClient } from "@rpgjs/client";
import { inject, RpgClientEngine } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import HudHintComponent from "./poki-hud-hint.ce";
import HudMenuToggleComponent from "./poki-hud-menu-toggle.ce";
import HudStatusComponent from "./poki-hud-status.ce";
import { HUD_GUI_IDS } from "../content/gameplay";

const hudMenuClientModule = defineModule<RpgClient>({
    gui: [
        {
            id: HUD_GUI_IDS.status,
            component: HudStatusComponent,
            autoDisplay: true,
            dependencies: () => {
                const engine = inject(RpgClientEngine);
                return [engine.scene.currentPlayer];
            },
        },
        {
            id: HUD_GUI_IDS.menu,
            component: HudMenuToggleComponent,
            autoDisplay: true,
            dependencies: () => {
                const engine = inject(RpgClientEngine);
                return [engine.scene.currentPlayer];
            },
        },
        {
            id: HUD_GUI_IDS.hint,
            component: HudHintComponent,
            autoDisplay: true,
            dependencies: () => {
                const engine = inject(RpgClientEngine);
                return [engine.scene.currentPlayer];
            },
        },
    ],
});

export function provideHudMenuGui() {
    return createModule("HudMenuGui", [
        {
            server: null,
            client: hudMenuClientModule,
        },
    ]);
}
