import type { RpgPlayer } from "@rpgjs/server";
import { AUDIO_BGM_OVERRIDE_EVENT } from "./audio";
import { effectiveSfxVolume, type SfxEvent } from "./sfx";
import { COMBAT_AUDIO_CONFIG, SFX_CUE_CONFIG } from "../../content/gameplay";
import { getBgmVolume, getSfxVolume } from "../../platform/persistence/settings";
import { activateLeadBattleAvatar, restoreLeadBattleAvatar } from "./lead-battle-avatar";

const ACTIVE_AI_STATES = new Set(COMBAT_AUDIO_CONFIG.activeAiStates);

type BattleEventLike = {
    id?: string;
    battleAi?: unknown;
    hp?: number;
    x?: () => number;
    y?: () => number;
};

type MapWithEvents = {
    getEvents?: () => BattleEventLike[];
};

type PlayerLike = {
    id?: string;
    hp?: number;
};

type BattleAiLike = {
    getTarget?: () => unknown;
    getState?: () => unknown;
};

type CombatAudioMonitor = {
    timer: ReturnType<typeof setInterval>;
    wasActive: boolean;
    lastHp: number | null;
};

const combatAudioMonitors = new WeakMap<RpgPlayer, CombatAudioMonitor>();

export async function cueCombatBgm(player: RpgPlayer): Promise<void> {
    const mapId = player.getCurrentMap()?.id ?? "unknown";
    player.emit(AUDIO_BGM_OVERRIDE_EVENT, {
        mapId,
        inCombat: true,
        userVol: await getBgmVolume(),
    });
}

export async function cueAmbientBgm(player: RpgPlayer): Promise<void> {
    const mapId = player.getCurrentMap()?.id ?? "unknown";
    player.emit(AUDIO_BGM_OVERRIDE_EVENT, {
        mapId,
        inCombat: false,
        userVol: await getBgmVolume(),
    });
}

export async function cueSfx(player: RpgPlayer, event: SfxEvent): Promise<void> {
    player.playSound(event, {
        volume: effectiveSfxVolume(event, await getSfxVolume()),
        loop: false,
    });
}

export async function cueBattleActionAudio(player: RpgPlayer): Promise<void> {
    if (!hasNearbyBattleEvent(player)) return;
    await activateLeadBattleAvatar(player);
    await cueCombatBgm(player);
    await cueSfx(player, SFX_CUE_CONFIG.battleAction);
}

export function registerCombatAudioMonitor(player: RpgPlayer): void {
    unregisterCombatAudioMonitor(player);
    const monitor: CombatAudioMonitor = {
        timer: setInterval(() => {
            void updateCombatAudioMonitor(player);
        }, COMBAT_AUDIO_CONFIG.monitorMs),
        wasActive: false,
        lastHp: readPlayerHp(player),
    };
    combatAudioMonitors.set(player, monitor);
}

export function unregisterCombatAudioMonitor(player: RpgPlayer): void {
    const monitor = combatAudioMonitors.get(player);
    if (!monitor) return;
    clearInterval(monitor.timer);
    combatAudioMonitors.delete(player);
}

export function isBattleEventInRange(
    playerPosition: { x: number; y: number },
    event: BattleEventLike,
    maxDistance = COMBAT_AUDIO_CONFIG.battleActionAudioRange,
): boolean {
    if (!event.battleAi) return false;
    if (typeof event.hp === "number" && event.hp <= 0) return false;
    if (typeof event.x !== "function" || typeof event.y !== "function") return false;

    const dx = event.x() - playerPosition.x;
    const dy = event.y() - playerPosition.y;
    return Math.hypot(dx, dy) <= maxDistance;
}

export function isBattleAiTargetingPlayer(player: PlayerLike, event: BattleEventLike): boolean {
    const battleAi = event.battleAi as BattleAiLike | undefined;
    if (
        !battleAi ||
        typeof battleAi.getTarget !== "function" ||
        typeof battleAi.getState !== "function"
    ) {
        return false;
    }

    const state = battleAi.getState();
    if (!ACTIVE_AI_STATES.has(String(state))) return false;

    const target = battleAi.getTarget() as PlayerLike | null | undefined;
    if (!target) return false;
    return target === player || (target.id != null && target.id === player.id);
}

function hasNearbyBattleEvent(player: RpgPlayer): boolean {
    const playerPosition = { x: player.x(), y: player.y() };
    const events =
        ((player.getCurrentMap?.() ?? null) as MapWithEvents | null)?.getEvents?.() ?? [];
    return events.some((event) => isBattleEventInRange(playerPosition, event));
}

async function updateCombatAudioMonitor(player: RpgPlayer): Promise<void> {
    const monitor = combatAudioMonitors.get(player);
    if (!monitor) return;

    const active = hasBattleAiTargetingPlayer(player);
    const currentHp = readPlayerHp(player);
    if (active) {
        if (!monitor.wasActive) {
            await activateLeadBattleAvatar(player);
            await cueCombatBgm(player);
        }
        if (currentHp != null && monitor.lastHp != null && currentHp < monitor.lastHp) {
            await cueSfx(player, SFX_CUE_CONFIG.playerDamage);
        }
    } else if (monitor.wasActive) {
        await restoreLeadBattleAvatar(player);
        await cueAmbientBgm(player);
    }

    monitor.wasActive = active;
    monitor.lastHp = currentHp;
}

function hasBattleAiTargetingPlayer(player: RpgPlayer): boolean {
    const events =
        ((player.getCurrentMap?.() ?? null) as MapWithEvents | null)?.getEvents?.() ?? [];
    return events.some((event) => isBattleAiTargetingPlayer(player, event));
}

function readPlayerHp(player: RpgPlayer): number | null {
    const value = Number((player as { hp?: unknown }).hp);
    return Number.isFinite(value) ? value : null;
}
