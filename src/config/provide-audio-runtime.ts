import type { RpgClient, RpgClientEngine } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import { effect } from "canvasengine";
import {
    AUDIO_BGM_OVERRIDE_EVENT,
    bgmFile,
    isBgmId,
    isBgmOverridePayload,
} from "../modules/main/audio";
import { AUDIO_RUNTIME_CONFIG } from "../content/gameplay";
import { isSfxEvent, sfxFile } from "../modules/main/sfx";
import { getBgmVolume } from "../platform/persistence/settings";
import { BgmCrossfadeController, publicAssetPath } from "./audio-controller";
import { playClientSfx } from "./client-sfx";

type MapDataLike = {
    id?: string;
    tiled?: {
        tilewidth?: number;
        tileheight?: number;
    };
};

type ClientPlayerLike = {
    x?: () => number;
    y?: () => number;
};

let audioInstalled = false;

const audioRuntimeClientModule = defineModule<RpgClient>({
    engine: {
        onStart(engine) {
            installAudioRuntime(engine);
        },
    },
});

export function provideAudioRuntime() {
    return createModule("AudioRuntime", [
        {
            server: null,
            client: audioRuntimeClientModule,
        },
    ]);
}

function installAudioRuntime(engine: RpgClientEngine): void {
    if (audioInstalled) return;
    audioInstalled = true;

    installSoundResolver(engine);

    const controller = new BgmCrossfadeController({
        getSound: (id) => engine.getSound(id),
        addSound: (sound, id) => engine.addSound(sound, id),
    });
    let audioUnlocked = false;
    let pendingMapId: string | null = null;

    const playMapBgm = (mapId: string): void => {
        pendingMapId = mapId;
        if (!audioUnlocked) return;
        void playAmbientTrack(controller, mapId);
    };

    const unlockAudio = (): void => {
        if (audioUnlocked) return;
        audioUnlocked = true;
        if (pendingMapId) {
            void playAmbientTrack(controller, pendingMapId);
        }
    };

    window.addEventListener("pointerup", unlockAudio, { once: true, capture: true });
    window.addEventListener("keydown", unlockAudio, { once: true, capture: true });

    effect(() => {
        const mapData = (engine.scene.data?.() ?? null) as MapDataLike | null;
        if (typeof mapData?.id === "string") {
            playMapBgm(mapData.id);
        }
    });

    installFootstepRuntime(engine);

    engine.socket.on(AUDIO_BGM_OVERRIDE_EVENT, (payload: unknown) => {
        if (!isBgmOverridePayload(payload)) return;
        audioUnlocked = true;
        const userVol = typeof payload.userVol === "number" ? payload.userVol : undefined;
        void playOverrideTrack(controller, payload.mapId, payload.inCombat, userVol);
    });
}

function installFootstepRuntime(engine: RpgClientEngine): void {
    let lastStepKey: string | null = null;
    let lastStepAt = 0;

    effect(() => {
        const player = getCurrentPlayer(engine);
        const mapData = (engine.scene.data?.() ?? null) as MapDataLike | null;
        if (!player || !mapData?.id) {
            lastStepKey = null;
            return;
        }

        const x = readSignalNumber(player.x);
        const y = readSignalNumber(player.y);
        if (x == null || y == null) return;

        const tileSize = Math.max(
            16,
            Number(mapData.tiled?.tilewidth ?? 16),
            Number(mapData.tiled?.tileheight ?? 16),
        );
        const stepKey = `${mapData.id}:${Math.floor(x / tileSize)}:${Math.floor(y / tileSize)}`;
        if (lastStepKey == null) {
            lastStepKey = stepKey;
            return;
        }
        if (stepKey === lastStepKey) return;

        lastStepKey = stepKey;
        const now = performance.now();
        if (now - lastStepAt < AUDIO_RUNTIME_CONFIG.footstepMinIntervalMs) return;
        lastStepAt = now;
        void playClientSfx(engine, "sfx_footstep");
    });
}

function getCurrentPlayer(engine: RpgClientEngine): ClientPlayerLike | null {
    const fromMethod = (
        engine as unknown as { getCurrentPlayer?: () => unknown }
    ).getCurrentPlayer?.();
    if (fromMethod) return fromMethod as ClientPlayerLike;
    return (engine.scene.currentPlayer?.() ?? null) as ClientPlayerLike | null;
}

function readSignalNumber(signal: (() => unknown) | undefined): number | null {
    if (typeof signal !== "function") return null;
    const value = Number(signal());
    return Number.isFinite(value) ? value : null;
}

function installSoundResolver(engine: RpgClientEngine): void {
    const base = import.meta.env.BASE_URL || "/";
    engine.setSoundResolver((id: string) => {
        if (isBgmId(id)) {
            return {
                id,
                src: publicAssetPath(bgmFile(id), base),
                loop: true,
            };
        }
        if (isSfxEvent(id)) {
            return {
                id,
                src: publicAssetPath(sfxFile(id), base),
                loop: false,
            };
        }
        return undefined;
    });
}

async function playAmbientTrack(controller: BgmCrossfadeController, mapId: string): Promise<void> {
    await controller.playContext({ mapId, inCombat: false }, await getBgmVolume());
}

async function playOverrideTrack(
    controller: BgmCrossfadeController,
    mapId: string,
    inCombat: boolean,
    userVol: number | undefined,
): Promise<void> {
    const targetUserVol = userVol ?? (await getBgmVolume());
    await controller.playContext({ mapId, inCombat }, targetUserVol);
}
