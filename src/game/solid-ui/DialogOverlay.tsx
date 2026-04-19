/** @jsxImportSource solid-js */
import { createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { gameBus } from '../GameBus';
import { getNpc, pickDialogLine, type DialogLine } from '../villageContent';
import {
  acceptQuest,
  completeHungryFriend,
  getQuestState,
} from '../ecs/questState';
import { sitelenFor, toSitelenPona } from '../../lib/sitelen';

// ms per character during the typewriter reveal. Skipped by tapping anywhere.
const TYPE_MS = 22;

type Mode = 'dialog' | 'gate' | 'none';

// The quest-gate challenge: jan Pona says her animal is sick and asks the
// player to complete `soweli mi li wile e ___` by picking the right word.
// Correct = accept quest. Wrong = soft-fail, try again.
const GATE_WORDS = ['kili', 'akesi', 'lete', 'ike'];
const GATE_CORRECT = 'kili';

export function DialogOverlay() {
  const [line, setLine] = createSignal<DialogLine | null>(null);
  const [mode, setMode] = createSignal<Mode>('none');
  const [showEn, setShowEn] = createSignal(false);
  const [npcName, setNpcName] = createSignal('');
  const [gatePick, setGatePick] = createSignal<string | null>(null);
  const [gateFeedback, setGateFeedback] = createSignal<'none' | 'right' | 'wrong'>('none');
  const [typed, setTyped] = createSignal(0);
  let typeTimer: number | undefined;

  createEffect(() => {
    const l = line();
    if (typeTimer) clearInterval(typeTimer);
    if (!l || mode() !== 'dialog') return;
    setTyped(0);
    const full = l.tp.length;
    typeTimer = window.setInterval(() => {
      setTyped((n) => {
        if (n >= full) {
          if (typeTimer) clearInterval(typeTimer);
          return n;
        }
        return n + 1;
      });
    }, TYPE_MS);
  });

  onCleanup(() => {
    if (typeTimer) clearInterval(typeTimer);
  });

  const revealNow = () => {
    const l = line();
    if (!l) return;
    if (typeTimer) clearInterval(typeTimer);
    setTyped(l.tp.length);
  };

  const isTyping = () => {
    const l = line();
    return !!l && typed() < l.tp.length;
  };

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
          {/* Parchment dialog — warm cream background, irregular drop-shadow to
              suggest a hand-laid paper sheet, not a modal */}
          <div
            class="relative max-w-md w-full pointer-events-auto animate-in slide-in-from-bottom-4 duration-200"
            style={{
              background:
                'linear-gradient(180deg, #fff7e5 0%, #fdeccb 100%)',
              'border-radius': '18px 22px 16px 20px',
              'box-shadow':
                '0 6px 0 rgba(120,53,15,0.18), 0 14px 30px -8px rgba(0,0,0,0.35)',
              border: '2px solid rgba(180,120,60,0.35)',
            }}
          >
            {/* Speaker tag — looks like a paper nametag clipped to the top edge */}
            <div
              class={`absolute -top-3 left-4 px-3 py-0.5 text-white font-display text-xs tracking-wider rounded-full shadow-md bg-gradient-to-r ${moodColor(line()!.mood)}`}
            >
              {npcName()}
            </div>

            <Show when={mode() === 'gate'}>
              <div class="p-4 pt-5 space-y-3">
                <div class="flex flex-col items-center gap-1">
                  <div class="font-sitelen text-4xl text-emerald-800 leading-none flex items-center gap-2 flex-wrap justify-center">
                    <span>{sitelenFor('soweli')}</span>
                    <span>{sitelenFor('li')}</span>
                    <span>{sitelenFor('wile')}</span>
                    <span>{sitelenFor('e')}</span>
                    <span
                      class={`inline-block min-w-[42px] h-9 rounded px-1 text-center border-b-2 ${
                        gateFeedback() === 'right'
                          ? 'bg-lime-100 text-lime-700 border-lime-400'
                          : gateFeedback() === 'wrong'
                          ? 'bg-red-100 text-red-600 border-red-400 animate-pulse'
                          : 'bg-amber-100 text-pink-600 border-pink-300'
                      }`}
                    >
                      {gatePick() ? sitelenFor(gatePick()!) : '?'}
                    </span>
                  </div>
                  <div class="font-tile text-sm text-amber-900">
                    soweli li wile e{' '}
                    <span
                      class={`font-semibold px-1.5 rounded ${
                        gateFeedback() === 'right'
                          ? 'bg-lime-100 text-lime-700'
                          : gateFeedback() === 'wrong'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-pink-700'
                      }`}
                    >
                      {gatePick() ?? '___'}
                    </span>
                  </div>
                </div>
                <div class="text-xs text-amber-800/70 italic text-center">
                  jan Pona's animal is sick. What does it need?
                </div>
                <div class="grid grid-cols-4 gap-2">
                  <For each={GATE_WORDS}>
                    {(word) => (
                      <button
                        type="button"
                        onClick={() => setGatePick(word)}
                        disabled={gateFeedback() === 'right'}
                        class={`py-2 rounded-xl bg-amber-50 border-b-[4px] border-amber-300 text-amber-900 active:border-b-0 active:translate-y-[4px] transition-all disabled:opacity-50 flex flex-col items-center ${
                          gatePick() === word ? 'bg-pink-100 border-pink-400' : ''
                        }`}
                      >
                        <span class="font-sitelen text-2xl leading-none text-emerald-700">
                          {sitelenFor(word)}
                        </span>
                        <span class="font-tile text-xs mt-0.5">{word}</span>
                      </button>
                    )}
                  </For>
                </div>
                <button
                  type="button"
                  onClick={submitGate}
                  disabled={!gatePick() || gateFeedback() === 'right'}
                  class="w-full py-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 border-b-[4px] border-emerald-900 text-amber-50 font-display text-sm uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all disabled:opacity-40"
                >
                  {gateFeedback() === 'right' ? 'pona!' : 'Say it!'}
                </button>
              </div>
            </Show>

            <Show when={mode() === 'dialog'}>
              <div
                class="p-4 pt-5 space-y-2.5 cursor-pointer"
                onClick={() => {
                  if (isTyping()) revealNow();
                }}
              >
                <div class="font-sitelen text-3xl text-emerald-800 leading-tight min-h-[1.5em]">
                  {toSitelenPona(line()!.tp.slice(0, typed()))}
                </div>
                <div class="font-tile text-base text-amber-900 leading-snug min-h-[1.3em]">
                  "{line()!.tp.slice(0, typed())}
                  <Show when={isTyping()}>
                    <span class="inline-block w-0.5 h-[1em] bg-amber-700 ml-0.5 align-middle animate-pulse" />
                  </Show>
                  <Show when={!isTyping()}>"</Show>
                </div>
                <Show when={showEn() && !isTyping()}>
                  <div class="text-sm text-amber-800/70 italic border-l-2 border-amber-400 pl-3 animate-in fade-in duration-200">
                    {line()!.en}
                  </div>
                </Show>
                <div class="flex gap-2 pt-1 items-center">
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setShowEn(!showEn());
                    }}
                    class="flex-1 py-2 rounded-xl bg-amber-50 border-b-[4px] border-amber-300 text-amber-800 font-display text-xs uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all"
                  >
                    {showEn() ? 'hide English' : 'show English'}
                  </button>
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (isTyping()) {
                        revealNow();
                      } else {
                        closeDialog();
                      }
                    }}
                    class="flex-1 py-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 border-b-[4px] border-emerald-900 text-amber-50 font-display text-xs uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all relative"
                  >
                    o tawa →
                    <Show when={!isTyping()}>
                      <span class="absolute -bottom-1 right-2 text-amber-100 text-xs advance-cursor pointer-events-none">
                        ▼
                      </span>
                    </Show>
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
