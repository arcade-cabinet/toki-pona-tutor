import type { RpgClient } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import NotificationComponent from "./rr-notification.ce";

const notificationClientModule = defineModule<RpgClient>({
    gui: [
        {
            id: "rpg-notification",
            component: NotificationComponent,
            autoDisplay: true,
        },
    ],
});

export function provideNotificationGui() {
    return createModule("NotificationGui", [
        {
            server: null,
            client: notificationClientModule,
        },
    ]);
}
