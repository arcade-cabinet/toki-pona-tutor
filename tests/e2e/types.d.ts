/**
 * Pulls the `window.__POKI__` global declaration into the E2E test
 * compilation context. Without this import Playwright's tsconfig
 * would reject `window.__POKI__` references with TS2339, forcing
 * verbose `as unknown as { __POKI__: ... }` casts in every test.
 *
 * Re-exporting nothing preserves the ambient-module shape.
 */
/// <reference path="../../src/types/poki-debug.d.ts" />

export {};
