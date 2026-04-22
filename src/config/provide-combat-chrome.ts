import type { RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
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
    component: typeof CombatHpBarComponent;
    props: (object: CombatSpriteObject) => ReturnType<typeof combatChromePropsForObject>;
    dependencies: (object: CombatSpriteObject) => unknown[];
};

const combatFeedbackConfig: CombatChromeComponentConfig = {
    component: CombatFeedbackComponent as unknown as typeof CombatHpBarComponent,
    props: combatChromePropsForObject,
    dependencies: combatChromeDependenciesForObject,
};

const combatHpBarConfig: CombatChromeComponentConfig = {
    component: CombatHpBarComponent,
    props: combatChromePropsForObject,
    dependencies: combatChromeDependenciesForObject,
};

const combatTargetReticleConfig: CombatChromeComponentConfig = {
    component: CombatTargetReticleComponent as unknown as typeof CombatHpBarComponent,
    props: combatChromePropsForObject,
    dependencies: combatChromeDependenciesForObject,
};

const combatChromeClientModule = defineModule<RpgClient>({
    componentAnimations: [
        {
            id: COMBAT_UI_CONFIG.combatFaintAnimationId,
            component: CombatFaintComponent,
        },
    ],
    sprite: {
        componentsInFront: [
            combatTargetReticleConfig as unknown as typeof CombatHpBarComponent,
            combatFeedbackConfig as unknown as typeof CombatHpBarComponent,
            combatHpBarConfig as unknown as typeof CombatHpBarComponent,
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
