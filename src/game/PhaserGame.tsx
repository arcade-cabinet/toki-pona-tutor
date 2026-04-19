import { useEffect, useRef } from 'react';
import type * as Phaser from 'phaser';
import { createGame } from './config';

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;
    const container = containerRef.current;
    gameRef.current = createGame(container);

    // WebGL context-loss recovery. Browsers (especially mobile + foldables)
    // sometimes drop the GL context under memory pressure / device-state
    // changes. Without handlers the canvas stays blank-white forever. We
    // preventDefault on 'webglcontextlost' so the context is restorable, then
    // tear down + rebuild Phaser on 'webglcontextrestored'.
    const attachGlHandlers = () => {
      const canvas = gameRef.current?.canvas;
      if (!canvas) return;
      canvas.addEventListener('webglcontextlost', (ev) => {
        ev.preventDefault();
        console.warn('[phaser] WebGL context lost — waiting for restore');
      });
      canvas.addEventListener('webglcontextrestored', () => {
        console.warn('[phaser] WebGL context restored — rebuilding');
        gameRef.current?.destroy(true);
        gameRef.current = container ? createGame(container) : null;
        attachGlHandlers();
      });
    };
    attachGlHandlers();

    // Push layout size into Phaser on any container size change — the
    // game's outer flex container may resize even when window doesn't.
    // Debounced so foldable URL-bar / soft-keyboard resize storms don't
    // thrash the GL context (which caused the canvas to go white on some
    // Android GPUs).
    let rafId = 0;
    let lastW = container.clientWidth;
    let lastH = container.clientHeight;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const g = gameRef.current;
        if (!g) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        // Skip tiny single-pixel flickers that can fire on mobile during
        // scroll / URL bar animations.
        if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return;
        lastW = w;
        lastH = h;
        g.scale.resize(w, h);
      });
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: 'none', backgroundColor: '#8bc260' }}
    />
  );
}
