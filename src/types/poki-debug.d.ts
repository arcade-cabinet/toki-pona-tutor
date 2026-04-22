/**
 * Dev/test-only debug surface exposed by src/standalone.ts.
 *
 * Production builds tree-shake this out (the assignment is gated on
 * `import.meta.env.DEV`). E2E tests under tests/e2e/ read the surface
 * via `page.evaluate(() => window.__POKI__.player)` etc. — no casting
 * required from within tests because this file is included in
 * tsconfig.build-time.json.
 *
 * The shape is installed immediately on module evaluation as a
 * placeholder with `ready: false`; the engine-bound accessors swap
 * in once @rpgjs/client's DI resolves (see standalone.ts retry
 * loop). That means every reader of `window.__POKI__` can assume
 * the object exists — they just need to poll `ready` until true.
 */
import type { RpgClientEngine, RpgClientPlayer } from "@rpgjs/client";

export interface PokiDebugState {
    playerId: string | null;
    serverPlayerId: string | null;
    currentMapId: string | null;
    journeyBeat: string | null;
    starterChosen: string | null;
    serverGraphic: string | null;
    position: {
        x: number | null;
        y: number | null;
    };
    serverMapId: string | null;
    serverPosition: {
        x: number | null;
        y: number | null;
    };
    saves: Array<Record<string, unknown> | null>;
}

export interface PokiDebugPartyMember {
    slot: number;
    speciesId: string;
    level: number;
    xp: number;
}

export interface PokiDebugEncounterLog {
    speciesId: string;
    mapId: string;
    outcome: string;
}

export interface PokiDebugDictionaryExport {
    textCard: string;
    svgCard: string;
    filename: string;
    shareAttempted: boolean;
    clipboardAttempted: boolean;
    downloadAttempted: boolean;
}

export interface PokiDebugDictionaryExportRuntime {
    installed: boolean;
    received: number;
    invalid: number;
}

export interface PokiDebugTaskStatus {
    done: boolean;
    error: string | null;
}

export interface PokiDebugCombatState {
    eventHp: number | null;
    eventPosition: {
        x: number | null;
        y: number | null;
    };
    playerHp: number | null;
    playerSp: number | null;
    playerPosition: {
        x: number | null;
        y: number | null;
    };
}

export interface PokiDebugShapeTriggerOptions {
    randomValues?: number[];
}

export type PokiDebugShapeTarget =
    | string
    | {
          name: string;
          properties?: Record<string, unknown>;
      };

export interface PokiDebugTesting {
    resetPersistence(options?: { includeSaves?: boolean }): Promise<void>;
    getState(): Promise<PokiDebugState>;
    triggerEvent(eventId: string, trigger?: "action" | "touch"): Promise<void>;
    triggerShape(
        shape: PokiDebugShapeTarget,
        options?: PokiDebugShapeTriggerOptions,
    ): Promise<void>;
    defeatEvent(eventId: string): Promise<void>;
    defeatPlayer(): Promise<void>;
    beginEvent(eventId: string, trigger?: "action" | "touch"): Promise<string> | string;
    beginShape(
        shape: PokiDebugShapeTarget,
        options?: PokiDebugShapeTriggerOptions,
    ): Promise<string> | string;
    beginDefeatEvent(eventId: string): Promise<string> | string;
    beginPlayerDefeat(): Promise<string> | string;
    getTaskStatus(taskId: string): Promise<PokiDebugTaskStatus | null>;
    closeGui(guiId?: string, data?: unknown): Promise<void>;
    processAction(action: "action" | "escape" | "up" | "down" | "left" | "right"): Promise<void>;
    worldToCanvas(x: number, y: number): Promise<{ x: number; y: number }>;
    moveServerPlayer(position: { x: number; y: number; z?: number }, mapId?: string): Promise<void>;
    getCombatState(eventId: string): Promise<PokiDebugCombatState>;
    getParty(): Promise<PokiDebugPartyMember[]>;
    getFlag(flagId: string): Promise<string | null>;
    getInventoryCount(itemId: string): Promise<number>;
    addInventoryItem(itemId: string, count: number): Promise<void>;
    setInventoryItemCount(itemId: string, count: number): Promise<void>;
    recordMasteredWord(tpWord: string): Promise<void>;
    setLeadHp(hp: number): Promise<void>;
    setEventHp(eventId: string, hp: number): Promise<void>;
    setPartyCurrentHp(slot: number, hp: number): Promise<void>;
    getLatestEncounter(): Promise<PokiDebugEncounterLog | null>;
}

export interface PokiDebugSurface {
    /** The live RpgClientEngine once DI has resolved. Null before. */
    engine: RpgClientEngine | null;
    /** Current player (the local hero), or null pre-boot. */
    readonly player: RpgClientPlayer | null;
    /** Server-assigned player id, or null pre-boot. */
    readonly playerId: string | null;
    /** The #rpg canvas element once CanvasEngine mounts it. */
    readonly canvas: HTMLCanvasElement | null;
    /**
     * Convenience readiness signal used by Playwright:
     * true iff engine + canvas + current player are all live.
     */
    readonly ready: boolean;
    /** Dev/test-only browser helpers for full Playwright coverage. */
    testing: PokiDebugTesting;
}

declare global {
    interface Window {
        __POKI__?: PokiDebugSurface;
        __POKI_LAST_DICTIONARY_EXPORT__?: PokiDebugDictionaryExport;
        __POKI_DICTIONARY_EXPORT_RUNTIME__?: PokiDebugDictionaryExportRuntime;
    }
}

export {};
