import type * as Phaser from 'phaser';

/**
 * Dev-only inspector exposed at `window.__toki_harness__`.
 *
 * The Vitest browser harness reads live Phaser scene state through this
 * surface instead of DOM-scraping the canvas. Tests query `ready` to know
 * when boot finished, then snapshot `player()` / `mapId()` / `dialogOpen()`
 * between playbook steps.
 *
 * The whole object is gated behind `import.meta.env.DEV` in
 * `installHarness()` — production bundles never include the inspector
 * surface, so there is zero exposure in the shipped game.
 *
 * L1 (foundation) is responsible for populating live scene values.
 * Until L1 lands the getters return placeholder `null` values; tests that
 * depend on real values are marked `it.todo` for now.
 */
export interface TokiHarness {
  /** True once the active scene has finished `create()` and is rendering. */
  ready: boolean;
  /** Active Phaser.Scene, or null if nothing has booted. */
  scene: () => Phaser.Scene | null;
  /** Current player tile + pixel position, or null pre-boot. */
  player: () => { tile: { x: number; y: number }; px: { x: number; y: number } } | null;
  /** Current map / region id, or null pre-boot. */
  mapId: () => string | null;
  /** True when a Solid dialog overlay is open and player input is locked. */
  dialogOpen: () => boolean;
}

declare global {
  interface Window {
    __toki_harness__?: TokiHarness;
  }
}

/**
 * Install the harness inspector on `window.__toki_harness__`. No-op in
 * production builds. Safe to call multiple times — re-installs replace the
 * previous surface (so HMR / game restart works).
 *
 * The `getScene` callback is invoked lazily on every getter call so the
 * harness always reflects the current active scene rather than a stale
 * reference captured at install time.
 */
export function installHarness(getScene: () => Phaser.Scene | null): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;

  const harness: TokiHarness = {
    ready: false,
    scene: getScene,
    player: () => {
      const scene = getScene();
      if (!scene) return null;
      // Player surface — L1 will wire `scene.harnessPlayer` (or similar)
      // when the foundation lands. Until then expose null.
      const sceneAny = scene as unknown as {
        harnessPlayer?: () => { tile: { x: number; y: number }; px: { x: number; y: number } } | null;
      };
      return sceneAny.harnessPlayer?.() ?? null;
    },
    mapId: () => {
      const scene = getScene();
      if (!scene) return null;
      const sceneAny = scene as unknown as { harnessMapId?: () => string | null };
      return sceneAny.harnessMapId?.() ?? null;
    },
    dialogOpen: () => {
      const scene = getScene();
      if (!scene) return false;
      const sceneAny = scene as unknown as { harnessDialogOpen?: () => boolean };
      return sceneAny.harnessDialogOpen?.() ?? false;
    },
  };

  window.__toki_harness__ = harness;
}

/**
 * Mark the harness as ready / not-ready. L1 calls this from the active
 * scene's `create()` (true) and `shutdown()` (false). Until L1 wires it,
 * `PhaserGame.tsx` flips it to true once the Phaser.Game booted (a weaker
 * signal than scene-ready, but enough to prove the harness is alive).
 */
export function setHarnessReady(ready: boolean): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  if (!window.__toki_harness__) return;
  window.__toki_harness__.ready = ready;
}

/** Tear down the inspector surface. Used on game destroy / unmount. */
export function uninstallHarness(): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  delete window.__toki_harness__;
}
