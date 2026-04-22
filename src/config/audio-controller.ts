import { bgmForContext, effectiveVolume, type BgmId, type MapContext } from "../modules/main/audio";
import { AUDIO_RUNTIME_CONFIG } from "../content/gameplay";
export { publicAssetPath } from "./asset-paths";

export type HowlLike = {
    play: () => number | string | void;
    stop: (id?: number | string) => void;
    volume: (volume?: number, id?: number | string) => number | void;
    loop: (loop?: boolean, id?: number | string) => boolean | void;
    fade?: (from: number, to: number, duration: number, id?: number | string) => void;
};

export type AudioBackend = {
    getSound: (id: string) => unknown | Promise<unknown>;
    addSound?: (sound: unknown, id?: string) => unknown;
};

export type StopScheduler = (callback: () => void, delayMs: number) => unknown;

type ActiveBgm = {
    id: BgmId;
    sound: HowlLike;
    playId?: number | string | void;
};

export const BGM_CROSSFADE_MS = AUDIO_RUNTIME_CONFIG.bgmCrossfadeMs;
export const BGM_STOP_DELAY_PADDING_MS = AUDIO_RUNTIME_CONFIG.bgmStopDelayPaddingMs;

export async function getPlayableSound(
    backend: AudioBackend,
    id: string,
): Promise<HowlLike | undefined> {
    const sound = await backend.getSound(id);
    if (isHowlLike(sound)) return sound;
    if (isSoundDefinition(sound) && typeof backend.addSound === "function") {
        const registered = backend.addSound(sound, id);
        return isHowlLike(registered) ? registered : undefined;
    }
    return undefined;
}

export class BgmCrossfadeController {
    private active: ActiveBgm | null = null;

    constructor(
        private readonly backend: AudioBackend,
        private readonly scheduleStop: StopScheduler = (callback, delayMs) =>
            setTimeout(callback, delayMs),
    ) {}

    get currentTrack(): BgmId | null {
        return this.active?.id ?? null;
    }

    async playContext(ctx: MapContext, userVol: number): Promise<void> {
        await this.playTrack(bgmForContext(ctx), effectiveVolume({ userVol }));
    }

    async playTrack(nextId: BgmId, targetVolume: number): Promise<void> {
        const volume = Math.max(0, Math.min(1, targetVolume));
        if (this.active?.id === nextId) {
            this.active.sound.volume(volume, this.active.playId as number | string | undefined);
            return;
        }

        const nextSound = await getPlayableSound(this.backend, nextId);
        if (!nextSound) return;

        const previous = this.active;
        const playId = startAtVolume(nextSound, 0);
        this.active = { id: nextId, sound: nextSound, playId };
        fade(nextSound, 0, volume, BGM_CROSSFADE_MS, playId);

        if (previous) {
            const previousVolume = readVolume(previous.sound, previous.playId);
            fade(previous.sound, previousVolume, 0, BGM_CROSSFADE_MS, previous.playId);
            this.scheduleStop(() => {
                if (this.active?.sound === previous.sound) return;
                previous.sound.stop(previous.playId as number | string | undefined);
            }, BGM_CROSSFADE_MS + BGM_STOP_DELAY_PADDING_MS);
        }
    }

    stop(): void {
        if (!this.active) return;
        this.active.sound.stop(this.active.playId as number | string | undefined);
        this.active = null;
    }
}

function isHowlLike(value: unknown): value is HowlLike {
    if (!value || typeof value !== "object") return false;
    const sound = value as Partial<HowlLike>;
    return (
        typeof sound.play === "function" &&
        typeof sound.stop === "function" &&
        typeof sound.volume === "function" &&
        typeof sound.loop === "function"
    );
}

function isSoundDefinition(value: unknown): value is { src: string } {
    return (
        !!value && typeof value === "object" && typeof (value as { src?: unknown }).src === "string"
    );
}

function startAtVolume(sound: HowlLike, volume: number): number | string | void {
    sound.loop(true);
    sound.volume(volume);
    return sound.play();
}

function readVolume(sound: HowlLike, id: number | string | void): number {
    const value = sound.volume(undefined, id as number | string | undefined);
    return typeof value === "number" && Number.isFinite(value) ? value : 1;
}

function fade(
    sound: HowlLike,
    from: number,
    to: number,
    duration: number,
    id: number | string | void,
): void {
    if (typeof sound.fade === "function") {
        sound.fade(from, to, duration, id as number | string | undefined);
        return;
    }
    sound.volume(to, id as number | string | undefined);
}
