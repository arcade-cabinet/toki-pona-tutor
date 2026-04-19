import { lazy, Suspense, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { gameBus } from '../game/GameBus';
import { AdventureHUD } from './AdventureHUD';

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

function DpadButton({
  label,
  code,
  keyName,
  keyCode,
}: {
  label: string;
  code: string;
  keyName: string;
  keyCode: number;
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
      className="w-12 h-12 rounded-2xl bg-amber-50/95 text-emerald-900 font-display text-xl shadow-[0_3px_0_rgba(120,53,15,0.35)] active:shadow-none active:translate-y-[3px] transition-all select-none touch-none"
    >
      {label}
    </button>
  );
}

export function AdventureView({ onExit }: AdventureViewProps) {
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
          <PhaserGame />
          <SolidDialogMount />
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

        {/* Mobile controls */}
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
          aria-label="Talk / Pick up"
          className="sm:hidden absolute bottom-5 right-5 w-16 h-16 rounded-full bg-amber-50 text-emerald-900 font-display text-lg shadow-[0_4px_0_rgba(120,53,15,0.4)] active:shadow-none active:translate-y-[4px] transition-all z-20 touch-none select-none"
        >
          TALK
        </button>
      </div>
    </div>
  );
}
