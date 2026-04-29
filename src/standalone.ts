import "@rpgjs/ui-css/reset.css";
import "./styles/fonts.css";
import "./styles/brand.css";
import "./ui/styles/rr-tokens.css";
import "./ui/styles/rr-effects.css";
import "./ui/styles/rr-ui.css";

import { mergeConfig } from "@signe/di";
import { provideRpg, startGame, inject, RpgClientEngine } from "@rpgjs/client";
import serverConfig from "./server";
import {
    installCanvasSpriteDeferredAssetCleanupPatch,
    installCanvasSpriteHitboxAnchorPatch,
    installCanvasViewportMaskPatch,
} from "./config/canvasengine-patches";
import configClient from "./config/config.client";
import { installPixiFxAliasGuard } from "./config/pixi-assets";
import { applyBrandBoot } from "./styles/boot";
import { DIALOG_UI_CONFIG } from "./content/gameplay";
import { mountRiversUi } from "./ui/mount";

// Apply brand prefs (high-contrast, etc.) before first render so the
// initial paint matches the user's stored settings. Fire-and-forget;
// applyBrandBoot guards against missing DOM (SSR / tests).
void applyBrandBoot();
mountRiversUi();
installCanvasViewportMaskPatch();
installCanvasSpriteDeferredAssetCleanupPatch();
installCanvasSpriteHitboxAnchorPatch();
installPixiFxAliasGuard();

startGame(
    mergeConfig(configClient, {
        providers: [provideRpg(serverConfig)],
    }),
);

// Desktop shortcut hardening: after pointer interactions, browser focus can
// drift off the game surface and the built-in character controls may never see
// `Escape`. Route that specific key back into the engine when no dialog/menu is
// already open so pause remains reachable without requiring an extra focus click.
installEscapeShortcutFallback();

function installEscapeShortcutFallback(): void {
    const MAX_ATTEMPTS = 200;
    let attempts = 0;
    let installed = false;

    const tryInstall = (): void => {
        if (installed) return;
        attempts += 1;

        try {
            const engine = inject(RpgClientEngine);
            if (!engine) {
                throw new Error("engine unavailable");
            }

            window.addEventListener("keydown", (event) => {
                if (event.key !== "Escape" || event.repeat) return;
                if (document.querySelector(".rr-dialog")) return;

                const active = document.activeElement;
                if (
                    active instanceof HTMLInputElement ||
                    active instanceof HTMLTextAreaElement ||
                    active instanceof HTMLSelectElement ||
                    active?.getAttribute("contenteditable") === "true"
                ) {
                    return;
                }
                if (active instanceof Element && active.closest("#rpg")) {
                    return;
                }

                engine.processAction({ action: "escape" as never });
            });

            installed = true;
        } catch {
            if (attempts < MAX_ATTEMPTS) {
                setTimeout(tryInstall, 50);
            }
        }
    };

    queueMicrotask(tryInstall);
}

