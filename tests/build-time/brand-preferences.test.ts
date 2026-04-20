import { describe, it, expect } from 'vitest';
import { brandBodyClasses, applyBrandClasses } from '../../src/styles/brand-preferences';

describe('brandBodyClasses — pref → class set', () => {
    it('highContrast=true adds poki-high-contrast', () => {
        expect(brandBodyClasses({ highContrast: true })).toEqual(new Set(['poki-high-contrast']));
    });

    it('highContrast=false yields empty set', () => {
        expect(brandBodyClasses({ highContrast: false })).toEqual(new Set());
    });
});

describe('applyBrandClasses — idempotent DOM effect', () => {
    function mockElement(initialClasses: string[] = []) {
        const classes = [...initialClasses];
        return {
            classList: {
                add(c: string) {
                    if (!classes.includes(c)) classes.push(c);
                },
                remove(c: string) {
                    const idx = classes.indexOf(c);
                    if (idx >= 0) classes.splice(idx, 1);
                },
                [Symbol.iterator]: function* () {
                    for (const c of classes) yield c;
                },
            },
            get _classes() {
                return classes;
            },
        };
    }

    it('adds poki-high-contrast when turned on', () => {
        const el = mockElement();
        applyBrandClasses(el as unknown as HTMLElement, { highContrast: true });
        expect(el._classes).toContain('poki-high-contrast');
    });

    it('removes poki-high-contrast when turned off', () => {
        const el = mockElement(['poki-high-contrast']);
        applyBrandClasses(el as unknown as HTMLElement, { highContrast: false });
        expect(el._classes).not.toContain('poki-high-contrast');
    });

    it('preserves non-brand classes (never touches foreign class names)', () => {
        const el = mockElement(['third-party-theme', 'rpg-ui-body', 'poki-high-contrast']);
        applyBrandClasses(el as unknown as HTMLElement, { highContrast: false });
        expect(el._classes).toContain('third-party-theme');
        expect(el._classes).toContain('rpg-ui-body');
        expect(el._classes).not.toContain('poki-high-contrast');
    });

    it('is idempotent — running twice with same prefs is a no-op', () => {
        const el = mockElement();
        applyBrandClasses(el as unknown as HTMLElement, { highContrast: true });
        const first = [...el._classes];
        applyBrandClasses(el as unknown as HTMLElement, { highContrast: true });
        expect(el._classes).toEqual(first);
    });

    it('toggle from on to off removes only poki-* classes', () => {
        const el = mockElement(['unrelated', 'poki-high-contrast']);
        applyBrandClasses(el as unknown as HTMLElement, { highContrast: false });
        expect(el._classes).toEqual(['unrelated']);
    });
});
