import type { RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import WarpLoadingComponent from "./poki-warp-loading.ce";
import { WARP_LOADING_CONFIG } from "../content/gameplay";

const warpLoadingClientModule = defineModule<RpgClient>({
    gui: [
        {
            id: WARP_LOADING_CONFIG.guiId,
            component: WarpLoadingComponent,
        },
    ],
});

export function provideWarpLoadingGui() {
    return createModule("WarpLoadingGui", [
        {
            server: null,
            client: warpLoadingClientModule,
        },
    ]);
}
