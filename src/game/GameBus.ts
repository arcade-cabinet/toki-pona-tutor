// Typed event bus bridging Phaser scenes, Solid overlays, and React shell.
// Keep the event map narrow — every new event here is a seam to maintain.

export interface DialogOpenEvent {
  npcId: string;
  // Optional quest hook — which dialog node to start at
  node?: string;
}

export interface DialogChoiceEvent {
  npcId: string;
  choice: number;
}

export interface QuizChallengeEvent {
  // A challenge key from challenges.json or a specific quest-gated prompt
  challengeId: string;
  // What to do when the player resolves it
  onResolve: (wasCorrect: boolean) => void;
}

export interface QuestUpdateEvent {
  questId: string;
  stage: string;
}

export interface WordLearnedEvent {
  word: string;
}

export interface ToastEvent {
  kind: 'celebration' | 'hint' | 'danger';
  title: string;
  body?: string;
  ttlMs?: number;
}

export interface SeedOpenNewGameEvent {
  onConfirm: (seed: { noun: string; adj1: string; adj2: string }) => void;
}

interface GameEventMap {
  'dialog:open': DialogOpenEvent;
  'dialog:close': void;
  'dialog:choice': DialogChoiceEvent;
  'quiz:open': QuizChallengeEvent;
  'quiz:close': void;
  'quest:update': QuestUpdateEvent;
  'word:learned': WordLearnedEvent;
  'game:pause': boolean;
  'toast:show': ToastEvent;
  'seed:open-new-game': SeedOpenNewGameEvent;
  'combat:enter': { enemyId: string };
  'combat:victory': { enemyId: string };
  'combat:defeat': { enemyId: string };
  'tutorial:start': void;
  'tutorial:complete': void;
  'tutorial:player-moved': void;
}

type Handler<T> = (payload: T) => void;

class TypedBus {
  private listeners = new Map<keyof GameEventMap, Set<Handler<unknown>>>();

  on<K extends keyof GameEventMap>(
    event: K,
    handler: Handler<GameEventMap[K]>
  ): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(handler as Handler<unknown>);
    this.listeners.set(event, set);
    return () => {
      this.listeners.get(event)?.delete(handler as Handler<unknown>);
    };
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    this.listeners.get(event)?.forEach((h) => (h as Handler<GameEventMap[K]>)(payload));
  }
}

export const gameBus = new TypedBus();
