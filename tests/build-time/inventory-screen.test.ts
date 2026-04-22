import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RpgPlayer } from '@rpgjs/server';
import { showInventory } from '../../src/modules/main/inventory-screen';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';
import {
    setPreferencesImpl,
    type PreferencesAdapter,
} from '../../src/platform/persistence/preferences';
import { INVENTORY_SCREEN_CONFIG } from '../../src/content/gameplay';

class InMemoryPrefs implements PreferencesAdapter {
    private store = new Map<string, string>();

    async get(key: string) {
        return this.store.get(key) ?? null;
    }

    async set(key: string, value: string) {
        this.store.set(key, value);
    }

    async remove(key: string) {
        this.store.delete(key);
    }

    async clear() {
        this.store.clear();
    }

    async keys() {
        return [...this.store.keys()];
    }
}

beforeEach(async () => {
    setPreferencesImpl(new InMemoryPrefs());
    await resetPersistedRuntimeState({ includeSaves: true });
});

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
});

describe('showInventory', () => {
    it('renders the configured empty-party line instead of a zero-slot roster', async () => {
        const lines: string[] = [];
        const player = {
            showText: async (line: string) => {
                lines.push(line);
            },
        } as unknown as RpgPlayer;

        await showInventory(player);

        expect(lines).toContain(INVENTORY_SCREEN_CONFIG.emptyPartyText);
        expect(lines.some((line) => line.includes('poki: 0 / 6'))).toBe(false);
    });
});
