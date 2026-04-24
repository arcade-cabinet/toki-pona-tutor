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
type WorldMapObject = {
    layer: string;
    name: string;
    type: string;
    x: number;
    y: number;
    properties: Record<string, unknown>;
};
type WorldMap = { id: string; objects: WorldMapObject[] };
type WorldMetadata = { signs?: WorldSign[]; maps?: WorldMap[] };
const worldSigns = ((worldRaw as unknown as WorldMetadata).signs ?? []) as WorldSign[];
const worldMaps = ((worldRaw as unknown as WorldMetadata).maps ?? []) as WorldMap[];

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
            event: SignEvent(s.body.en, s.title),
        }));
}

/**
 * Dossier NPC runtime wiring (T65). Dossier appearances
 * (src/content/regions/<id>/npcs/*.json → appearances[]) become Tiled
 * objects at author time via scripts/map-authoring/lib/dossier-merge.ts,
 * but RPG.js's tiledmap plugin does NOT auto-spawn NPC objects — it only
 * registers events declared in server modules. Here we walk world.json's
 * compiled map objects (emitted by build-spine.mjs from .tmj Objects
 * layers), pick every `type === "NPC"` whose name starts with `npc-`
 * (the convention used by dossier-merge to tag dossier-sourced NPCs),
 * and register an AmbientNpc event per appearance.
 *
 * Gating: the Tiled object's `required_flag` custom property (propagated
 * from the dossier's `appearances[].requires_flag`) hides the sprite and
 * makes onAction a no-op until the flag is set — AmbientNpc swaps the
 * graphic reactively on every sync.
 *
 * Green dragon is excluded: it lives as a dedicated `green_dragon` event
 * kind in events.json (the endgame encounter), not an ambient NPC.
 */
const DOSSIER_NPC_GRAPHIC = "npc_villager_masc_janik";
const DOSSIER_NPC_EXCLUDED_IDS = new Set(["green_dragon"]);

function dossierNpcEventsForMap(mapId: string) {
    const map = worldMaps.find((m) => m.id === mapId);
    if (!map) return [];
    const handAuthoredIds = new Set(
        (MAP_EVENT_CONFIGS[mapId] ?? []).map((event) => event.id),
    );
    return map.objects
        .filter((o) => o.type === "NPC" && o.name.startsWith("npc-"))
        .filter((o) => {
            const dossierId = String(o.properties.id ?? "");
            if (!dossierId) return false;
            if (DOSSIER_NPC_EXCLUDED_IDS.has(dossierId)) return false;
            // Collision guard: a hand-authored event.id that matches the
            // dossier NPC's marker name would double-spawn the position.
            if (handAuthoredIds.has(o.name)) return false;
            return true;
        })
        .map((o) => {
            const dialogId = String(o.properties.dialog_id ?? "");
            const requiredFlag = typeof o.properties.required_flag === "string"
                ? o.properties.required_flag
                : undefined;
            const graphic = typeof o.properties.graphic === "string" && o.properties.graphic.length > 0
                ? o.properties.graphic
                : DOSSIER_NPC_GRAPHIC;
            return {
                id: o.name,
                x: o.x,
                y: o.y,
                event: AmbientNpc(graphic, dialogId, { requiredFlag }),
            };
        });
}

const mapIds = new Set<string>([
    ...Object.keys(MAP_EVENT_CONFIGS),
    ...worldSigns.map((s) => s.region),
    ...worldMaps.map((m) => m.id),
]);

export default defineModule<RpgServer>({
    database: LEAD_ACTION_BATTLE_SKILL_DATABASE,
    player,
    maps: Array.from(mapIds).map((id) => ({
        id,
        events: [
            ...(MAP_EVENT_CONFIGS[id] ?? []).map((event) => runtimeEvent(id, event)),
            ...signEventsForMap(id),
            ...dossierNpcEventsForMap(id),
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
