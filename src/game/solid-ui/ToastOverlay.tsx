/** @jsxImportSource solid-js */
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { gameBus, type ToastEvent } from '../GameBus';

type Sparkle = { id: number; dx: number; dy: number; delay: number };

export function ToastOverlay() {
  const [toast, setToast] = createSignal<ToastEvent | null>(null);
  const [sparkles, setSparkles] = createSignal<Sparkle[]>([]);
  let timer: number | undefined;
  let sparkleId = 0;

  onMount(() => {
    const unsub = gameBus.on('toast:show', (e) => {
      setToast(e);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setToast(null);
        setSparkles([]);
      }, e.ttlMs ?? 2500);

      if (e.kind === 'celebration') {
        const burst: Sparkle[] = Array.from({ length: 12 }).map(() => ({
          id: ++sparkleId,
          dx: (Math.random() - 0.5) * 220,
          dy: (Math.random() - 0.6) * 140,
          delay: Math.random() * 180,
        }));
        setSparkles(burst);
      }
    });
    onCleanup(() => {
      unsub();
      if (timer) window.clearTimeout(timer);
    });
  });

  const styleFor = (kind: ToastEvent['kind']) => {
    switch (kind) {
      case 'celebration':
        return {
          bg: 'linear-gradient(180deg, #fde047 0%, #facc15 55%, #b45309 100%)',
          border: '#78350f',
          text: '#451a03',
        };
      case 'danger':
        return {
          bg: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)',
          border: '#7f1d1d',
          text: '#fff',
        };
      case 'hint':
      default:
        return {
          bg: 'linear-gradient(180deg, #fbbf24 0%, #f97316 100%)',
          border: '#b45309',
          text: '#fff',
        };
    }
  };

  return (
    <Show when={toast()}>
      {(t) => {
        const s = styleFor(t().kind);
        return (
          <div class="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
            <Show when={t().kind === 'celebration'}>
              <div class="absolute left-1/2 top-1/2 w-[280px] h-[280px] fanfare-rays pointer-events-none" />
            </Show>
            <div
              class="relative rounded-lg px-5 py-2.5 shadow-[0_6px_0_rgba(0,0,0,0.25),0_12px_30px_-6px_rgba(0,0,0,0.45)] min-w-[200px] text-center animate-in slide-in-from-top-4 zoom-in-95 duration-300"
              style={{
                background: s.bg,
                border: `2px solid ${s.border}`,
                color: s.text,
              }}
            >
              <div class="font-display text-lg tracking-wider drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
                {t().title}
              </div>
              <Show when={t().body}>
                <div class="font-tile text-[11px] opacity-90 mt-0.5">
                  {t().body}
                </div>
              </Show>
            </div>
            <For each={sparkles()}>
              {(sp) => (
                <span
                  class="absolute top-1/2 left-1/2 text-yellow-200 sparkle text-lg"
                  style={{
                    '--dx': `${sp.dx}px`,
                    '--dy': `${sp.dy}px`,
                    'animation-delay': `${sp.delay}ms`,
                    'text-shadow': '0 1px 0 #7c2d12, 0 0 6px rgba(253, 224, 71, 0.8)',
                  }}
                >
                  ✦
                </span>
              )}
            </For>
          </div>
        );
      }}
    </Show>
  );
}
