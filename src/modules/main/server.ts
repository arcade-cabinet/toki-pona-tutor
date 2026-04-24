import { defineModule } from "@rpgjs/common";
import { RpgServer } from "@rpgjs/server";
import { player } from "./player";
import { JanSewi } from "./event";
import { JanIke } from "./jan-ike";
import { GymLeader } from "./gym-leader";
import { AmbientNpc } from "./ambient-npc";
import { QuestNpc } from "./quest-npc";
import { GreenDragon } from "./green-dragon";
import { Warp } from "./warp";
import { JanMokuShop } from "./shop-npc";
import { SignEvent } from "./sign";
import { LEAD_ACTION_BATTLE_SKILL_DATABASE } from "./lead-battle-skills";
import { runtimeEventPosition, runtimeWarpTarget } from "./runtime-map-events";
import {
    MAP_EVENT_CONFIGS,
    TRAINER_BATTLE_CONFIGS,
    type RuntimeMapEventConfig,
} from "../../content/gameplay";
import worldRaw from "../../content/generated/world.json";

type WorldSign = { region: string; at: [number, number]; title: string; body: { en: string } };
type WorldMetadata = { signs?: WorldSign[] };
const worldSigns = ((worldRaw as unknown as WorldMetadata).signs ?? []) as WorldSign[];

/**
 * Sign runtime wiring (T61). Signs live in the region dossiers under
 * `src/content/regions/<id>/signs.json` and compile into world.json's
 * top-level `signs` array. The map-authoring pipeline's dossier-merge
 * step also emits one Tiled Sign object per sign at author time
 * (separate PR). Here we register a SignEvent per sign so the
 * engine surfaces the body on action. Each sign gets a stable id of
 * the form `sign_<x>_<y>` within its region — the Tiled object id
 * matches, so RPG.js's tiledMapFolderPlugin pairs them automatically.
 */
function signEventsForMap(mapId: string) {
    return worldSigns
        .filter((s) => s.region === mapId)
        .map((s) => ({
            id: `sign_${s.at[0]}_${s.at[1]}`,
            x: s.at[0] * 16,
            y: (s.at[1] + 1) * 16,
            event: SignEvent(s.body.en),
        }));
}

const mapIds = new Set<string>([
    ...Object.keys(MAP_EVENT_CONFIGS),
    ...worldSigns.map((s) => s.region),
]);

export default defineModule<RpgServer>({
    database: LEAD_ACTION_BATTLE_SKILL_DATABASE,
    player,
    maps: Array.from(mapIds).map((id) => ({
        id,
        events: [
            ...(MAP_EVENT_CONFIGS[id] ?? []).map((event) => runtimeEvent(id, event)),
            ...signEventsForMap(id),
        ],
    })),
});

function runtimeEvent(mapId: string, config: RuntimeMapEventConfig) {
    const position = runtimeEventPosition(mapId, config);
    return {
        id: config.id,
        x: position.x,
        y: position.y,
        event: eventDefinition(mapId, config),
    };
}

function eventDefinition(mapId: string, config: RuntimeMapEventConfig) {
    switch (config.kind) {
        case "ambient_npc":
            return AmbientNpc(config.graphic, config.dialogId);
        case "quest_npc":
            return QuestNpc(config.graphic, config.dialogId, config.questId);
        case "starter_mentor":
            return JanSewi();
        case "rival":
            if (config.trainerId !== "rook") {
                throw new Error(`[server] unsupported rival trainer: ${config.trainerId}`);
            }
            return JanIke();
        case "gym_leader":
            return GymLeader(trainerBattleConfig(config.trainerId));
        case "shop":
            if (config.shopId !== "shopkeep") {
                throw new Error(`[server] unsupported shop event: ${config.shopId}`);
            }
            return JanMokuShop();
        case "green_dragon":
            return GreenDragon();
        case "warp":
            const target = runtimeWarpTarget(mapId, config);
            return Warp({
                targetMap: target.targetMap,
                position: target.position,
                requiredFlag: target.requiredFlag,
                gatedDialogId: config.gatedDialogId,
            });
        case "sign":
            return SignEvent(config.body);
    }
}

function trainerBattleConfig(trainerId: string) {
    const config = TRAINER_BATTLE_CONFIGS[trainerId];
    if (!config) throw new Error(`[server] missing trainer battle config: ${trainerId}`);
    return config;
}
