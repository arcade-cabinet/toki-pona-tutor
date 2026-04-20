/**
 * Phaser scene depth constants.
 *
 * Phaser draws game objects in creation order by default; explicit
 * depths override that. The Tiled "Above Player" tile layer must sit on
 * top of the player so roof / canopy tiles obscure the sprite as it
 * walks under them.
 */
export enum Depth {
  /** Anything above the player (roofs, awnings, tree canopies). */
  AbovePlayer = 10,
  /** UI / debug overlays drawn above all gameplay content. */
  AboveWorld = 20,
}
