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
import { LEAD_ACTION_BATTLE_SKILL_DATABASE } from "./lead-battle-skills";
import { runtimeEventPosition, runtimeWarpTarget } from "./runtime-map-events";
import {
    MAP_EVENT_CONFIGS,
    TRAINER_BATTLE_CONFIGS,
    type RuntimeMapEventConfig,
} from "../../content/gameplay";

export default defineModule<RpgServer>({
    database: LEAD_ACTION_BATTLE_SKILL_DATABASE,
    player,
    maps: Object.entries(MAP_EVENT_CONFIGS).map(([id, events]) => ({
        id,
        events: events.map((event) => runtimeEvent(id, event)),
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
    }
}

function trainerBattleConfig(trainerId: string) {
    const config = TRAINER_BATTLE_CONFIGS[trainerId];
    if (!config) throw new Error(`[server] missing trainer battle config: ${trainerId}`);
    return config;
}
