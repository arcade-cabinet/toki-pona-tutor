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
    return page.locator('.rpg-ui-title-screen-menu .rpg-ui-menu-item').nth(index);
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
        await preferences.set(KEYS.currentMapId, 'nasin_wan');
        await preferences.set(KEYS.journeyBeat, 'beat_02_nasin_wan');
        await preferences.set(KEYS.starterChosen, 'kon_moli');
        await player.save(3, { map: 'nasin_wan' });

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
            map: 'nasin_wan',
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

    await expect(page.locator('.rpg-ui-title-screen-title')).toContainText('poki soweli');
    await expect(titleEntry(page, 0)).toContainText('open sin');
    await expect(titleEntry(page, 1)).toContainText('nasin');
    await expect(titleEntry(page, 2)).toContainText('pini');

    await titleEntry(page, 2).click();
    await expect(page.locator('.rpg-ui-dialog-content')).toContainText('pini la o weka e lipu ni.');
    await page.evaluate(() => window.__POKI__!.testing.closeGui('rpg-dialog'));

    await expect(page.locator('.rpg-ui-title-screen-title')).toContainText('poki soweli');
    await expect(titleEntry(page, 0)).toContainText('open sin');
    await expect(titleEntry(page, 2)).toContainText('pini');
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
    await expect(page.locator('.rpg-ui-title-screen-title')).toContainText('poki soweli');
    await expect(titleEntry(page, 0)).toContainText('open sin');
    await titleEntry(page, 0).click();
    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('ma_tomo_lili');

    await seedRouteSave(page);

    await page.reload();

    await expect(page.locator('.rpg-ui-title-screen-title')).toContainText('poki soweli');
    await expect(titleEntry(page, 0)).toContainText('kama');
    await expect(titleEntry(page, 0)).toContainText('3');
    await expect(titleEntry(page, 1)).toContainText('open sin');

    await titleEntry(page, 0).click();
    await waitForReady(page);

    await expect.poll(async () => {
        const state = await getState(page);
        return state.currentMapId;
    }).toBe('nasin_wan');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.serverMapId;
    }).toBe('nasin_wan');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('beat_02_nasin_wan');
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
    expect(resumed.currentMapId).toBe('nasin_wan');
    expect(resumed.journeyBeat).toBe('beat_02_nasin_wan');
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

    await expect(page.locator('.rpg-ui-title-screen-title')).toContainText('poki soweli');
    await expect(titleEntry(page, 0)).toContainText('open sin');
    await titleEntry(page, 0).click();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('ma_tomo_lili');

    await seedRouteSave(page);
    await page.reload();

    await expect(page.locator('.rpg-ui-title-screen-title')).toContainText('poki soweli');
    await expect(titleEntry(page, 0)).toContainText('kama');
    await expect(titleEntry(page, 1)).toContainText('open sin');

    await titleEntry(page, 1).click();
    await expect(page.locator('.rpg-ui-dialog-content')).toContainText('open sin?');
    await expect(page.getByTestId('dialog-choice-0')).toContainText('lon');
    await expect(page.getByTestId('dialog-choice-1')).toContainText('ala');

    await page.getByTestId('dialog-choice-1').click();
    await expect(page.locator('.rpg-ui-title-screen-title')).toContainText('poki soweli');
    await expect(titleEntry(page, 0)).toContainText('kama');

    await titleEntry(page, 1).click();
    await expect(page.locator('.rpg-ui-dialog-content')).toContainText('open sin?');
    await page.getByTestId('dialog-choice-0').click();
    await waitForReady(page);

    await expect.poll(async () => {
        const state = await getState(page);
        return state.currentMapId;
    }).toBe('ma_tomo_lili');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.serverMapId;
    }).toBe('ma_tomo_lili');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('beat_01_ma_tomo_lili');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves.some((slot) => slot?.map === 'nasin_wan');
    }).toBe(false);
    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('ma_tomo_lili');
});
