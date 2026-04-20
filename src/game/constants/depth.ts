/**
 * Phaser scene depth constants.
 *
 * Phaser draws game objects in creation order by default; explicit
 * depths override that. The Tiled "Above Player" tile layer must sit on
 * top of the player so roof / canopy tiles obscure the sprite as it
 * walks under them.
 */
export enum Depth {
  /** The player sprite — sits above ground tile layers, below
   *  Above-Player tiles. Picking 5 leaves headroom for NPCs / item
   *  drops between the floor and the player without re-numbering. */
  Player = 5,
  /** Anything above the player (roofs, awnings, tree canopies). */
  AbovePlayer = 10,
  /** UI / debug overlays drawn above all gameplay content. */
  AboveWorld = 20,
}
