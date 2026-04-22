import { describe, expect, it } from 'vitest';
import { formatGameplayTemplate } from '../../src/content/gameplay/templates';

describe('gameplay template formatter', () => {
    it('replaces named values without dropping unknown placeholders', () => {
        expect(formatGameplayTemplate('{label}: {count} / {total}', {
            label: 'soweli',
            count: 2,
        })).toBe('soweli: 2 / {total}');
    });
});
