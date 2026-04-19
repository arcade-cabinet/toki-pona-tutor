import { lazy, Suspense, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AdventureHUD } from './AdventureHUD';
import { AmbientParticles } from './AmbientParticles';
import { AdventureAudio } from './AdventureAudio';
import { MobileControls } from './MobileControls';

const PhaserGame = lazy(() =>
  import('../game/PhaserGame').then((m) => ({ default: m.PhaserGame }))
);
const SolidDialogMount = lazy(() =>
  import('../game/SolidMount').then((m) => ({ default: m.SolidDialogMount }))
);

interface AdventureViewProps {
  onExit: () => void;
}

function dispatchKey(type: 'keydown' | 'keyup', code: string, key: string, keyCode: number) {
  document.dispatchEvent(new KeyboardEvent(type, { code, key, keyCode, bubbles: true }));
}

export function AdventureView({ onExit }: AdventureViewProps) {
  useEffect(() => {
    return () => {
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].forEach((k) => {
        dispatchKey('keyup', k, k, 0);
      });
    };
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 relative p-0">
      {/* Game viewport fills all available space — no bezel, no headbar */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-amber-100 font-display text-xl bg-emerald-800">
              Loading Toki Town…
            </div>
          }
        >
          <SolidDialogMount />
          <PhaserGame />
          <AmbientParticles />
        </Suspense>

        {/* Subtle back button, parchment disc */}
        <button
          onClick={onExit}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-amber-50/95 text-emerald-900 shadow-md flex items-center justify-center active:scale-95 transition-transform z-30"
          aria-label="Return to menu"
        >
          <ArrowLeft size={18} strokeWidth={3} />
        </button>

        {/* Quest HUD — parchment strip up top showing current objective */}
        <AdventureHUD />

        <MobileControls />
        <AdventureAudio />
      </div>
    </div>
  );
}
