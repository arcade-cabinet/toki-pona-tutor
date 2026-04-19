/** @jsxImportSource solid-js */
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { gameBus } from '../GameBus';
import { sitelenFor, toSitelenPona } from '../../lib/sitelen';
import { setTutorialComplete } from '../ecs/questState';

/**
 * jan Sewi's opening tutorial. Plays a 5-beat dialog sequence the first time
 * the player enters Adventure. Beats are advanced by the player; Beat 3 waits
 * on a `tutorial:player-moved` bus signal so the lesson — "move with WASD /
 * arrows" — actually teaches the mechanic instead of just describing it.
 */

interface Beat {
  tp: string;
  en: string;
  /** Optional sitelen-pona glyph to display front-and-center as a lesson. */
  glyph?: string;
  /** When set, block the 'next' button until this bus event fires. */
  waitFor?: 'player-moved';
}

const BEATS: Beat[] = [
  {
    tp: 'toki, jan kama. sina kama tawa ma pona. mi jan Sewi. nimi pi ma ni li "ma tomo lili".',
    en: 'Hello, newcomer. You have arrived at a good place. I am jan Sewi. The name of this place is "the small village."',
  },
  {
    tp: 'o tawa. o kepeken nena nena anu W A S D.',
    en: 'Move around. Use the arrow keys, or W A S D.',
    waitFor: 'player-moved',
  },
  {
    tp: 'pona! sina ken tawa. tenpo ni la, o kepeken E tawa toki tawa jan ante.',
    en: 'Good! You can move. Now use E to talk to other people.',
  },
  {
    tp: 'nimi "li" li suli. ona li pana e sona pi pali pi jan ante. "jan Pona li wile" — jan Pona wants.',
    en: '"li" is an important little word. It connects a person to what they do. "jan Pona li wile" — jan Pona wants.',
    glyph: 'li',
  },
  {
    tp: 'jan Pona li pilin ike. soweli ona li wile moku. o tawa ona. ona li wile e pona sina.',
    en: 'jan Pona is worried. Her animal is hungry. Go speak with her. She needs your help.',
  },
];

// Characters/sec for the typewriter reveal.
const TYPE_MS = 22;

export function TutorialOverlay() {
  const [active, setActive] = createSignal(false);
  const [beatIndex, setBeatIndex] = createSignal(0);
  const [typed, setTyped] = createSignal(0);
  const [showEn, setShowEn] = createSignal(false);
  const [playerMoved, setPlayerMoved] = createSignal(false);

  const beat = () => BEATS[beatIndex()];
  const isTyping = () => typed() < beat().tp.length;
  const waitingForMove = () => beat().waitFor === 'player-moved' && !playerMoved();

  let typeTimer: number | undefined;
  createEffect(() => {
    if (!active()) return;
    const b = beat();
    // restart typewriter whenever beat changes
    beatIndex(); // track dep
    if (typeTimer) window.clearInterval(typeTimer);
    setTyped(0);
    setShowEn(false);
    setPlayerMoved(false);
    typeTimer = window.setInterval(() => {
      setTyped((n) => {
        if (n >= b.tp.length) {
          if (typeTimer) window.clearInterval(typeTimer);
          return n;
        }
        return n + 1;
      });
    }, TYPE_MS);
  });
  onCleanup(() => {
    if (typeTimer) window.clearInterval(typeTimer);
  });

  onMount(() => {
    const unsubStart = gameBus.on('tutorial:start', () => {
      setActive(true);
      setBeatIndex(0);
    });
    const unsubMove = gameBus.on('tutorial:player-moved', () => {
      setPlayerMoved(true);
    });
    onCleanup(() => {
      unsubStart();
      unsubMove();
    });
  });

  const revealNow = () => {
    if (typeTimer) window.clearInterval(typeTimer);
    setTyped(beat().tp.length);
  };

  const next = () => {
    if (isTyping()) {
      revealNow();
      return;
    }
    if (waitingForMove()) return;
    const i = beatIndex();
    if (i + 1 >= BEATS.length) {
      // Close tutorial
      setActive(false);
      setTutorialComplete();
      gameBus.emit('tutorial:complete', undefined);
      return;
    }
    setBeatIndex(i + 1);
  };

  return (
    <Show when={active()}>
      <div class="absolute inset-0 z-50 flex items-end justify-center pointer-events-auto p-3 pb-6 bg-black/30 backdrop-blur-[1px]">
        <div
          class="relative max-w-lg w-full animate-in slide-in-from-bottom-4 duration-300"
          style={{
            background: 'linear-gradient(180deg, #fff7e5 0%, #fdeccb 100%)',
            'border-radius': '18px 22px 16px 20px',
            'box-shadow':
              '0 6px 0 rgba(120,53,15,0.2), 0 14px 30px -8px rgba(0,0,0,0.45)',
            border: '2px solid rgba(180,120,60,0.35)',
          }}
        >
          {/* Speaker tag */}
          <div class="absolute -top-3 left-4 px-3 py-0.5 text-white font-display text-xs tracking-wider rounded-full shadow-md bg-gradient-to-r from-indigo-400 to-purple-500">
            jan Sewi
          </div>

          <div class="p-4 pt-5 space-y-3 cursor-pointer" onClick={next}>
            <Show when={beat().glyph}>
              <div class="flex flex-col items-center gap-1 py-2 rounded-xl bg-emerald-50 border-2 border-dashed border-emerald-300">
                <span class="font-sitelen text-6xl text-emerald-800 leading-none">
                  {sitelenFor(beat().glyph!)}
                </span>
                <span class="font-tile text-sm text-emerald-900">
                  {beat().glyph}
                </span>
              </div>
            </Show>

            <div class="font-sitelen text-3xl text-emerald-800 leading-tight min-h-[1.5em]">
              {toSitelenPona(beat().tp.slice(0, typed()))}
            </div>
            <div class="font-tile text-base text-amber-900 leading-snug min-h-[1.3em]">
              "{beat().tp.slice(0, typed())}
              <Show when={isTyping()}>
                <span class="inline-block w-0.5 h-[1em] bg-amber-700 ml-0.5 align-middle animate-pulse" />
              </Show>
              <Show when={!isTyping()}>"</Show>
            </div>

            <Show when={showEn() && !isTyping()}>
              <div class="text-sm text-amber-800/70 italic border-l-2 border-amber-400 pl-3 animate-in fade-in duration-200">
                {beat().en}
              </div>
            </Show>

            <Show when={waitingForMove() && !isTyping()}>
              <div class="text-xs text-center text-indigo-700 font-display uppercase tracking-widest py-1 animate-pulse">
                ↑ ← ↓ →  try moving
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
                  next();
                }}
                disabled={waitingForMove() && !isTyping()}
                class="flex-1 py-2 rounded-xl bg-gradient-to-b from-indigo-500 to-purple-600 border-b-[4px] border-purple-900 text-amber-50 font-display text-xs uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all relative disabled:opacity-40"
              >
                {beatIndex() + 1 >= BEATS.length && !isTyping()
                  ? 'o tawa →'
                  : 'next'}
                <Show when={!isTyping() && !waitingForMove()}>
                  <span class="absolute -bottom-1 right-2 text-amber-100 text-xs advance-cursor pointer-events-none">
                    ▼
                  </span>
                </Show>
              </button>
            </div>

            <div class="text-[10px] text-center text-amber-700/60 font-display uppercase tracking-widest">
              beat {beatIndex() + 1} / {BEATS.length}
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
