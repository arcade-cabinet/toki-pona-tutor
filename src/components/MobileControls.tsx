import { useEffect, useRef } from 'react';
import { gameBus } from '../game/GameBus';

/**
 * Touch-friendly virtual d-pad + action button. Dispatches synthetic keyboard
 * events to document so Phaser's input pipeline picks them up without
 * modification. Visible on any coarse-pointer device or narrow viewport
 * (driven by the `.mobile-controls` CSS media query).
 */

type KeyDef = { code: string; key: string; keyCode: number };

const KEYS: Record<string, KeyDef> = {
  up: { code: 'ArrowUp', key: 'ArrowUp', keyCode: 38 },
  down: { code: 'ArrowDown', key: 'ArrowDown', keyCode: 40 },
  left: { code: 'ArrowLeft', key: 'ArrowLeft', keyCode: 37 },
  right: { code: 'ArrowRight', key: 'ArrowRight', keyCode: 39 },
  e: { code: 'KeyE', key: 'e', keyCode: 69 },
};

function dispatchKey(type: 'keydown' | 'keyup', d: KeyDef) {
  document.dispatchEvent(
    new KeyboardEvent(type, { code: d.code, key: d.key, keyCode: d.keyCode, bubbles: true }),
  );
}

function DpadButton({ label, dir }: { label: string; dir: 'up' | 'down' | 'left' | 'right' }) {
  const pressed = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    if (pressed.current) return;
    pressed.current = true;
    btnRef.current?.classList.add('pressed');
    btnRef.current?.setPointerCapture?.(e.pointerId);
    dispatchKey('keydown', KEYS[dir]);
  };
  const up = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!pressed.current) return;
    pressed.current = false;
    btnRef.current?.classList.remove('pressed');
    try {
      btnRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    dispatchKey('keyup', KEYS[dir]);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      aria-label={`Move ${dir}`}
      className="dpad-btn"
    >
      {label}
    </button>
  );
}

function ActionButton() {
  const tap = (e: React.PointerEvent) => {
    e.preventDefault();
    dispatchKey('keydown', KEYS.e);
    window.setTimeout(() => dispatchKey('keyup', KEYS.e), 80);
    // Also close dialog if it's open — legacy behavior from AdventureView.
    gameBus.emit('dialog:close', undefined);
  };

  return (
    <button
      type="button"
      onPointerDown={tap}
      aria-label="Talk or pick up"
      className="action-btn"
    >
      Toki
      <br />
      <span style={{ fontSize: '10px', opacity: 0.8 }}>Talk</span>
    </button>
  );
}

export function MobileControls() {
  // Prevent page scroll/zoom on the game area via a full-time listener —
  // some mobile browsers still drag on touch even with touch-none.
  useEffect(() => {
    const block = (e: TouchEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (tgt?.closest('.mobile-controls')) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', block, { passive: false });
    return () => document.removeEventListener('touchmove', block);
  }, []);

  return (
    <>
      {/* Left side — d-pad */}
      <div
        className="mobile-controls absolute bottom-4 left-4 z-20"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          touchAction: 'none',
        }}
      >
        <div />
        <DpadButton label="↑" dir="up" />
        <div />
        <DpadButton label="←" dir="left" />
        <div />
        <DpadButton label="→" dir="right" />
        <div />
        <DpadButton label="↓" dir="down" />
        <div />
      </div>

      {/* Right side — primary action */}
      <div
        className="mobile-controls absolute bottom-6 right-6 z-20"
        style={{ gridTemplateColumns: '1fr', touchAction: 'none' }}
      >
        <ActionButton />
      </div>
    </>
  );
}