// Dev/test debug surface. Mirrors the stellar-descent pattern:
// E2E tests probe `window.__POKI__` via `page.evaluate` to read
// player + canvas state. Gated on import.meta.env so the production
// bundle tree-shakes the hook out. Typed in src/types/poki-debug.d.ts.
//
// Install the object IMMEDIATELY with ready:false so E2E tests can
// always observe the shape (and get a clear "ready=false" signal if
// boot never completes) rather than timing out waiting for
// `window.__POKI__` to exist at all. Engine injection happens
// asynchronously via a retry loop that backs off until DI is ready;
// once the engine resolves we swap the placeholder for the live
// accessors.
if (import.meta.env.DEV || import.meta.env.MODE === "test") {
    type CanvasOrNull = HTMLCanvasElement | null;
    type DebugPosition = {
        x: number | null;
        y: number | null;
    };
    type DebugPartyMember = {
        slot: number;
        speciesId: string;
        level: number;
        xp: number;
    };
    type DebugEncounterLog = {
        speciesId: string;
        mapId: string;
        outcome: string;
    };
    type DebugTaskStatus = {
        done: boolean;
        error: string | null;
    };
    type DebugCombatState = {
        eventHp: number | null;
        eventPosition: DebugPosition;
        playerHp: number | null;
        playerSp: number | null;
        playerPosition: DebugPosition;
    };
    type DebugState = {
        playerId: string | null;
        serverPlayerId: string | null;
        currentMapId: string | null;
        worldSeed: string | null;
        starterChosen: string | null;
        serverGraphic: string | null;
        position: DebugPosition;
        serverMapId: string | null;
        serverPosition: DebugPosition;
        saves: Array<Record<string, unknown> | null>;
    };
    type MapPosition = {
        x: number;
        y: number;
        z?: number;
    };
    type CreateManualSaveOptions = {
        slot?: number;
        mapId?: string;
        position?: MapPosition;
        preferences?: Record<string, string>;
    };
    type ShapeTriggerOptions = {
        randomValues?: number[];
    };
    type ShapeTriggerTarget =
        | string
        | {
              name: string;
              properties?: Record<string, unknown>;
          };
    type ServerEventLike = {
        execMethod?: (name: string, args?: unknown[]) => Promise<unknown>;
        battleAi?: {
            onDefeatedCallback?: (
                event: unknown,
                attacker?: ServerPlayerLike,
            ) => Promise<void> | void;
        };
        hp?: number;
        param?: Record<string | number, number>;
        remove?: () => void;
        x?: () => number;
        y?: () => number;
    };
    type ServerMapLike = {
        id?: string;
        getEvent?: (id: string) => ServerEventLike | undefined;
        getShape?: (id: string) => unknown;
    };
    type ServerPlayerLike = {
        id?: string;
        conn?: { id?: string };
        changeMap?: (mapId: string, position?: MapPosition | string) => Promise<unknown>;
        execMethod?: (name: string, args?: unknown[]) => Promise<unknown>;
        getCurrentMap?: () => ServerMapLike | null;
        hp?: number;
        param?: Record<string, unknown>;
        sp?: number;
        graphics?: () => unknown;
        showText?: (text: string) => Promise<unknown>;
        teleport?: (position: MapPosition) => Promise<unknown>;
        x?: () => number;
        y?: () => number;
    };
    type StandaloneServerLike = {
        subRoom?: {
            players?: () => Record<string, ServerPlayerLike>;
        };
    };

    const canvasEl = (): CanvasOrNull => document.querySelector<HTMLCanvasElement>("#rpg canvas");
    const debugTasks = new Map<string, DebugTaskStatus>();
    const blankState = (): DebugState => ({
        playerId: null,
        serverPlayerId: null,
        currentMapId: null,
        worldSeed: null,
        starterChosen: null,
        serverGraphic: null,
        position: { x: null, y: null },
        serverMapId: null,
        serverPosition: { x: null, y: null },
        saves: [],
    });
    const getServer = (engine: RpgClientEngine | null): StandaloneServerLike | null => {
        if (!engine) return null;
        const socket = engine.socket as { getServer?: () => StandaloneServerLike | null };
        return socket.getServer?.() ?? null;
    };
    const getServerPlayer = (engine: RpgClientEngine | null): ServerPlayerLike | null => {
        const playerId = engine?.playerIdSignal?.() ?? null;
        const currentPlayerId =
            (engine?.getCurrentPlayer?.() as { id?: string } | null | undefined)?.id ?? null;
        const players = getServer(engine)?.subRoom?.players?.();
        if (!players || typeof players !== "object") return null;
        if (playerId && players[playerId]) {
            return players[playerId] ?? null;
        }
        if (currentPlayerId && players[currentPlayerId]) {
            return players[currentPlayerId] ?? null;
        }

        const allPlayers = Object.values(players);
        const stableConnectionPlayers = allPlayers.filter(
            (player) => player?.conn?.id === "player-client-id",
        );
        if (stableConnectionPlayers.length === 1) return stableConnectionPlayers[0] ?? null;
        return allPlayers.length === 1 ? (allPlayers[0] ?? null) : null;
    };
    const getServerMap = (engine: RpgClientEngine | null): ServerMapLike | null =>
        getServerPlayer(engine)?.getCurrentMap?.() ?? null;
    const requireServerPlayer = (): ServerPlayerLike => {
        const player = getServerPlayer(window.__POKI__?.engine ?? null);
        if (!player) {
            throw new Error("window.__POKI__.testing: server player unavailable");
        }
        return player;
    };
    const requireServerMap = (): ServerMapLike => {
        const map = getServerMap(window.__POKI__?.engine ?? null);
        if (!map) {
            throw new Error("window.__POKI__.testing: current map unavailable");
        }
        return map;
    };
    const stripSnapshots = (raw: string): Array<Record<string, unknown> | null> => {
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.map((slot) => {
                if (!slot || typeof slot !== "object") return null;
                const { snapshot, ...meta } = slot as Record<string, unknown>;
                if (typeof snapshot !== "string") {
                    return meta;
                }
                try {
                    const parsedSnapshot = JSON.parse(snapshot) as {
                        x?: unknown;
                        y?: unknown;
                        z?: unknown;
                    };
                    if (
                        typeof parsedSnapshot.x !== "number" ||
                        typeof parsedSnapshot.y !== "number"
                    ) {
                        return meta;
                    }
                    return {
                        ...meta,
                        position: {
                            x: parsedSnapshot.x,
                            y: parsedSnapshot.y,
                            ...(typeof parsedSnapshot.z === "number"
                                ? { z: parsedSnapshot.z }
                                : {}),
                        },
                    };
                } catch {
                    return meta;
                }
            });
        } catch {
            return [];
        }
    };
    const resetPersistence = async (options: { includeSaves?: boolean } = {}): Promise<void> => {
        const { resetPersistedRuntimeState } = await import("./platform/persistence/runtime-state");
        await resetPersistedRuntimeState(options);
    };
    const withRandomSequence = async <T>(
        values: number[] | undefined,
        run: () => Promise<T>,
    ): Promise<T> => {
        if (!values?.length) {
            return run();
        }

        const originalRandom = Math.random;
        let index = 0;
        Math.random = () => {
            if (index >= values.length) {
                throw new Error(
                    `window.__POKI__.testing: Math.random exhausted after ${values.length} calls`,
                );
            }
            const next = values[index];
            index += 1;
            return next ?? 0;
        };

        try {
            return await run();
        } finally {
            Math.random = originalRandom;
        }
    };
    const readState = async (): Promise<DebugState> => {
        const engine = window.__POKI__?.engine ?? null;
        const currentPlayer = engine?.getCurrentPlayer?.() ?? null;
        const serverPlayer = getServerPlayer(engine);
        const playerId = engine?.playerIdSignal?.() ?? null;
        const [{ preferences, KEYS }, { getDatabase }] = await Promise.all([
            import("./platform/persistence/preferences"),
            import("./platform/persistence/database"),
        ]);

        let saves: Array<Record<string, unknown> | null> = [];
        const storageKey = getServerPlayer(engine)?.conn?.id ?? playerId;
        if (storageKey) {
            const db = await getDatabase();
            const result = await db.query("SELECT data FROM saves WHERE player_key = ? LIMIT 1", [
                `default:${storageKey}`,
            ]);
            const raw = result.values?.[0]?.data;
            if (typeof raw === "string") {
                saves = stripSnapshots(raw);
            }
        }

        return {
            playerId,
            serverPlayerId: serverPlayer?.id ?? null,
            currentMapId: await preferences.get(KEYS.currentMapId),
            worldSeed: await preferences.get(KEYS.worldSeed),
            starterChosen: await preferences.get(KEYS.starterChosen),
            serverGraphic: readServerGraphic(serverPlayer),
            position: {
                x: currentPlayer?.x?.() ?? null,
                y: currentPlayer?.y?.() ?? null,
            },
            serverMapId: serverPlayer?.getCurrentMap?.()?.id ?? null,
            serverPosition: {
                x: serverPlayer?.x?.() ?? null,
                y: serverPlayer?.y?.() ?? null,
            },
            saves,
        };
    };
    const readParty = async (): Promise<DebugPartyMember[]> => {
        const { getParty } = await import("./platform/persistence/queries");
        const party = await getParty();
        return party.map((member) => ({
            slot: member.slot,
            speciesId: member.species_id,
            level: member.level,
            xp: member.xp,
        }));
    };
    const readServerGraphic = (player: ServerPlayerLike | null): string | null => {
        const graphics = player?.graphics?.();
        if (Array.isArray(graphics)) {
            return (
                graphics.find((graphic): graphic is string => typeof graphic === "string") ?? null
            );
        }
        return typeof graphics === "string" ? graphics : null;
    };
    const readFlag = async (flagId: string): Promise<string | null> => {
        const { getFlag } = await import("./platform/persistence/queries");
        return getFlag(flagId);
    };
    const readInventoryCount = async (itemId: string): Promise<number> => {
        const { getInventoryCount } = await import("./platform/persistence/queries");
        return getInventoryCount(itemId);
    };
    const addInventoryItem = async (itemId: string, count: number): Promise<void> => {
        const { addToInventory } = await import("./platform/persistence/queries");
        await addToInventory(itemId, count);
    };
    const writeInventoryItemCount = async (itemId: string, count: number): Promise<void> => {
        const { setInventoryCount } = await import("./platform/persistence/queries");
        await setInventoryCount(itemId, count);
    };
    const writeClue = async (clueId: string): Promise<void> => {
        const { recordClue } = await import("./platform/persistence/queries");
        await recordClue(clueId);
    };
    const writePartyCurrentHp = async (slot: number, hp: number): Promise<void> => {
        const { setPartyCurrentHp } = await import("./platform/persistence/queries");
        const updated = await setPartyCurrentHp(slot, hp);
        if (!updated) {
            throw new Error(`window.__POKI__.testing: party slot ${slot} unavailable`);
        }
    };
    const writeLeadHp = async (hp: number): Promise<void> => {
        const player = requireServerPlayer();
        const nextHp = Math.max(0, Math.round(hp));
        player.param ??= {};
        player.param.maxHp = Math.max(Number(player.param.maxHp ?? 0), nextHp);
        player.hp = nextHp;
        await writePartyCurrentHp(0, nextHp);
    };
    const writeEventHp = async (eventId: string, hp: number): Promise<void> => {
        const event = requireServerMap().getEvent?.(eventId);
        if (!event) {
            throw new Error(`window.__POKI__.testing: event ${eventId} unavailable on current map`);
        }
        const nextHp = Math.max(0, Math.round(hp));
        event.param ??= {};
        event.param.maxHp = Math.max(Number(event.param.maxHp ?? 0), nextHp);
        event.hp = nextHp;
    };
    const moveServerPlayer = async (position: MapPosition, mapId?: string): Promise<void> => {
        const player = requireServerPlayer();
        const currentMapId = player.getCurrentMap?.()?.id ?? null;
        if (mapId && currentMapId !== mapId) {
            if (typeof player.changeMap !== "function") {
                throw new Error(`window.__POKI__.testing: cannot move player to map ${mapId}`);
            }
            await player.changeMap(mapId, position);
            return;
        }
        if (typeof player.teleport === "function") {
            await player.teleport(position);
            return;
        }
        if (typeof player.changeMap === "function" && currentMapId) {
            await player.changeMap(currentMapId, position);
            return;
        }
        throw new Error("window.__POKI__.testing: player movement unavailable");
    };
    const readCombatState = async (eventId: string): Promise<DebugCombatState> => {
        const player = requireServerPlayer();
        const event = requireServerMap().getEvent?.(eventId);
        if (!event) {
            throw new Error(`window.__POKI__.testing: event ${eventId} unavailable on current map`);
        }
        return {
            eventHp: typeof event.hp === "number" ? event.hp : null,
            eventPosition: {
                x: event.x?.() ?? null,
                y: event.y?.() ?? null,
            },
            playerHp: typeof player.hp === "number" ? player.hp : null,
            playerSp: typeof player.sp === "number" ? player.sp : null,
            playerPosition: {
                x: player.x?.() ?? null,
                y: player.y?.() ?? null,
            },
        };
    };
    const defeatPlayer = async (): Promise<void> => {
        const player = requireServerPlayer();
        player.hp = 0;
        await writePartyCurrentHp(0, 0);
        if (typeof player.execMethod !== "function") {
            throw new Error("window.__POKI__.testing: player onDead unavailable");
        }
        await player.execMethod("onDead");
    };
    const readLatestEncounter = async (): Promise<DebugEncounterLog | null> => {
        const { getDatabase } = await import("./platform/persistence/database");
        const db = await getDatabase();
        const result = await db.query(
            "SELECT species_id, map_id, outcome FROM encounter_log ORDER BY id DESC LIMIT 1",
        );
        const row = result.values?.[0];
        if (!row) return null;
        return {
            speciesId: String(row.species_id),
            mapId: String(row.map_id),
            outcome: String(row.outcome),
        };
    };
    const triggerEvent = async (
        eventId: string,
        trigger: "action" | "touch" = "action",
    ): Promise<void> => {
        const player = requireServerPlayer();
        const event = requireServerMap().getEvent?.(eventId);
        if (!event?.execMethod) {
            throw new Error(`window.__POKI__.testing: event ${eventId} unavailable on current map`);
        }
        const hookName = trigger === "touch" ? "onPlayerTouch" : "onAction";
        await event.execMethod(hookName, [player]);
    };
    const triggerShape = async (
        target: ShapeTriggerTarget,
        options: ShapeTriggerOptions = {},
    ): Promise<void> => {
        const player = requireServerPlayer();
        const shape = typeof target === "string" ? requireServerMap().getShape?.(target) : target;
        if (!shape || typeof player.execMethod !== "function") {
            const label = typeof target === "string" ? target : target.name;
            throw new Error(`window.__POKI__.testing: shape ${label} unavailable on current map`);
        }
        await withRandomSequence(options.randomValues, async () => {
            await player.execMethod?.("onInShape", [shape]);
        });
    };
    const defeatEvent = async (eventId: string): Promise<void> => {
        const player = requireServerPlayer();
        const event = requireServerMap().getEvent?.(eventId);
        const onDefeated = event?.battleAi?.onDefeatedCallback;
        if (!event || typeof onDefeated !== "function") {
            throw new Error(`window.__POKI__.testing: event ${eventId} has no defeat callback`);
        }
        await onDefeated(event, player);
        event.hp = 0;
        event.remove?.();
    };
    const beginTask = (run: () => Promise<void>): string => {
        const taskId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
        const status: DebugTaskStatus = { done: false, error: null };
        debugTasks.set(taskId, status);
        void run()
            .then(() => {
                status.done = true;
            })
            .catch((error) => {
                status.done = true;
                status.error = error instanceof Error ? error.message : String(error);
            });
        return taskId;
    };
    const beginEvent = (eventId: string, trigger: "action" | "touch" = "action"): string =>
        beginTask(() => triggerEvent(eventId, trigger));
    const beginShape = (target: ShapeTriggerTarget, options: ShapeTriggerOptions = {}): string =>
        beginTask(() => triggerShape(target, options));
    const beginDefeatEvent = (eventId: string): string => beginTask(() => defeatEvent(eventId));
    const beginPlayerDefeat = (): string => beginTask(defeatPlayer);
    const beginText = (text: string): string =>
        beginTask(async () => {
            const player = requireServerPlayer();
            if (!player.showText) {
                throw new Error("window.__POKI__.testing: server player cannot show text");
            }
            await player.showText(text);
        });
    const readTask = async (taskId: string): Promise<DebugTaskStatus | null> => {
        const status = debugTasks.get(taskId);
        if (!status) return null;
        return { ...status };
    };
    const closeGui = async (guiId = DIALOG_UI_CONFIG.guiId, data?: unknown): Promise<void> => {
        const engine = window.__POKI__?.engine ?? null;
        const guiService = (
            engine as unknown as {
                guiService?: {
                    guiClose?: (id: string, value?: unknown) => void;
                };
            }
        )?.guiService;
        if (!guiService?.guiClose) {
            throw new Error(`window.__POKI__.testing: gui service unavailable for ${guiId}`);
        }
        guiService.guiClose(guiId, data);
    };
    const processAction = async (
        action: "action" | "escape" | "up" | "down" | "left" | "right",
    ): Promise<void> => {
        const engine = window.__POKI__?.engine ?? null;
        if (!engine) {
            throw new Error("window.__POKI__.testing: client engine unavailable");
        }
        if (action === "up" || action === "down" || action === "left" || action === "right") {
            await engine.processInput({ input: action as never });
            return;
        }
        engine.processAction({ action: action as never });
    };
    const worldToCanvas = async (x: number, y: number): Promise<{ x: number; y: number }> => {
        const engine = window.__POKI__?.engine ?? null;
        const canvas = canvasEl();
        const viewport = (
            engine as unknown as {
                canvasElement?: {
                    props?: {
                        context?: {
                            viewport?: {
                                toScreen(x: number, y: number): { x: number; y: number };
                            };
                        };
                    };
                };
            }
        )?.canvasElement?.props?.context?.viewport;
        if (!engine || !canvas || !viewport) {
            throw new Error("window.__POKI__.testing: viewport unavailable");
        }
        return viewport.toScreen(x, y);
    };
    const notReady = async <T>(): Promise<T> => {
        throw new Error("window.__POKI__.testing: debug surface not ready");
    };
    // Placeholder — exists the instant the module evaluates so tests
    // can always see a consistent shape, even pre-engine-boot.
    window.__POKI__ = {
        engine: null,
        get player() {
            return null;
        },
        get playerId() {
            return null;
        },
        get canvas() {
            return canvasEl();
        },
        get ready() {
            return false;
        },
        testing: {
            resetPersistence,
            async getState() {
                return blankState();
            },
            triggerEvent: notReady,
            triggerShape: notReady,
            defeatEvent: notReady,
            defeatPlayer: notReady,
            beginEvent: async () => "",
            beginShape: async () => "",
            beginDefeatEvent: async () => "",
            beginPlayerDefeat: async () => "",
            beginText: async () => "",
            getTaskStatus: async () => null,
            closeGui: notReady,
            processAction: notReady,
            worldToCanvas: notReady,
            getParty: async () => [],
            getFlag: async () => null,
            getInventoryCount: async () => 0,
            addInventoryItem: notReady,
            setInventoryItemCount: notReady,
            recordClue: notReady,
            recordMasteredWord: notReady,
            setLeadHp: notReady,
            setEventHp: notReady,
            setPartyCurrentHp: notReady,
            moveServerPlayer: notReady,
            getCombatState: notReady,
            getLatestEncounter: async () => null,
        },
    };

    const MAX_ATTEMPTS = 200; // 200 × 50ms = 10s hard ceiling
    let attempts = 0;
    const tryInstall = (): void => {
        attempts++;
        try {
            const engine = inject(RpgClientEngine);
            if (!engine) {
                if (attempts < MAX_ATTEMPTS) setTimeout(tryInstall, 50);
                return;
            }
            window.__POKI__ = {
                engine,
                get player() {
                    return engine.getCurrentPlayer?.() ?? null;
                },
                get playerId() {
                    return engine.playerIdSignal?.() ?? null;
                },
                get canvas() {
                    return canvasEl();
                },
                /**
                 * Ready = engine + canvas + current player all live.
                 * Playwright polls this via `page.waitForFunction`.
                 */
                get ready() {
                    return (
                        !!engine.getCurrentPlayer?.() && !!getServerPlayer(engine) && !!canvasEl()
                    );
                },
                testing: {
                    resetPersistence,
                    getState: readState,
                    triggerEvent,
                    triggerShape,
                    defeatEvent,
                    defeatPlayer,
                    beginEvent,
                    beginShape,
                    beginDefeatEvent,
                    beginPlayerDefeat,
                    beginText,
                    getTaskStatus: readTask,
                    closeGui,
                    processAction,
                    worldToCanvas,
                    getParty: readParty,
                    getFlag: readFlag,
                    getInventoryCount: readInventoryCount,
                    addInventoryItem,
                    setInventoryItemCount: writeInventoryItemCount,
                    recordClue: writeClue,
                    recordMasteredWord: writeClue,
                    setLeadHp: writeLeadHp,
                    setEventHp: writeEventHp,
                    setPartyCurrentHp: writePartyCurrentHp,
                    moveServerPlayer,
                    getCombatState: readCombatState,
                    getLatestEncounter: readLatestEncounter,
                },
            };
        } catch {
            if (attempts < MAX_ATTEMPTS) setTimeout(tryInstall, 50);
        }
    };
    // First attempt happens on the next microtask — startGame()'s DI
    // setup needs at least one macrotask to finish wiring.
    queueMicrotask(tryInstall);
}
