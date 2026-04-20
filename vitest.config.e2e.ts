import { defineConfig, mergeConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import viteConfig from './vite.config';

/**
 * Vitest browser config for end-to-end game tests.
 *
 * Boots the real Vite dev pipeline (so React + Solid plugins, the Phaser
 * canvas, and `import.meta.env.DEV` all behave exactly like
 * `pnpm dev`) inside Playwright-driven Chromium. Tests under
 * `tests/e2e/` drive the game through `window.__toki_harness__` and
 * capture screenshots into `tests/e2e/__screenshots__/`.
 *
 * Build-time / Node-mode tests live in a separate config —
 * `vitest.config.build-time.ts` — so the two pipelines never share
 * runner state.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['tests/e2e/**/*.test.ts'],
      // Each test file gets a fresh page; harness state lives on
      // window.__toki_harness__, so isolation must be per-file.
      isolate: true,
      testTimeout: 30_000,
      hookTimeout: 30_000,
      // Browser mode owns the runtime environment — explicitly opt out
      // of any Node test-environment so Vitest's auto-installer doesn't
      // probe for jsdom when the e2e config is loaded.
      environment: 'node',
      browser: {
        enabled: true,
        provider: playwright(),
        // Headless by default; flip when debugging locally with
        // `HEADED=1 pnpm test:e2e`.
        headless: process.env.HEADED !== '1',
        instances: [{ browser: 'chromium' }],
        screenshotDirectory: 'tests/e2e/__screenshots__',
      },
    },
  }),
);
