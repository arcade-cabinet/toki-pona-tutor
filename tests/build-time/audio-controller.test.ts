import { describe, expect, it } from "vitest";
import {
    BGM_CROSSFADE_MS,
    BGM_STOP_DELAY_PADDING_MS,
    BgmCrossfadeController,
    getPlayableSound,
    publicAssetPath,
    type HowlLike,
} from "../../src/config/audio-controller";
import type { BgmId } from "../../src/modules/main/audio";

class FakeHowl implements HowlLike {
    readonly calls: string[] = [];
    private currentVolume = 1;

    constructor(readonly id: string) {}

    play() {
        this.calls.push("play");
        return `${this.id}:play`;
    }

    stop(id?: number | string) {
        this.calls.push(`stop:${id ?? "all"}`);
    }

    volume(volume?: number, id?: number | string) {
        if (typeof volume === "number") {
            this.currentVolume = volume;
            this.calls.push(`volume:${volume}:${id ?? "all"}`);
            return undefined;
        }
        return this.currentVolume;
    }

    loop(loop?: boolean) {
        this.calls.push(`loop:${String(loop)}`);
        return loop ?? false;
    }

    fade(from: number, to: number, duration: number, id?: number | string) {
        this.currentVolume = to;
        this.calls.push(`fade:${from}:${to}:${duration}:${id ?? "all"}`);
    }
}

function makeController() {
    const scheduled: Array<{ delayMs: number; callback: () => void }> = [];
    const sounds = new Map<BgmId, FakeHowl>([
        ["bgm_village", new FakeHowl("bgm_village")],
        ["bgm_forest", new FakeHowl("bgm_forest")],
        ["bgm_gym", new FakeHowl("bgm_gym")],
    ]);
    const controller = new BgmCrossfadeController(
        { getSound: (id) => sounds.get(id as BgmId) },
        (callback, delayMs) => scheduled.push({ callback, delayMs }),
    );
    return { controller, sounds, scheduled };
}

function deferredSound() {
    let resolve!: (sound: FakeHowl | undefined) => void;
    const promise = new Promise<FakeHowl | undefined>((resolver) => {
        resolve = resolver;
    });
    return { promise, resolve };
}

describe("publicAssetPath", () => {
    it("preserves local dev root base", () => {
        expect(publicAssetPath("/rpg/audio/bgm-village.ogg", "/")).toBe(
            "/rpg/audio/bgm-village.ogg",
        );
    });

    it("prefixes GitHub Pages project base", () => {
        expect(publicAssetPath("/rpg/audio/bgm-village.ogg", "/poki-soweli/")).toBe(
            "/poki-soweli/rpg/audio/bgm-village.ogg",
        );
    });

    it("keeps Capacitor relative base", () => {
        expect(publicAssetPath("/rpg/audio/bgm-village.ogg", "./")).toBe(
            "./rpg/audio/bgm-village.ogg",
        );
    });
});

describe("getPlayableSound", () => {
    it("returns already-playable sounds unchanged", async () => {
        const sound = new FakeHowl("bgm_village");

        await expect(getPlayableSound({ getSound: () => sound }, "bgm_village")).resolves.toBe(
            sound,
        );
    });

    it("registers raw resolver definitions through the backend addSound hook", async () => {
        const registered = new FakeHowl("bgm_village");
        const definition = { id: "bgm_village", src: "/rpg/audio/bgm-village.ogg", loop: true };

        await expect(
            getPlayableSound(
                {
                    getSound: () => definition,
                    addSound: (sound, id) => {
                        expect(sound).toBe(definition);
                        expect(id).toBe("bgm_village");
                        return registered;
                    },
                },
                "bgm_village",
            ),
        ).resolves.toBe(registered);
    });

    it("ignores raw resolver definitions when the backend cannot register them", async () => {
        await expect(
            getPlayableSound(
                {
                    getSound: () => ({ id: "bgm_village", src: "/rpg/audio/bgm-village.ogg" }),
                },
                "bgm_village",
            ),
        ).resolves.toBeUndefined();
    });
});

