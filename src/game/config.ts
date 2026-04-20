/**
 * Phaser game factory.
 *
 * Boot → Main → Menu scene chain. Boot preloads, Main runs the
 * overworld loop, Menu is launched on ESC for pause.
 *
 * RESIZE mode lets the canvas track the parent div's size; the WebGL
 * context-loss recovery path lives in PhaserGame.tsx, which debounces
 * ResizeObserver storms so foldable / soft-keyboard resize events
 * don't churn the GL context.
 */
import * as Phaser from 'phaser';

import { Boot } from './scenes/Boot';
import { Main } from './scenes/Main';
import { Menu } from './scenes/Menu';

/**
 * Single source of truth for the canvas / parent container background.
 * Both Phaser's GL clear color and the React container `style.background`
 * read from here so a resize that exposes the parent for a frame doesn't
 * flash a different color than Phaser's own clear.
 */
export const GAME_BACKGROUND = '#1b3e2f';

export function createGame(parent: HTMLDivElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    pixelArt: true,
    backgroundColor: GAME_BACKGROUND,
    // preserveDrawingBuffer is required so headless screenshot tools (and
    // canvas.toDataURL) can capture the WebGL backbuffer. Tiny perf cost,
    // huge debugging upside — worth it on a foundation slice. Revisit if
    // we hit FPS issues on Android low-end devices.
    render: { preserveDrawingBuffer: true },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: parent.clientWidth || 480,
      height: parent.clientHeight || 320,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    input: {
      activePointers: 2,
    },
    scene: [Boot, Main, Menu],
  });
}
