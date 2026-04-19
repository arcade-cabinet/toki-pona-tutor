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
  },
});
