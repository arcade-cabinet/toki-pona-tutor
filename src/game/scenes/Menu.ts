/**
 * Menu scene — the in-game pause overlay.
 *
 * Launched on ESC from Main; resumes Main and stops itself on ESC.
 * Renders directly with Phaser Text rather than going through the
 * Solid mount because this is the safety-net "you pressed pause"
 * affordance that must work even when other UI fails to mount.
 */
import * as Phaser from 'phaser';

import { Depth, key } from '../constants';

export class Menu extends Phaser.Scene {
  constructor() {
    super(key.scene.menu);
  }

  create(): void {
    const { centerX, centerY, width, height } = this.cameras.main;
    this.add
      .rectangle(centerX, centerY, width, height, 0x000000, 0.55)
      .setScrollFactor(0)
      .setDepth(Depth.AboveWorld);
    this.add
      .text(centerX, centerY, 'pause\n\npress ESC to resume', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Depth.AboveWorld + 1);

    this.input.keyboard?.on('keydown-ESC', this.exit, this);
  }

  private exit(): void {
    this.scene.resume(key.scene.main);
    this.scene.stop();
  }
}
