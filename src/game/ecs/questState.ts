// Small, dependency-free quest state. Persists to localStorage so adventure
// progress survives refresh.

export type QuestStage = 'not_started' | 'accepted' | 'item_found' | 'complete';

interface QuestState {
  hungryFriend: QuestStage;
  inventory: Record<string, boolean>;
  masteredWords: string[];
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
  };
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

export function resetProgress() {
  state = defaultState();
  save();
}
