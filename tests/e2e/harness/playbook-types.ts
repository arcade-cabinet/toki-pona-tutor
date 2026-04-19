/**
 * Playbook step discriminated union.
 *
 * A playbook is an ordered list of steps the harness replays through the
 * real Phaser game in a Vitest browser test. Each step has a `kind`
 * discriminator that the replayer dispatches on. New step kinds are added
 * here first; the replayer in `phaser-harness.ts` then grows a matching
 * case.
 *
 * Authoring the union shape correctly matters more than completeness — it
 * is the contract every L3+ test layer extends. Keep the discriminator
 * names stable; add new kinds rather than mutating existing ones.
 */

/** A tile coordinate in the active map's tile-grid (column, row). */
export interface Tile {
  x: number;
  y: number;
}

/**
 * Walk the player to a target tile. The replayer is responsible for
 * finding a path (or refusing if none exists) and stepping the player
 * one tile at a time, waiting between steps for movement to settle.
 */
export interface WalkToStep {
  kind: 'walk_to';
  tile: Tile;
  /** Optional human label for screenshots / failure messages. */
  label?: string;
}

/**
 * Press the in-game interact button (E / Space). Triggers nearest NPC
 * dialog, sign, or warp depending on what the player is adjacent to.
 */
export interface InteractStep {
  kind: 'interact';
  label?: string;
}

/**
 * Block until a Solid dialog overlay is open. Times out after `timeoutMs`
 * (default 2000) — a missing dialog is a test failure, not a hang.
 */
export interface WaitForDialogStep {
  kind: 'wait_for_dialog';
  timeoutMs?: number;
}

/**
 * Choose a dialog option. The replayer asserts the dialog is open + has
 * the named option; missing option is a test failure with the actual
 * options listed.
 */
export interface DialogChooseStep {
  kind: 'dialog_choose';
  /** Either the option's index in the current dialog, or its visible label. */
  option: number | string;
}

/**
 * Capture a named screenshot under tests/e2e/__screenshots__/. The
 * filename embeds test-name + step-name + timestamp — see
 * `harness/screenshot.ts` for the convention.
 */
export interface ScreenshotStep {
  kind: 'screenshot';
  name: string;
}

/** All known playbook step kinds. Extend by adding new variants here. */
export type PlaybookStep =
  | WalkToStep
  | InteractStep
  | WaitForDialogStep
  | DialogChooseStep
  | ScreenshotStep;

/** A complete replayable scenario. */
export interface Playbook {
  /** Identifier used in screenshot filenames + failure messages. */
  name: string;
  steps: PlaybookStep[];
}
