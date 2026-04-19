/** @jsxImportSource solid-js */
import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { gameBus } from '../GameBus';
import { getNpc, pickDialogLine, type DialogLine } from '../villageContent';
import {
  acceptQuest,
  completeHungryFriend,
  getQuestState,
} from '../ecs/questState';

export function DialogOverlay() {
  const [line, setLine] = createSignal<DialogLine | null>(null);
  const [showEn, setShowEn] = createSignal(false);
  const [npcName, setNpcName] = createSignal('');

  onMount(() => {
    const unsub = gameBus.on('dialog:open', ({ npcId }) => {
      const stage = getQuestState().hungryFriend;
      const chosen = pickDialogLine(npcId, stage);
      if (!chosen) return;
      const npc = getNpc(npcId);
      setNpcName(npc?.name_tp ?? npcId);
      setLine(chosen);
      setShowEn(false);
    });
    onCleanup(unsub);
  });

  const close = () => {
    const l = line();
    if (l) {
      if (l.triggers_quest_accept) acceptQuest();
      if (l.triggers_quest_complete) completeHungryFriend();
    }
    setLine(null);
    gameBus.emit('dialog:close', undefined);
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
    <Show when={line()}>
      {(l) => (
        <div class="absolute inset-0 z-30 flex items-end justify-center pointer-events-none p-3 pb-6">
          <div class="bg-white rounded-2xl border-b-4 border-orange-300 shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            <div class={`px-4 py-1.5 bg-gradient-to-r ${moodColor(l().mood)} text-white font-display text-sm tracking-wider`}>
              {npcName()}
            </div>
            <div class="p-4 space-y-3">
              <div class="font-tile text-lg text-slate-800 leading-snug">
                "{l().tp}"
              </div>
              <Show when={showEn()}>
                <div class="text-sm text-slate-500 italic border-l-2 border-orange-300 pl-3">
                  {l().en}
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
                  onClick={close}
                  class="flex-1 py-2 rounded-xl bg-gradient-to-b from-lime-400 to-green-500 border-b-[4px] border-green-700 text-white font-display text-xs uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