describe("BgmCrossfadeController", () => {
    it("starts the ambient map track at the user volume", async () => {
        const { controller, sounds } = makeController();

        await controller.playContext({ mapId: "ma_tomo_lili", inCombat: false }, 70);

        expect(controller.currentTrack).toBe("bgm_village");
        expect(sounds.get("bgm_village")!.calls).toEqual([
            "loop:true",
            "volume:0:all",
            "play",
            `fade:0:0.7:${BGM_CROSSFADE_MS}:bgm_village:play`,
        ]);
    });

    it("cross-fades and stops the previous track after the fade window", async () => {
        const { controller, sounds, scheduled } = makeController();

        await controller.playContext({ mapId: "ma_tomo_lili", inCombat: false }, 70);
        await controller.playContext({ mapId: "nasin_wan", inCombat: false }, 60);

        expect(controller.currentTrack).toBe("bgm_forest");
        expect(sounds.get("bgm_forest")!.calls).toContain(
            `fade:0:0.6:${BGM_CROSSFADE_MS}:bgm_forest:play`,
        );
        expect(sounds.get("bgm_village")!.calls).toContain(
            `fade:0.7:0:${BGM_CROSSFADE_MS}:bgm_village:play`,
        );
        expect(scheduled).toHaveLength(1);
        expect(scheduled[0].delayMs).toBe(BGM_CROSSFADE_MS + BGM_STOP_DELAY_PADDING_MS);

        scheduled[0].callback();
        expect(sounds.get("bgm_village")!.calls).toContain("stop:bgm_village:play");
    });

    it("switches to combat override without requiring a map transition", async () => {
        const { controller } = makeController();

        await controller.playContext({ mapId: "ma_tomo_lili", inCombat: false }, 70);
        await controller.playContext({ mapId: "ma_tomo_lili", inCombat: true }, 70);

        expect(controller.currentTrack).toBe("bgm_gym");
    });

    it("does not replay when only the volume changes on the same track", async () => {
        const { controller, sounds } = makeController();

        await controller.playContext({ mapId: "ma_tomo_lili", inCombat: false }, 70);
        await controller.playContext({ mapId: "ma_tomo_lili", inCombat: false }, 30);

        const villageCalls = sounds.get("bgm_village")!.calls;
        expect(villageCalls.filter((call) => call === "play")).toHaveLength(1);
        expect(villageCalls).toContain("volume:0.3:bgm_village:play");
    });

    it("does not let stale fade timers stop a reactivated track", async () => {
        const { controller, sounds, scheduled } = makeController();

        await controller.playContext({ mapId: "ma_tomo_lili", inCombat: false }, 70);
        await controller.playContext({ mapId: "nasin_wan", inCombat: false }, 60);
        await controller.playContext({ mapId: "ma_tomo_lili", inCombat: false }, 70);

        scheduled[0].callback();

        expect(controller.currentTrack).toBe("bgm_village");
        expect(sounds.get("bgm_village")!.calls).not.toContain("stop:bgm_village:play");
    });

    it("ignores stale async track loads after a newer request wins", async () => {
        const forest = deferredSound();
        const gym = deferredSound();
        const sounds = {
            bgm_forest: new FakeHowl("bgm_forest"),
            bgm_gym: new FakeHowl("bgm_gym"),
        };
        const controller = new BgmCrossfadeController({
            getSound: (id) => (id === "bgm_forest" ? forest.promise : gym.promise),
        });

        const pendingForest = controller.playTrack("bgm_forest", 0.6);
        const pendingGym = controller.playTrack("bgm_gym", 0.7);
        gym.resolve(sounds.bgm_gym);
        await pendingGym;
        forest.resolve(sounds.bgm_forest);
        await pendingForest;

        expect(controller.currentTrack).toBe("bgm_gym");
        expect(sounds.bgm_gym.calls).toContain("play");
        expect(sounds.bgm_forest.calls).toEqual([]);
    });

    it("cancels a pending async load when stopped", async () => {
        const pending = deferredSound();
        const sound = new FakeHowl("bgm_forest");
        const controller = new BgmCrossfadeController({
            getSound: () => pending.promise,
        });

        const play = controller.playTrack("bgm_forest", 0.6);
        controller.stop();
        pending.resolve(sound);
        await play;

        expect(controller.currentTrack).toBeNull();
        expect(sound.calls).toEqual([]);
    });
});
