import { createServer, provideServerModules, provideSaveStorage } from "@rpgjs/server";
import { provideTiledMap } from "@rpgjs/tiledmap/server";
import { provideActionBattle } from "@rpgjs/action-battle/server";
import { provideMain } from "./modules/main/main";
import { CapacitorSaveStorageStrategy } from "./platform/persistence/save-strategy";

export default createServer({
    providers: [
        provideMain(),
        provideSaveStorage(new CapacitorSaveStorageStrategy()),
        provideServerModules([]),
        provideTiledMap(),
        provideActionBattle(),
    ],
});
