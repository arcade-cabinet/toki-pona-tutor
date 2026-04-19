import * as Phaser from 'phaser';
import { VillageScene } from './scenes/VillageScene';

export function createGame(parent: HTMLDivElement): Phaser.Game {
  // FIT mode scales a fixed internal resolution to the parent div instead of
  // re-initializing the GL context on every viewport change. On foldable
  // Android devices the URL bar / soft keyboard / fold events were triggering
  // the old Scale.RESIZE path and sometimes losing the WebGL context on key
  // press — leaving a white canvas. FIT keeps the internal framebuffer size
  // stable, so the context survives arbitrary window resizes.
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    pixelArt: true,
    backgroundColor: '#8bc260',
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
    scene: [VillageScene],
  });
}
