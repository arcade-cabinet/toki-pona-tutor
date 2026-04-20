/**
 * Player — Fan-tasy Main Character sprite, 32×32 frames.
 *
 * Adapted from `remarkablegames/phaser-rpg`'s Player class and
 * modernized for Phaser 4 + Fan-tasy's spritesheet layout.
 *
 * Spritesheet layout (Idle/Walk PNGs are 160×192 = 5 cols × 6 rows of
 * 32×32 frames). Rows are direction-major:
 *
 *   row 0 → walk-down  (frames 0..4)
 *   row 1 → walk-up    (frames 5..9)
 *   row 2 → walk-left  (frames 10..14)
 *   row 3 → walk-right (frames 15..19)
 *   row 4 → walk-down-alt (idle wobble row, unused for now)
 *   row 5 → reserved
 *
 * Idle frames live at the same positions in `player-idle`; we use
 * frame 0 of each direction-row as the standing pose.
 *
 * The selector body is a 16×16 invisible static rectangle sitting one
 * tile in front of the player — it's what `physics.add.overlap` checks
 * against signs / NPCs / triggers. Reference repo proven pattern.
 */
import * as Phaser from 'phaser';

import { key } from '../constants';

export const PLAYER_FRAME_SIZE = 32;
const COLS = 5;
const FRAME_DOWN = 0 * COLS;
const FRAME_UP = 1 * COLS;
const FRAME_LEFT = 2 * COLS;
const FRAME_RIGHT = 3 * COLS;

enum Animation {
  Down = 'player-walk-down',
  Up = 'player-walk-up',
  Left = 'player-walk-left',
  Right = 'player-walk-right',
}

type Cursors = Record<
  'w' | 'a' | 's' | 'd' | 'up' | 'left' | 'down' | 'right' | 'space',
  Phaser.Input.Keyboard.Key
>;

const VELOCITY = 110;

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  cursors: Cursors;
  selector: Phaser.Physics.Arcade.StaticBody;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, key.spritesheet.playerIdle, FRAME_DOWN);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    // Trim the physics body to the lower half of the sprite so the player's
    // "feet" determine collision — matches Tiled's bottom-anchored object
    // convention and keeps headroom under "Above Player" canopies.
    this.setSize(16, 16).setOffset(8, 16);
    this.setCollideWorldBounds(true);
    this.setDepth(5);

    scene.cameras.main.startFollow(this, true);
    scene.cameras.main.setZoom(2);

    this.cursors = scene.input.keyboard!.addKeys(
      'w,a,s,d,up,left,down,right,space',
    ) as Cursors;

    this.createAnimations();

    // Selector: an invisible 16×16 static body one tile in front of the
    // player. Used for sign / NPC overlap checks (wired by Main scene).
    this.selector = scene.physics.add.staticBody(x - 8, y + 8, 16, 16);
  }

  private createAnimations(): void {
    const { anims } = this.scene;
    const sheet = key.spritesheet.playerWalk;
    const def = (k: Animation, start: number) => {
      if (anims.exists(k)) return;
      anims.create({
        key: k,
        frames: anims.generateFrameNumbers(sheet, { start, end: start + COLS - 1 }),
        frameRate: 8,
        repeat: -1,
      });
    };
    def(Animation.Down, FRAME_DOWN);
    def(Animation.Up, FRAME_UP);
    def(Animation.Left, FRAME_LEFT);
    def(Animation.Right, FRAME_RIGHT);
  }

  /** Reposition the selector to face the direction the player just moved. */
  private moveSelector(animation: Animation): void {
    const { body, selector } = this;
    switch (animation) {
      case Animation.Left:
        selector.x = body.x - 8;
        selector.y = body.y + 8;
        break;
      case Animation.Right:
        selector.x = body.x + 16;
        selector.y = body.y + 8;
        break;
      case Animation.Up:
        selector.x = body.x;
        selector.y = body.y - 8;
        break;
      case Animation.Down:
        selector.x = body.x;
        selector.y = body.y + 16;
        break;
    }
  }

  update(): void {
    const { anims, body, cursors } = this;
    const prev = body.velocity.clone();
    body.setVelocity(0);

    if (cursors.left.isDown || cursors.a.isDown) body.setVelocityX(-VELOCITY);
    else if (cursors.right.isDown || cursors.d.isDown) body.setVelocityX(VELOCITY);

    if (cursors.up.isDown || cursors.w.isDown) body.setVelocityY(-VELOCITY);
    else if (cursors.down.isDown || cursors.s.isDown) body.setVelocityY(VELOCITY);

    // Normalize so diagonals don't outrun cardinal movement.
    body.velocity.normalize().scale(VELOCITY);

    // Pick an animation. Horizontal wins over vertical when both are held —
    // a small ergonomic choice that matches the reference template.
    if (cursors.left.isDown || cursors.a.isDown) {
      anims.play(Animation.Left, true);
      this.moveSelector(Animation.Left);
    } else if (cursors.right.isDown || cursors.d.isDown) {
      anims.play(Animation.Right, true);
      this.moveSelector(Animation.Right);
    } else if (cursors.up.isDown || cursors.w.isDown) {
      anims.play(Animation.Up, true);
      this.moveSelector(Animation.Up);
    } else if (cursors.down.isDown || cursors.s.isDown) {
      anims.play(Animation.Down, true);
      this.moveSelector(Animation.Down);
    } else {
      anims.stop();
      // Standing still: pick an idle frame matching last-known facing so the
      // sprite doesn't snap back to "facing down" the moment the key releases.
      if (prev.x < 0) {
        this.setTexture(key.spritesheet.playerIdle, FRAME_LEFT);
        this.moveSelector(Animation.Left);
      } else if (prev.x > 0) {
        this.setTexture(key.spritesheet.playerIdle, FRAME_RIGHT);
        this.moveSelector(Animation.Right);
      } else if (prev.y < 0) {
        this.setTexture(key.spritesheet.playerIdle, FRAME_UP);
        this.moveSelector(Animation.Up);
      } else if (prev.y > 0) {
        this.setTexture(key.spritesheet.playerIdle, FRAME_DOWN);
        this.moveSelector(Animation.Down);
      }
    }
  }
}
