import { expect, test, type Page } from '@playwright/test';

type BrowserDebugState = {
    playerId: string | null;
    currentMapId: string | null;
    journeyBeat: string | null;
    position: {
        x: number | null;
        y: number | null;
    };
    serverMapId: string | null;
    serverPosition: {
        x: number | null;
        y: number | null;
    };
    saves: Array<Record<string, unknown> | null>;
};

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

async function getState(page: Page): Promise<BrowserDebugState> {
    return page.evaluate(() => window.__POKI__!.testing.getState());
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rr-title-entry').nth(index);
}

async function seedRouteSave(page: Page): Promise<void> {
    await page.evaluate(async () => {
        const engine = window.__POKI__?.engine ?? null;
        const socket = engine?.socket as {
            getServer?: () => {
                subRoom?: {
                    players?: () => Record<string, {
                        id?: string;
                        conn?: { id?: string };
                        save?: (slot: number, meta?: Record<string, unknown>) => Promise<unknown>;
                    }>;
                };
            };
        } | undefined;
        const playerId = window.__POKI__?.playerId ?? null;
        const player = playerId && typeof socket?.getServer?.()?.subRoom?.players === 'function'
            ? socket.getServer()?.subRoom?.players?.()?.[playerId]
            : null;
        if (!player?.save) {
            throw new Error('seedRouteSave: server player unavailable');
        }

        const { preferences, KEYS } = await import('./src/platform/persistence/preferences.ts');
        const { getDatabase, saveWebStore } = await import('./src/platform/persistence/database.ts');
        await preferences.set(KEYS.currentMapId, 'greenwood_road');
        await preferences.set(KEYS.journeyBeat, 'beat_02_greenwood_road');
        await preferences.set(KEYS.starterChosen, 'ashcat');
        await player.save(3, { map: 'greenwood_road' });

        const playerKey = `default:${player.conn?.id ?? player.id ?? 'anonymous'}`;
        const db = await getDatabase();
        const result = await db.query('SELECT data FROM saves WHERE player_key = ? LIMIT 1', [playerKey]);
        const raw = result.values?.[0]?.data;
        if (typeof raw !== 'string') {
            throw new Error('seedRouteSave: save row missing');
        }

        const slots = JSON.parse(raw) as Array<Record<string, unknown> | null>;
        const slot = slots[3];
        if (!slot || typeof slot !== 'object') {
            throw new Error('seedRouteSave: slot 3 missing');
        }

        const snapshotValue = slot.snapshot;
        const snapshot = typeof snapshotValue === 'string'
            ? JSON.parse(snapshotValue) as Record<string, unknown>
            : (snapshotValue as Record<string, unknown>);
        snapshot.x = 32;
        snapshot.y = 96;
        snapshot.z = 0;

        slots[0] = null;
        slots[3] = {
            ...slot,
            map: 'greenwood_road',
            snapshot: JSON.stringify(snapshot),
        };

        await db.run('UPDATE saves SET data = ? WHERE player_key = ?', [JSON.stringify(slots), playerKey]);
        await saveWebStore();
    });
}

test('title quit row acknowledges web quit intent and returns to the title menu', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText('Rivers Reckoning');
    await expect(titleEntry(page, 0)).toContainText('New Game');
    await expect(titleEntry(page, 1)).toContainText('Settings');
    await expect(titleEntry(page, 2)).toContainText('Quit');

    await titleEntry(page, 2).click();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toContainText('You can close this browser tab.');
    await page.evaluate(() => window.__POKI__!.testing.closeGui('rpg-dialog'));

    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText('Rivers Reckoning');
    await expect(titleEntry(page, 0)).toContainText('New Game');
    await expect(titleEntry(page, 2)).toContainText('Quit');
});

test('reload shows Continue and restores the saved map, beat, and tile', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (error) => {
        pageErrors.push(error.message);
    });
    page.on('console', (message) => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });

    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);
    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText('Rivers Reckoning');
    await expect(titleEntry(page, 0)).toContainText('New Game');
    await titleEntry(page, 0).click();
    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('riverside_home');

    await seedRouteSave(page);

    await page.reload();

    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText('Rivers Reckoning');
    await expect(titleEntry(page, 0)).toContainText('Continue');
    await expect(titleEntry(page, 0)).toContainText('3');
    await expect(titleEntry(page, 1)).toContainText('New Game');

    await titleEntry(page, 0).click();
    await waitForReady(page);

    await expect.poll(async () => {
        const state = await getState(page);
        return state.currentMapId;
    }).toBe('greenwood_road');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.serverMapId;
    }).toBe('greenwood_road');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('beat_02_greenwood_road');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.serverPosition.x},${state.serverPosition.y}`;
    }).toBe('32,96');
    await expect.poll(async () => {
        const state = await getState(page);
        if (state.position.x == null || state.position.y == null) return false;
        return Math.abs(state.position.x - 32) <= 16 && Math.abs(state.position.y - 96) <= 16;
    }).toBe(true);

    const resumed = await getState(page);
    expect(resumed.currentMapId).toBe('greenwood_road');
    expect(resumed.journeyBeat).toBe('beat_02_greenwood_road');
    expect(resumed.serverPosition).toEqual({ x: 32, y: 96 });
    expect(Math.abs((resumed.position.x ?? 0) - 32)).toBeLessThanOrEqual(16);
    expect(Math.abs((resumed.position.y ?? 0) - 96)).toBeLessThanOrEqual(16);
    expect(resumed.saves.length).toBeGreaterThan(0);

    await page.waitForTimeout(250);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
});

test('new game prompts before wiping an existing save and resets to the starter state when confirmed', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText('Rivers Reckoning');
    await expect(titleEntry(page, 0)).toContainText('New Game');
    await titleEntry(page, 0).click();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('riverside_home');

    await seedRouteSave(page);
    await page.reload();

    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText('Rivers Reckoning');
    await expect(titleEntry(page, 0)).toContainText('Continue');
    await expect(titleEntry(page, 1)).toContainText('New Game');

    await titleEntry(page, 1).click();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toContainText('Start a new game?');
    await expect(page.getByTestId('dialog-choice-0')).toContainText('Yes');
    await expect(page.getByTestId('dialog-choice-1')).toContainText('Cancel');

    await page.getByTestId('dialog-choice-1').click();
    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText('Rivers Reckoning');
    await expect(titleEntry(page, 0)).toContainText('Continue');

    await titleEntry(page, 1).click();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toContainText('Start a new game?');
    await page.getByTestId('dialog-choice-0').click();
    await waitForReady(page);

    await expect.poll(async () => {
        const state = await getState(page);
        return state.currentMapId;
    }).toBe('riverside_home');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.serverMapId;
    }).toBe('riverside_home');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('beat_01_riverside_home');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves.some((slot) => slot?.map === 'greenwood_road');
    }).toBe(false);
    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('riverside_home');
});
