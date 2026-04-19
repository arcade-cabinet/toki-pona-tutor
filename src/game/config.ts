import * as Phaser from 'phaser';
import { VillageScene } from './scenes/VillageScene';

export function createGame(parent: HTMLDivElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    pixelArt: true,
    backgroundColor: '#7bb65a',
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
