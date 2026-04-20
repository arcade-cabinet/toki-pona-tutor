import * as Phaser from 'phaser';

/**
 * Phaser game factory.
 *
 * The legacy `RegionScene` (which painted hand-authored region JSON tile
 * arrays) has been removed alongside the region schema. The L4 worker will
 * land a Tiled-driven scene that loads maps from
 * `public/assets/maps/<map_id>.tmj` keyed by `world.journey.beats[N].map_id`.
 * Until then this factory boots a placeholder scene so the engine stays
 * compilable and the dev shell can mount.
 */
class PlaceholderScene extends Phaser.Scene {
  constructor() {
    super('PlaceholderScene');
  }
  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(
        width / 2,
        height / 2,
        'awaiting L4 — Tiled-driven scene',
        { fontFamily: 'monospace', fontSize: '14px', color: '#fef3c7' },
      )
      .setOrigin(0.5);
  }
}

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
    scene: [PlaceholderScene],
  });
}
