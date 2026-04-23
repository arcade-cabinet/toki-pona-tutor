import type { RpgClient } from "@rpgjs/client";
import { inject, RpgClientEngine } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import HudGoalComponent from "./poki-hud-goal.ce";
import HudHintComponent from "./poki-hud-hint.ce";
import HudMenuToggleComponent from "./poki-hud-menu-toggle.ce";
import HudStatusComponent from "./poki-hud-status.ce";
import { HUD_GUI_IDS } from "../content/gameplay";

function currentPlayerDependencies() {
    const engine = inject(RpgClientEngine);
    return [engine.scene.currentPlayer];
}

const hudMenuClientModule = defineModule<RpgClient>({
    gui: [
        {
            id: HUD_GUI_IDS.status,
            component: HudStatusComponent,
            autoDisplay: true,
            dependencies: currentPlayerDependencies,
        },
        {
            id: HUD_GUI_IDS.goal,
            component: HudGoalComponent,
            autoDisplay: true,
            dependencies: currentPlayerDependencies,
        },
        {
            id: HUD_GUI_IDS.menu,
            component: HudMenuToggleComponent,
            autoDisplay: true,
            dependencies: currentPlayerDependencies,
        },
        {
            id: HUD_GUI_IDS.hint,
            component: HudHintComponent,
            autoDisplay: true,
            dependencies: currentPlayerDependencies,
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
