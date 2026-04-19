/** @jsxImportSource solid-js */
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { gameBus } from '../GameBus';
import { shuffleSeed, saveSeed, type Seed } from '../procgen/seed';
import { sitelenFor } from '../../lib/sitelen';

// Simple display helper: sitelen pona glyph over latin word as a stacked pair.
function WordTile(props: { word: string; highlighted?: boolean }) {
  return (
    <div
      class={`flex flex-col items-center px-3 py-2 rounded-2xl border-b-[4px] transition-all ${
        props.highlighted
          ? 'bg-amber-100 border-emerald-400'
          : 'bg-amber-50 border-amber-300'
      }`}
    >
      <span class="font-sitelen text-3xl leading-none text-emerald-800">
        {sitelenFor(props.word) || '·'}
      </span>
      <span class="font-tile text-xs mt-1 text-amber-900">{props.word}</span>
    </div>
  );
}

export function NewGameModal() {
  const [open, setOpen] = createSignal(false);
  const [seed, setSeed] = createSignal<Seed>(shuffleSeed());
  const [onConfirmFn, setOnConfirmFn] = createSignal<((s: Seed) => void) | null>(null);

  onMount(() => {
    const unsub = gameBus.on('seed:open-new-game', ({ onConfirm }) => {
      setSeed(shuffleSeed());
      setOnConfirmFn(() => onConfirm);
      setOpen(true);
    });
    onCleanup(unsub);
  });

  const shuffle = () => setSeed(shuffleSeed());

  const confirm = () => {
    const s = seed();
    saveSeed(s);
    const cb = onConfirmFn();
    if (cb) cb(s);
    setOpen(false);
  };

  const cancel = () => setOpen(false);

  return (
    <Show when={open()}>
      <div
        class="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto p-4"
        style={{ background: 'rgba(30, 40, 30, 0.55)', 'backdrop-filter': 'blur(4px)' }}
      >
        <div
          class="max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
          style={{
            background: 'linear-gradient(180deg, #fff7e5 0%, #fdeccb 100%)',
            'border-radius': '20px 24px 18px 22px',
            'box-shadow':
              '0 10px 0 rgba(120,53,15,0.22), 0 20px 40px -8px rgba(0,0,0,0.45)',
            border: '2px solid rgba(180,120,60,0.35)',
          }}
        >
          <div class="absolute -top-3 left-5 px-3 py-0.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-amber-50 font-display text-xs tracking-wider rounded-full shadow-md">
            kama sona
          </div>

          <div class="p-5 pt-7 space-y-4">
            <div class="text-center space-y-1">
              <p class="font-tile text-sm text-amber-900 uppercase tracking-widest">
                Your world
              </p>
              <p class="text-xs text-amber-800/70 italic">
                Every seed grows a different Toki Town
              </p>
            </div>

            <div class="flex justify-center gap-2">
              <For each={[seed().noun, seed().adj1, seed().adj2]}>
                {(word) => <WordTile word={word} />}
              </For>
            </div>

            <div class="text-center">
              <p class="font-sitelen text-4xl text-emerald-800 leading-none">
                {`${sitelenFor(seed().noun)}${sitelenFor(seed().adj1)}${sitelenFor(seed().adj2)}`}
              </p>
              <p class="font-tile text-base text-amber-900 mt-1">
                "{seed().noun} {seed().adj1} {seed().adj2}"
              </p>
            </div>

            <div class="flex gap-2 pt-1">
              <button
                type="button"
                onClick={shuffle}
                class="flex-1 py-2.5 rounded-xl bg-amber-50 border-b-[4px] border-amber-300 text-amber-800 font-display text-sm uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all"
              >
                🎲 Shuffle
              </button>
              <button
                type="button"
                onClick={confirm}
                class="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 border-b-[4px] border-emerald-900 text-amber-50 font-display text-sm uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all"
              >
                o tawa →
              </button>
            </div>

            <button
              type="button"
              onClick={cancel}
              class="w-full text-xs text-amber-700/70 font-tile underline hover:text-amber-900"
            >
              never mind
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
