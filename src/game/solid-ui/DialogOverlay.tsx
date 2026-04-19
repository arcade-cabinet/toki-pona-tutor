/** @jsxImportSource solid-js */
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { gameBus } from '../GameBus';
import { getNpc, pickDialogLine, type DialogLine } from '../villageContent';
import {
  acceptQuest,
  completeHungryFriend,
  getQuestState,
} from '../ecs/questState';

type Mode = 'dialog' | 'gate' | 'none';

// The quest-gate challenge: fill `mi wile e ___` with the right word. Correct
// = accept quest. Wrong = soft-fail, try again (no penalty; this is narrative).
const GATE_WORDS = ['kili', 'telo', 'jan', 'moku'];
const GATE_CORRECT = 'kili';

export function DialogOverlay() {
  const [line, setLine] = createSignal<DialogLine | null>(null);
  const [mode, setMode] = createSignal<Mode>('none');
  const [showEn, setShowEn] = createSignal(false);
  const [npcName, setNpcName] = createSignal('');
  const [gatePick, setGatePick] = createSignal<string | null>(null);
  const [gateFeedback, setGateFeedback] = createSignal<'none' | 'right' | 'wrong'>('none');

  onMount(() => {
    const unsub = gameBus.on('dialog:open', ({ npcId }) => {
      const stage = getQuestState().hungryFriend;
      const chosen = pickDialogLine(npcId, stage);
      if (!chosen) return;
      const npc = getNpc(npcId);
      setNpcName(npc?.name_tp ?? npcId);
      setLine(chosen);
      setShowEn(false);
      setGatePick(null);
      setGateFeedback('none');

      // Gate mode activates when jan Pona offers the quest the first time.
      if (npcId === 'jan_pona' && stage === 'not_started') {
        setMode('gate');
      } else {
        setMode('dialog');
      }
    });
    onCleanup(unsub);
  });

  const closeDialog = () => {
    const l = line();
    if (l) {
      if (l.triggers_quest_complete) {
        completeHungryFriend();
        gameBus.emit('toast:show', {
          kind: 'celebration',
          title: 'pona mute!',
          body: 'You helped jan Pona. +50 XP',
          ttlMs: 3000,
        });
      }
    }
    setLine(null);
    setMode('none');
    gameBus.emit('dialog:close', undefined);
  };

  const submitGate = () => {
    const pick = gatePick();
    if (!pick) return;
    if (pick === GATE_CORRECT) {
      setGateFeedback('right');
      acceptQuest();
      gameBus.emit('toast:show', {
        kind: 'celebration',
        title: 'Quest accepted!',
        body: 'Find a kili for jan Pona',
        ttlMs: 2500,
      });
      setTimeout(() => {
        setLine(null);
        setMode('none');
        gameBus.emit('dialog:close', undefined);
      }, 900);
    } else {
      setGateFeedback('wrong');
      setTimeout(() => {
        setGatePick(null);
        setGateFeedback('none');
      }, 900);
    }
  };

  const moodColor = (mood: string | undefined) => {
    switch (mood) {
      case 'happy':
        return 'from-pink-400 to-orange-400';
      case 'excited':
        return 'from-yellow-400 to-pink-500';
      case 'sad':
        return 'from-slate-400 to-slate-500';
      case 'thinking':
        return 'from-indigo-400 to-purple-500';
      default:
        return 'from-orange-400 to-pink-400';
    }
  };

  return (
    <Show when={line() && mode() !== 'none'}>
      {(_) => (
        <div class="absolute inset-0 z-30 flex items-end justify-center pointer-events-none p-3 pb-6">
          <div class="bg-white rounded-2xl border-b-4 border-orange-300 shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            <div class={`px-4 py-1.5 bg-gradient-to-r ${moodColor(line()!.mood)} text-white font-display text-sm tracking-wider`}>
              {npcName()}
            </div>

            <Show when={mode() === 'gate'}>
              <div class="p-4 space-y-3">
                <div class="font-tile text-lg text-slate-800 leading-snug">
                  <span>"mi wile e </span>
                  <span
                    class={`inline-block min-w-[60px] px-2 rounded font-display text-pink-600 border-b-2 border-pink-300 ${
                      gateFeedback() === 'right' ? 'bg-lime-100 text-lime-700 border-lime-400' : ''
                    } ${gateFeedback() === 'wrong' ? 'bg-red-100 text-red-600 border-red-400 animate-pulse' : ''}`}
                  >
                    {gatePick() ?? '___'}
                  </span>
                  <span>."</span>
                </div>
                <div class="text-xs text-slate-500 italic">
                  Help jan Pona finish her sentence. What does she want?
                </div>
                <div class="grid grid-cols-4 gap-2">
                  <For each={GATE_WORDS}>
                    {(word) => (
                      <button
                        type="button"
                        onClick={() => setGatePick(word)}
                        disabled={gateFeedback() === 'right'}
                        class={`py-2 rounded-xl font-tile text-base bg-white border-b-[4px] border-orange-300 text-slate-800 active:border-b-0 active:translate-y-[4px] transition-all disabled:opacity-50 ${
                          gatePick() === word ? 'bg-pink-100 border-pink-400' : ''
                        }`}
                      >
                        {word}
                      </button>
                    )}
                  </For>
                </div>
                <button
                  type="button"
                  onClick={submitGate}
                  disabled={!gatePick() || gateFeedback() === 'right'}
                  class="w-full py-2.5 rounded-xl bg-gradient-to-b from-lime-400 to-green-500 border-b-[4px] border-green-700 text-white font-display text-sm uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all disabled:opacity-40"
                >
                  {gateFeedback() === 'right' ? 'pona!' : 'Say it!'}
                </button>
              </div>
            </Show>

            <Show when={mode() === 'dialog'}>
              <div class="p-4 space-y-3">
                <div class="font-tile text-lg text-slate-800 leading-snug">
                  "{line()!.tp}"
                </div>
                <Show when={showEn()}>
                  <div class="text-sm text-slate-500 italic border-l-2 border-orange-300 pl-3">
                    {line()!.en}
                  </div>
                </Show>
                <div class="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEn(!showEn())}
                    class="flex-1 py-2 rounded-xl bg-white border-b-[4px] border-orange-300 text-orange-700 font-display text-xs uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all"
                  >
                    {showEn() ? 'Hide English' : 'Show English'}
                  </button>
                  <button
                    type="button"
                    onClick={closeDialog}
                    class="flex-1 py-2 rounded-xl bg-gradient-to-b from-lime-400 to-green-500 border-b-[4px] border-green-700 text-white font-display text-xs uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            </Show>
          </div>
        </div>
      )}
    </Show>
  );
}
