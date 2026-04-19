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

    // Push layout size into Phaser on any container size change — the
    // game's outer flex container may resize even when window doesn't.
    const ro = new ResizeObserver(() => {
      const g = gameRef.current;
      if (!g) return;
      g.scale.resize(container.clientWidth, container.clientHeight);
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
