import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Build-time toolchain tests run in Node (renderer needs node-canvas, parsers
    // read real filesystem). Runtime game tests will live elsewhere under a
    // separate config once the Vitest browser harness lands (see docs/TESTING.md).
    include: ['tests/build-time/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      // T9-04 coverage gate. Enabled only when CLI passes --coverage;
      // otherwise a no-op so local `pnpm test` stays fast. CI runs
      // `pnpm test -- --coverage` in a dedicated step.
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'lcov'],
      // Scope the coverage report to pure-logic game modules. Exclude
      // platform adapters (SQLite/Capacitor — covered by integration
      // tests, not unit tests) + RPG.js boot entry points + runtime
      // wiring that's exercised only through the browser harness.
      include: [
        'src/modules/main/catch-math.ts',
        'src/modules/main/type-matchup.ts',
        'src/modules/main/xp-curve.ts',
        'src/modules/main/status-effect.ts',
        'src/modules/main/ambient-events.ts',
        'src/modules/main/quest.ts',
        'src/modules/main/daycare.ts',
        'src/modules/main/new-game-plus.ts',
        'src/modules/main/sentence-log.ts',
        'src/modules/main/micro-game.ts',
        'src/modules/main/dictionary-export.ts',
        'src/modules/main/treasure-chest.ts',
        'src/modules/main/audio.ts',
        'src/modules/main/virtual-dpad.ts',
        'src/modules/main/rematch.ts',
        'src/styles/brand-preferences.ts',
        'src/platform/persistence/settings.ts',
      ],
      // T9-04 dual-threshold ratchet (mirrors T6-13 bundle-size pattern:
      // soft gate = current reality, hard goal = what we want to enforce).
      //   - Soft gate = 95% lines (actual: ~97.7% at branch time).
      //   - Goal = 98% once the remaining uncovered branches in
      //     content.ts / dialog.ts helper paths land tests.
      // The include list above is already scoped to pure-logic modules
      // that SHOULD be at or above the gate. Ratchet up as coverage improves.
      // Every commit that drops below the soft gate must ship new
      // tests with the feature.
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
