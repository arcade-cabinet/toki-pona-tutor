import type { RpgPlayer } from "@rpgjs/server";
import { BATTLE_AI_BOOTSTRAP_CONFIG } from "../../content/gameplay";

const battleAiFactoryKey = Symbol("battle-ai-factory");
const battleAiBootstrapQueuedKey = Symbol("battle-ai-bootstrap-queued");
const battleAiBootstrapAttemptsKey = Symbol("battle-ai-bootstrap-attempts");

type BattleAiFactory = () => unknown;

type BattleAiHost = RpgPlayer & {
    id: string;
    battleAi?: unknown;
    getCurrentMap?: () => {
        physic?: {
            getEntityByUUID?: (id: string) => unknown;
        };
    } | null;
    [battleAiFactoryKey]?: BattleAiFactory;
    [battleAiBootstrapQueuedKey]?: boolean;
    [battleAiBootstrapAttemptsKey]?: number;
};

function hasPhysicEntity(event: BattleAiHost): boolean {
    return Boolean(event.getCurrentMap?.()?.physic?.getEntityByUUID?.(event.id));
}

/**
 * BattleAi attaches a vision shape in its constructor. Map events do not
 * receive their physics body until after createDynamicEvent() finishes
 * onInit() and publishes the event into the map's synchronized `events`
 * signal, so constructing BattleAi directly in onInit() is too early.
 */
export function scheduleBattleAi(event: BattleAiHost, factory: BattleAiFactory): void {
    event[battleAiFactoryKey] = factory;
    if (event.battleAi || event[battleAiBootstrapQueuedKey]) {
        return;
    }
    event[battleAiBootstrapQueuedKey] = true;
    event[battleAiBootstrapAttemptsKey] = 0;
    queueMicrotask(() => {
        void attemptBattleAiBootstrap(event);
    });
}

export function ensureBattleAi(event: BattleAiHost): unknown | undefined {
    if (event.battleAi) {
        return event.battleAi;
    }
    if (!hasPhysicEntity(event)) {
        return undefined;
    }
    const factory = event[battleAiFactoryKey];
    if (!factory) {
        return undefined;
    }
    return factory();
}

function attemptBattleAiBootstrap(event: BattleAiHost): void {
    if (ensureBattleAi(event)) {
        event[battleAiBootstrapQueuedKey] = false;
        event[battleAiBootstrapAttemptsKey] = 0;
        return;
    }

    const attempts = (event[battleAiBootstrapAttemptsKey] ?? 0) + 1;
    event[battleAiBootstrapAttemptsKey] = attempts;
    if (attempts >= BATTLE_AI_BOOTSTRAP_CONFIG.maxAttempts) {
        event[battleAiBootstrapQueuedKey] = false;
        return;
    }

    setTimeout(() => {
        void attemptBattleAiBootstrap(event);
    }, BATTLE_AI_BOOTSTRAP_CONFIG.retryMs);
}
