import type { RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import type { ComponentFunction } from "canvasengine";
import {
    combatChromeDependenciesForObject,
    combatChromePropsForObject,
    type CombatSpriteObject,
} from "./combat-chrome-props";
import CombatFaintComponent from "./poki-combat-faint.ce";
import CombatFeedbackComponent from "./poki-combat-feedback.ce";
import CombatHpBarComponent from "./poki-combat-hp-bar.ce";
import CombatTargetReticleComponent from "./poki-combat-target-reticle.ce";
import { COMBAT_UI_CONFIG } from "../content/gameplay";

type CombatChromeComponentConfig = {
    component: ComponentFunction;
    props: (object: CombatSpriteObject) => ReturnType<typeof combatChromePropsForObject>;
    dependencies: (object: CombatSpriteObject) => unknown[];
};

type RpgClientWithSpriteComponentRegistrations = Omit<RpgClient, "sprite"> & {
    sprite: {
        componentsInFront: CombatChromeComponentConfig[];
    };
};

const combatFeedbackConfig: CombatChromeComponentConfig = {
    component: CombatFeedbackComponent,
    props: combatChromePropsForObject,
    dependencies: combatChromeDependenciesForObject,
};

const combatHpBarConfig: CombatChromeComponentConfig = {
    component: CombatHpBarComponent,
    props: combatChromePropsForObject,
    dependencies: combatChromeDependenciesForObject,
};

const combatTargetReticleConfig: CombatChromeComponentConfig = {
    component: CombatTargetReticleComponent,
    props: combatChromePropsForObject,
    dependencies: combatChromeDependenciesForObject,
};

const combatChromeClientModule = defineModule<RpgClientWithSpriteComponentRegistrations>({
    componentAnimations: [
        {
            id: COMBAT_UI_CONFIG.combatFaintAnimationId,
            component: CombatFaintComponent,
        },
    ],
    sprite: {
        componentsInFront: [
            combatTargetReticleConfig,
            combatFeedbackConfig,
            combatHpBarConfig,
        ],
    },
});

export function provideCombatChrome() {
    return createModule("CombatChrome", [
        {
            server: null,
            client: combatChromeClientModule,
        },
    ]);
}
