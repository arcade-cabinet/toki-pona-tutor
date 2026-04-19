import { lazy, Suspense } from 'react';
import { X } from 'lucide-react';

const PhaserGame = lazy(() =>
  import('../game/PhaserGame').then((m) => ({ default: m.PhaserGame }))
);
const SolidDialogMount = lazy(() =>
  import('../game/SolidMount').then((m) => ({ default: m.SolidDialogMount }))
);

interface AdventureViewProps {
  onExit: () => void;
}

export function AdventureView({ onExit }: AdventureViewProps) {
  return (
    <div className="flex flex-col h-full min-h-0 relative">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <button
          onClick={onExit}
          className="p-1.5 bg-white/90 hover:bg-white rounded-xl text-orange-700 shadow-md"
          aria-label="Exit adventure"
        >
          <X size={20} strokeWidth={3} />
        </button>
        <h2 className="font-display text-xl text-white drop-shadow-[0_2px_0_rgba(234,88,12,0.85)]">
          TOKI TOWN
        </h2>
        <div className="flex-1" />
        <div className="font-pixel text-[10px] text-white/80 uppercase">
          Arrows · E to talk
        </div>
      </div>
      <div className="flex-1 min-h-0 relative bg-black rounded-2xl overflow-hidden shadow-xl border-2 border-white/40">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-white font-display text-xl">
              Loading Toki Town…
            </div>
          }
        >
          <PhaserGame />
          <SolidDialogMount />
        </Suspense>
      </div>
    </div>
  );
}
