/**
 * Applies brand-driven preferences to the document body class list.
 *
 * Two responsibilities:
 *   1. Read relevant settings (high-contrast, reduced-motion override
 *      when user has toggled it in-game separately from system pref).
 *   2. Toggle body classes so brand.css selectors activate/deactivate.
 *
 * Pure toggle function is separated from the effect side so tests can
 * exercise the class-list derivation without a DOM.
 */

export interface BrandPrefs {
    highContrast: boolean;
    accessibleMode?: boolean;
}

/**
 * Compute the set of body classes for a given prefs state. Returning
 * a Set makes the effect trivially idempotent — apply() just diffs
 * against the current classList.
 *
 * @example
 * brandBodyClasses({ highContrast: true })
 * // → Set(['poki-high-contrast'])
 * brandBodyClasses({ highContrast: false, accessibleMode: true })
 * // → Set(['poki-accessible-mode'])
 * brandBodyClasses({ highContrast: false, accessibleMode: false })
 * // → Set([])
 */
export function brandBodyClasses(prefs: BrandPrefs): Set<string> {
    const classes = new Set<string>();
    if (prefs.highContrast) classes.add("poki-high-contrast");
    if (prefs.accessibleMode) classes.add("poki-accessible-mode");
    return classes;
}

/**
 * Apply the computed class set to a DOM element, adding missing and
 * removing classes that are no longer in the set. Only touches the
 * brand-managed class namespace (`poki-*`) so it doesn't clobber other
 * libraries' classes.
 *
 * Idempotent: running it twice with the same prefs is a no-op.
 */
export function applyBrandClasses(target: HTMLElement, prefs: BrandPrefs): void {
    const desired = brandBodyClasses(prefs);

    // Remove brand classes that shouldn't be present.
    for (const existing of Array.from(target.classList)) {
        if (existing.startsWith("poki-") && !desired.has(existing)) {
            target.classList.remove(existing);
        }
    }

    // Add desired classes that aren't present.
    for (const cls of desired) {
        target.classList.add(cls);
    }
}
