import { lazy, Suspense, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gameBus } from '../game/GameBus';

const PhaserGame = lazy(() =>
  import('../game/PhaserGame').then((m) => ({ default: m.PhaserGame }))
);
const SolidDialogMount = lazy(() =>
  import('../game/SolidMount').then((m) => ({ default: m.SolidDialogMount }))
);

interface AdventureViewProps {
  onExit: () => void;
}

// Synthetic key dispatch so the Phaser scene's keyboard plugin picks these up
// identically to real keypresses — no new event API in VillageScene.
function dispatchKey(type: 'keydown' | 'keyup', code: string, key: string, keyCode: number) {
  document.dispatchEvent(new KeyboardEvent(type, { code, key, keyCode, bubbles: true }));
}

function DpadButton({
  label,
  code,
  keyName,
  keyCode,
  className = '',
}: {
  label: string;
  code: string;
  keyName: string;
  keyCode: number;
  className?: string;
}) {
  const pressed = useRef(false);
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    if (pressed.current) return;
    pressed.current = true;
    dispatchKey('keydown', code, keyName, keyCode);
  };
  const up = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!pressed.current) return;
    pressed.current = false;
    dispatchKey('keyup', code, keyName, keyCode);
  };
  return (
    <button
      type="button"
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      aria-label={label}
      className={`w-12 h-12 rounded-xl bg-white/90 text-slate-800 font-display text-xl shadow-lg border-b-[4px] border-slate-400 active:border-b-0 active:translate-y-[4px] transition-all select-none touch-none ${className}`}
    >
      {label}
    </button>
  );
}

export function AdventureView({ onExit }: AdventureViewProps) {
  // Release any held keys on unmount so nothing stays stuck.
  useEffect(() => {
    return () => {
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].forEach((k) => {
        dispatchKey('keyup', k, k, 0);
      });
    };
  }, []);

  const interact = () => {
    dispatchKey('keydown', 'KeyE', 'e', 69);
    setTimeout(() => dispatchKey('keyup', 'KeyE', 'e', 69), 60);
    gameBus.emit('dialog:close', undefined);
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <button
          onClick={onExit}
          className="p-1.5 bg-white/90 hover:bg-white rounded-xl text-orange-700 shadow-md"
          aria-label="Exit adventure"
        >
          <X size={20} strokeWidth={3} />
        </button>
        <h2 className="font-display text-xl sm:text-2xl text-white drop-shadow-[0_2px_0_rgba(234,88,12,0.85)]">
          TOKI TOWN
        </h2>
        <div className="flex-1" />
        <div className="hidden sm:block font-pixel text-[10px] text-white/80 uppercase">
          Arrows / WASD · E to talk
        </div>
      </div>

      {/* Game viewport */}
      <div className="flex-1 min-h-0 relative bg-[#2a1810] rounded-2xl overflow-hidden shadow-xl border-2 border-white/40">
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

        {/* Mobile on-screen controls — shown on touch devices / small viewports */}
        <div className="sm:hidden absolute bottom-3 left-3 grid grid-cols-3 gap-1 z-20">
          <div />
          <DpadButton label="↑" code="ArrowUp" keyName="ArrowUp" keyCode={38} />
          <div />
          <DpadButton label="←" code="ArrowLeft" keyName="ArrowLeft" keyCode={37} />
          <div className="w-12 h-12" />
          <DpadButton label="→" code="ArrowRight" keyName="ArrowRight" keyCode={39} />
          <div />
          <DpadButton label="↓" code="ArrowDown" keyName="ArrowDown" keyCode={40} />
          <div />
        </div>
        <button
          type="button"
          onClick={interact}
          aria-label="Interact"
          className="sm:hidden absolute bottom-5 right-5 w-16 h-16 rounded-full bg-gradient-to-b from-lime-400 to-green-500 text-white font-display text-2xl shadow-xl border-b-[6px] border-green-700 active:border-b-0 active:translate-y-[6px] transition-all z-20 touch-none select-none"
        >
          E
        </button>
      </div>
    </div>
  );
}
