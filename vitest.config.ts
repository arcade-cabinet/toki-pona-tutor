import { defineConfig } from 'vitest/config';

/**
 * One vitest config, two projects:
 *
 *   unit         — pure-logic modules under tests/build-time/ (node env).
 *                  Fast, no engine, no DOM.
 *   integration  — @rpgjs/testing fixture — real RPG.js server + client
 *                  in one Node process (happy-dom). Drives `onConnected`,
 *                  `onAction`, `onInShape`, maps, flags, party state.
 *                  Fast (~1s per test), no browser.
 *
 * Real-browser coverage lives separately under tests/e2e/ driven by
 * Playwright with a webServer running `pnpm dev`. That's where
 * jeep-sqlite, Pixi canvas, brand.css, and player input actually run.
 *
 * Scripts:
 *   pnpm test                    — both vitest projects
 *   pnpm test:unit               — fast pure-logic suite
 *   pnpm test:integration        — engine-level wiring
 *   pnpm test:e2e                — real browser (separate runner)
 *   pnpm test:coverage           — coverage gate on unit project
 */
export default defineConfig({
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    include: ['tests/build-time/**/*.test.ts'],
                    environment: 'node',
                    testTimeout: 30_000,
                    hookTimeout: 30_000,
                },
            },
            {
                extends: true,
                test: {
                    name: 'integration',
                    include: ['tests/integration/**/*.test.ts'],
                    environment: 'happy-dom',
                    setupFiles: ['@rpgjs/testing/dist/setup.js'],
                    testTimeout: 30_000,
                    hookTimeout: 30_000,
                    // RPG.js engine uses module-level singletons that
                    // don't like parallel test files stomping each other.
                    fileParallelism: false,
                },
            },
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'json-summary', 'lcov'],
            // Coverage is measured on pure-logic modules only. Runtime
            // wiring, platform adapters, and RPG.js boot code are
            // exercised by integration + E2E, not by the coverage gate.
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
                'src/modules/main/sfx.ts',
                'src/modules/main/rematch.ts',
                'src/modules/main/victory-sequence.ts',
                'src/modules/main/bestiary.ts',
                'src/modules/main/party-order.ts',
                'src/styles/brand-preferences.ts',
                'src/styles/hp-bar.ts',
                'src/styles/sitelen-glyph.ts',
                'src/platform/persistence/settings.ts',
            ],
            thresholds: {
                lines: 95,
                functions: 95,
                branches: 90,
                statements: 95,
            },
        },
    },
});
