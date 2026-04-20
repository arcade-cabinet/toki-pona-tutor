/**
 * Brand boot wiring — runs once at client start to apply the initial
 * brand-driven class set to <body>, and subscribes to settings changes
 * so toggling high-contrast in-game takes effect without a reload.
 *
 * Keep this thin — the actual prefs and derivation logic lives in
 * src/platform/persistence/settings.ts and src/styles/brand-preferences.ts.
 * This file owns only the side-effect wiring.
 */

import { getHighContrast } from '../platform/persistence/settings';
import { applyBrandClasses } from './brand-preferences';

/**
 * Apply the current brand preferences to <body>. Call at:
 *   - client boot (standalone.ts after startGame)
 *   - any settings-change event that flips high-contrast
 *
 * No-op outside the browser (SSR / vitest-node).
 */
export async function applyBrandBoot(): Promise<void> {
    if (typeof document === 'undefined' || !document.body) return;
    const highContrast = await getHighContrast();
    applyBrandClasses(document.body, { highContrast });
}
