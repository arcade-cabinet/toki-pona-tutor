import { createServer, provideServerModules, provideSaveStorage } from "@rpgjs/server";
import { provideTiledMap } from "@rpgjs/tiledmap/server";
import { provideActionBattle } from "@rpgjs/action-battle/server";
import { provideMain } from "./modules/main/main";
import { CapacitorSaveStorageStrategy } from "./platform/persistence/save-strategy";
import { chunkMapProviderModule } from "./modules/chunk-map-provider";

export default createServer({
    providers: [
        provideMain(),
        provideSaveStorage(new CapacitorSaveStorageStrategy()),
        provideServerModules([chunkMapProviderModule]),
        provideTiledMap(),
        provideActionBattle(),
    ],
});
