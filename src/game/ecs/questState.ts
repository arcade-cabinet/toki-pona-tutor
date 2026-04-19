// Small, dependency-free quest state. Persists to localStorage so adventure
// progress survives refresh.

export type QuestStage = 'not_started' | 'accepted' | 'item_found' | 'complete';

interface QuestState {
  hungryFriend: QuestStage;
  inventory: Record<string, boolean>;
  masteredWords: string[];
  xp: number;
  /** Set of NPC ids the player has already talked to at least once. */
  spokenTo: Record<string, boolean>;
  /** True once jan Sewi's opening tutorial has played through. */
  tutorialComplete: boolean;
}

const KEY = 'kama-sona.questState.v1';

function load(): QuestState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultState();
}

function defaultState(): QuestState {
  return {
    hungryFriend: 'not_started',
    inventory: {},
    masteredWords: [],
    xp: 0,
    spokenTo: {},
    tutorialComplete: false,
  };
}

export function setTutorialComplete() {
  if (state.tutorialComplete) return;
  state = { ...state, tutorialComplete: true };
  save();
}

export function markSpokenTo(npcId: string) {
  if (state.spokenTo[npcId]) return;
  state = { ...state, spokenTo: { ...state.spokenTo, [npcId]: true } };
  save();
}

let state = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
  listeners.forEach((l) => l());
}

export function getQuestState(): QuestState {
  return state;
}

export function subscribeQuest(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function acceptQuest() {
  if (state.hungryFriend === 'not_started') {
    state = { ...state, hungryFriend: 'accepted' };
    save();
  }
}

export function pickUpItem(itemId: string) {
  state = { ...state, inventory: { ...state.inventory, [itemId]: true } };
  if (itemId === 'kili' && state.hungryFriend === 'accepted') {
    state = { ...state, hungryFriend: 'item_found' };
  }
  save();
}

export function completeHungryFriend() {
  state = {
    ...state,
    hungryFriend: 'complete',
    masteredWords: Array.from(new Set([...state.masteredWords, 'kili'])),
  };
  save();
}

export function masterWord(word: string) {
  if (state.masteredWords.includes(word)) return;
  state = { ...state, masteredWords: [...state.masteredWords, word] };
  save();
}

export function addXp(amount: number) {
  state = { ...state, xp: state.xp + amount };
  save();
}

export function resetProgress() {
  state = defaultState();
  save();
}
