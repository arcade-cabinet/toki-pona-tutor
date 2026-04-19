/**
 * Persisted game state — the player's save.
 *
 * Replaces the hungry-friend-specific `questState`. Now generic across any
 * region / dialog / quest defined in `generated/world.json`:
 *
 *   - `flags`: boolean flags set by dialog triggers (e.g. `starter_chosen`)
 *   - `quests`: quest_id → current stage string (dialog authors decide the
 *      stage vocabulary per-quest)
 *   - `currentRegionId` / `playerTile`: where the player is in the world
 *   - `party`: creatures carried, up to 6
 *   - `bestiary`: species the player has encountered or caught
 *   - `inventory`: item id → count
 *   - `masteredWords`: vocabulary the player has earned (shown in the
 *      Pokedex as sitelen-pona glyphs)
 */

export interface PartyMember {
  /** Instance id — unique per party member, persists across sessions. */
  instance_id: string;
  species_id: string;
  level: number;
  xp: number;
  hp: number;
  max_hp: number;
  /** Known move ids — cap 4 per Pokemon convention. */
  moves: string[];
  /** Per-move PP remaining, parallel to `moves`. */
  pp: number[];
  /** Player-given nickname (optional). */
  nickname?: string;
}

export interface BestiaryEntry {
  species_id: string;
  seen: boolean;
  caught: boolean;
  first_encountered_at: number;
}

export interface SaveState {
  schema_version: 1;
  current_region_id: string;
  player_tile: { x: number; y: number };
  flags: Record<string, boolean>;
  quests: Record<string, string>;
  party: PartyMember[];
  bestiary: Record<string, BestiaryEntry>;
  inventory: Record<string, number>;
  mastered_words: string[];
  /** Gym badges (reward_word strings from jan_lawa NPCs the player has beaten). */
  badges: string[];
}

const KEY = 'toki-town.save.v1';
const PARTY_MAX = 6;

function defaultState(): SaveState {
  return {
    schema_version: 1,
    current_region_id: '',
    player_tile: { x: 0, y: 0 },
    flags: {},
    quests: {},
    party: [],
    bestiary: {},
    inventory: {},
    mastered_words: [],
    badges: [],
  };
}

function load(): SaveState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // shallow merge so new defaults show up for old saves
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

let state = load();
const listeners = new Set<() => void>();

function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
  for (const fn of listeners) fn();
}

/**
 * Return a readonly view of the current save. Mutations must go through
 * the exported helpers below so localStorage + subscribers stay in sync.
 */
export function getSave(): Readonly<SaveState> {
  return state;
}

export function subscribeSave(fn: () => void): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

export function resetSave(): void {
  state = defaultState();
  commit();
}

// ----- flags + quests -----

export function getFlag(key: string): boolean {
  return state.flags[key] ?? false;
}

export function setFlag(key: string, value: boolean): void {
  if ((state.flags[key] ?? false) === value) return;
  state = { ...state, flags: { ...state.flags, [key]: value } };
  commit();
}

export function advanceQuest(questId: string, stage: string): void {
  if (state.quests[questId] === stage) return;
  state = { ...state, quests: { ...state.quests, [questId]: stage } };
  commit();
}

export function getQuestStage(questId: string): string {
  return state.quests[questId] ?? '';
}

// ----- region / position -----

export function setCurrentRegion(regionId: string, tile: { x: number; y: number }): void {
  state = {
    ...state,
    current_region_id: regionId,
    player_tile: { ...tile },
  };
  commit();
}

// ----- inventory -----

export function addItem(itemId: string, count = 1): void {
  const now = state.inventory[itemId] ?? 0;
  state = { ...state, inventory: { ...state.inventory, [itemId]: now + count } };
  commit();
}

export function consumeItem(itemId: string): boolean {
  const now = state.inventory[itemId] ?? 0;
  if (now <= 0) return false;
  const next = now - 1;
  const inventory = { ...state.inventory };
  if (next <= 0) delete inventory[itemId];
  else inventory[itemId] = next;
  state = { ...state, inventory };
  commit();
  return true;
}

// ----- party + bestiary -----

export function addToParty(member: PartyMember): boolean {
  if (state.party.length >= PARTY_MAX) return false;
  state = { ...state, party: [...state.party, member] };
  commit();
  return true;
}

export function markSeen(speciesId: string): void {
  if (state.bestiary[speciesId]?.seen) return;
  const entry: BestiaryEntry = {
    species_id: speciesId,
    seen: true,
    caught: state.bestiary[speciesId]?.caught ?? false,
    first_encountered_at: state.bestiary[speciesId]?.first_encountered_at ?? Date.now(),
  };
  state = { ...state, bestiary: { ...state.bestiary, [speciesId]: entry } };
  commit();
}

export function markCaught(speciesId: string): void {
  const now = state.bestiary[speciesId];
  if (now?.caught) return;
  const entry: BestiaryEntry = {
    species_id: speciesId,
    seen: true,
    caught: true,
    first_encountered_at: now?.first_encountered_at ?? Date.now(),
  };
  state = { ...state, bestiary: { ...state.bestiary, [speciesId]: entry } };
  commit();
}

// ----- vocabulary + badges -----

export function masterWord(word: string): void {
  if (state.mastered_words.includes(word)) return;
  state = { ...state, mastered_words: [...state.mastered_words, word] };
  commit();
}

export function earnBadge(badgeWord: string): void {
  if (state.badges.includes(badgeWord)) return;
  state = { ...state, badges: [...state.badges, badgeWord] };
  commit();
}
