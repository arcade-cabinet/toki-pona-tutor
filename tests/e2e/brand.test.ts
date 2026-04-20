import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { applyBrandClasses } from '../../src/styles/brand-preferences';

/**
 * Brand-wiring E2E — verifies the BRAND.md → brand.css pipeline
 * actually lands in a real browser. Unit tests lock the pure class-
 * derivation logic in brand-preferences.ts; this suite is the
 * browser-only complement, catching regressions like:
 *
 *   - brand.css dropped from the import graph
 *   - --poki-* custom properties failing to evaluate at :root
 *   - applyBrandClasses mis-targeting the document in a real browser
 *   - @rpgjs/ui-css tokens winning over our overrides (specificity bug)
 *
 * Design note: we import brand.css directly rather than booting the
 * full game. RPG.js v5 beta's tiledmap parser has known rough edges
 * at test-runner boot time (see foundation.test.ts it.todo list),
 * and brand.css loads at import evaluation — not at canvas mount —
 * so the boot-the-whole-thing path would trade flake for signal
 * we don't need. Full boot is foundation.test.ts's job.
 *
 * These assertions use getComputedStyle against NAMED tokens, not
 * raw hex values, so tweaking the palette in brand.css doesn't
 * force a test rewrite — adding a NEW named token does, which is
 * the correct coupling.
 */

beforeAll(async () => {
    // Pull in brand.css via its import chain. standalone.ts imports
    // @rpgjs/ui-css + brand.css in the right order; we replicate the
    // relevant subset here so :root custom properties are populated.
    await import('@rpgjs/ui-css/reset.css');
    await import('@rpgjs/ui-css/tokens.css');
    await import('@rpgjs/ui-css/index.css');
    await import('@rpgjs/ui-css/theme-default.css');
    await import('../../src/styles/brand.css');
});

afterAll(() => {
    // Don't leak poki-* classes into the next test file.
    for (const c of Array.from(document.body.classList)) {
        if (c.startsWith('poki-')) document.body.classList.remove(c);
    }
});

describe('brand wiring', () => {
    it('brand.css loads and defines --poki-* custom properties on :root', () => {
        const rootStyles = getComputedStyle(document.documentElement);
        // BRAND.md §Palette — non-negotiable ink + parchment tokens.
        expect(rootStyles.getPropertyValue('--poki-ink').trim()).not.toBe('');
        expect(rootStyles.getPropertyValue('--poki-parchment').trim()).not.toBe('');
    });

    it('brand typography tokens resolve', () => {
        const rootStyles = getComputedStyle(document.documentElement);
        expect(rootStyles.getPropertyValue('--font-body').trim()).not.toBe('');
        expect(rootStyles.getPropertyValue('--font-heading').trim()).not.toBe('');
    });

    it('brand spacing tokens resolve (8-point grid)', () => {
        const rootStyles = getComputedStyle(document.documentElement);
        for (const t of ['--space-1', '--space-2', '--space-3', '--space-4']) {
            expect(rootStyles.getPropertyValue(t).trim()).not.toBe('');
        }
    });

    it('applyBrandClasses adds poki-high-contrast when enabled', () => {
        applyBrandClasses(document.body, { highContrast: true });
        expect(document.body.classList.contains('poki-high-contrast')).toBe(true);
    });

    it('applyBrandClasses removes poki-high-contrast when disabled (idempotent)', () => {
        applyBrandClasses(document.body, { highContrast: true });
        applyBrandClasses(document.body, { highContrast: false });
        expect(document.body.classList.contains('poki-high-contrast')).toBe(false);
    });

    it('applyBrandClasses does not clobber non-poki body classes', () => {
        document.body.classList.add('some-other-lib-class');
        applyBrandClasses(document.body, { highContrast: true });
        expect(document.body.classList.contains('some-other-lib-class')).toBe(true);
        expect(document.body.classList.contains('poki-high-contrast')).toBe(true);
        document.body.classList.remove('some-other-lib-class');
    });
});
