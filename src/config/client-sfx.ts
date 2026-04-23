import { effectiveSfxVolume, type SfxEvent } from "../modules/main/sfx";
import { getSfxVolume } from "../platform/persistence/settings";

export type ClientSoundEngine = {
    playSound(soundId: string, options?: { volume?: number; loop?: boolean }): void | Promise<void>;
};

export type SfxVolumeReader = () => number | Promise<number>;

export async function playClientSfx(
    engine: ClientSoundEngine,
    event: SfxEvent,
    readVolume: SfxVolumeReader = getSfxVolume,
): Promise<void> {
    try {
        await engine.playSound(event, {
            volume: effectiveSfxVolume(event, await readVolume()),
            loop: false,
        });
    } catch {
        // SFX is non-critical feedback; gameplay should never block on it.
    }
}
