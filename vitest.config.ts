import { defineConfig } from 'vitest/config';

/**
 * One config, two projects — vitest's native separation.
 *
 *   unit         — pure-logic modules under tests/build-time/ (node env)
 *   integration  — real RPG.js engine via @rpgjs/testing in standalone
 *                  mode (happy-dom env, singletons so no file parallelism)
 *
 * Run with:
 *   pnpm test                    — both projects
 *   pnpm test --project=unit     — just the fast suite
 *   pnpm test --project=integration
 *   pnpm test --coverage         — coverage on the unit project only
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
                    // RPG.js singletons don't like parallel test files.
                    fileParallelism: false,
                },
            },
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'json-summary', 'lcov'],
            // Scope coverage to pure-logic modules — platform adapters
            // and RPG.js boot wiring are exercised by the integration
            // project, not coverage-measured here.
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
                'src/modules/main/virtual-dpad.ts',
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
