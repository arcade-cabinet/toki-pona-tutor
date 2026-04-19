/** @jsxImportSource solid-js */
import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { gameBus, type ToastEvent } from '../GameBus';

export function ToastOverlay() {
  const [toast, setToast] = createSignal<ToastEvent | null>(null);
  let timer: number | undefined;

  onMount(() => {
    const unsub = gameBus.on('toast:show', (e) => {
      setToast(e);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(null), e.ttlMs ?? 2500);
    });
    onCleanup(() => {
      unsub();
      if (timer) window.clearTimeout(timer);
    });
  });

  const styleFor = (kind: ToastEvent['kind']) => {
    switch (kind) {
      case 'celebration':
        return 'from-lime-400 to-green-500 border-green-700';
      case 'danger':
        return 'from-red-500 to-red-600 border-red-800';
      case 'hint':
      default:
        return 'from-amber-400 to-orange-500 border-orange-700';
    }
  };

  return (
    <Show when={toast()}>
      {(t) => (
        <div class="absolute top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in slide-in-from-top-4 duration-200">
          <div class={`bg-gradient-to-b ${styleFor(t().kind)} text-white rounded-2xl border-b-[5px] px-4 py-2 shadow-xl min-w-[180px] text-center`}>
            <div class="font-display text-base tracking-wider">{t().title}</div>
            <Show when={t().body}>
              <div class="font-pixel text-[10px] opacity-90 mt-0.5">{t().body}</div>
            </Show>
          </div>
        </div>
      )}
    </Show>
  );
}
