import { devices, expect, test, type Page } from '@playwright/test';

test.use({
    ...devices['iPhone 13'],
});

type BrowserPartyMember = {
    slot: number;
    speciesId: string;
    level: number;
    xp: number;
};

type BrowserDebugState = {
    currentMapId: string | null;
    serverMapId: string | null;
};

type BrowserTaskStatus = {
    done: boolean;
    error: string | null;
};

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

async function getState(page: Page): Promise<BrowserDebugState> {
    return page.evaluate(() => window.__POKI__!.testing.getState());
}

async function getParty(page: Page): Promise<BrowserPartyMember[]> {
    return page.evaluate(() => window.__POKI__!.testing.getParty());
}

async function getFlag(page: Page, flagId: string): Promise<string | null> {
    return page.evaluate((id) => window.__POKI__!.testing.getFlag(id), flagId);
}

async function getInventoryCount(page: Page, itemId: string): Promise<number> {
    return page.evaluate((id) => window.__POKI__!.testing.getInventoryCount(id), itemId);
}

async function getTaskStatus(page: Page, taskId: string): Promise<BrowserTaskStatus | null> {
    return page.evaluate((id) => window.__POKI__!.testing.getTaskStatus(id), taskId);
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rpg-ui-title-screen-menu .rpg-ui-menu-item').nth(index);
}

function dialogChoice(page: Page, index: number) {
    return page.locator(`.rpg-ui-dialog-choice[data-choice-index="${index}"]`);
}

async function beginEvent(page: Page, eventId: string, trigger: 'action' | 'touch' = 'action'): Promise<string> {
    return page.evaluate(({ id, mode }) => {
        return window.__POKI__!.testing.beginEvent(id, mode);
    }, { id: eventId, mode: trigger });
}

async function triggerEvent(page: Page, eventId: string, trigger: 'action' | 'touch' = 'action'): Promise<void> {
    await page.evaluate(({ id, mode }) => {
        return window.__POKI__!.testing.triggerEvent(id, mode);
    }, { id: eventId, mode: trigger });
}

async function beginForestEncounter(page: Page, speciesId: string): Promise<string> {
    return page.evaluate((id) => {
        return window.__POKI__!.testing.beginShape(
            {
                name: `quest_${id}`,
                properties: {
                    type: 'Encounter',
                    species: JSON.stringify({ [id]: 100 }),
                    level_min: 3,
                    level_max: 3,
                },
            },
            { randomValues: Array.from({ length: 16 }, () => 0) },
        );
    }, speciesId);
}

async function advanceDialog(page: Page, expectedText: string | RegExp, taskId?: string): Promise<void> {
    const content = page.locator('.rpg-ui-dialog-content');
    if (typeof expectedText === 'string' && taskId) {
        await expect.poll(async () => {
            const status = await getTaskStatus(page, taskId);
            if (status?.error) {
                return `ERROR: ${status.error}`;
            }
            return (await content.textContent()) ?? '';
        }).toBe(expectedText);
    } else {
        await expect(content).toHaveText(expectedText);
    }
    await page.evaluate(() => window.__POKI__!.testing.closeGui('rpg-dialog'));
}

async function expectTaskDone(page: Page, taskId: string): Promise<void> {
    await expect.poll(async () => {
        const status = await getTaskStatus(page, taskId);
        if (status?.error) {
            return `ERROR: ${status.error}`;
        }
        return status?.done ?? false;
    }).toBe(true);
}

async function startRouteGame(page: Page): Promise<void> {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await titleEntry(page, 0).tap();

    const starterTask = await beginEvent(page, 'jan-sewi');
    await advanceDialog(page, 'hello', starterTask);
    await advanceDialog(page, 'kili sin li pona tawa sijelo.', starterTask);
    await advanceDialog(page, 'kule seme li pona tawa sina?', starterTask);
    await dialogChoice(page, 0).tap();

    await expect.poll(async () => (await getParty(page)).map((member) => member.speciesId).join(','))
        .toBe('kon_moli');

    await triggerEvent(page, 'warp_east', 'touch');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('nasin_wan:nasin_wan');
}

async function acceptForestPokiQuest(page: Page): Promise<void> {
    const taskId = await beginEvent(page, 'jan-poki-nasin');
    await advanceDialog(page, 'wile pona a!', taskId);
    await advanceDialog(page, 'lukin la sina pilin pona...', taskId);
    await expect(page.locator('.rpg-ui-dialog-content')).toHaveText('pali poki\npoki: x2');
    await expect(dialogChoice(page, 0)).toContainText('pali');
    await dialogChoice(page, 0).tap();
    await advanceDialog(page, 'pali: 0 / 2', taskId);
    await expectTaskDone(page, taskId);
}

async function catchForestCreature(page: Page, speciesId: string): Promise<void> {
    const taskId = await beginForestEncounter(page, speciesId);
    await advanceDialog(page, 'sina soweli.', taskId);
    await expect(dialogChoice(page, 0)).toContainText('utala');
    await dialogChoice(page, 0).tap();
    await advanceDialog(page, /utala: -\d+ HP/, taskId);
    await expect(dialogChoice(page, 1)).toContainText('poki');
    await dialogChoice(page, 1).tap();
    await advanceDialog(page, 'a. pona.', taskId);
    await expectTaskDone(page, taskId);
}

async function openPauseInventory(page: Page): Promise<void> {
    const overlay = page.locator('[data-testid="pause-overlay"]');
    if (!(await overlay.isVisible().catch(() => false))) {
        await page.locator('[data-testid="hud-menu-toggle"]').tap();
        await expect(overlay).toBeVisible();
    }
    await page.locator('[data-testid="pause-inventory"]').tap();
}

async function resumeFromPause(page: Page): Promise<void> {
    await page.locator('[data-testid="pause-resume"]').tap();
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeHidden();
}

test('mobile HUD inventory shows side quest progress through reward collection', async ({ page }) => {
    await startRouteGame(page);
    await acceptForestPokiQuest(page);

    await expect.poll(async () => getFlag(page, 'quest_quest_nasin_poki_pack_status')).toBe('active');

    await openPauseInventory(page);
    await expect(page.locator('[data-testid="pause-quest-heading"]')).toContainText('pali:');
    await expect(page.locator('[data-testid="pause-quest-heading"]')).toContainText('1');
    await expect(page.locator('[data-testid="pause-quest-0"]')).toContainText('· pali poki: 0 / 2');
    await resumeFromPause(page);

    await catchForestCreature(page, 'soweli_jaki');
    await expect.poll(async () => getFlag(page, 'quest_quest_nasin_poki_pack_progress')).toBe('1');

    await openPauseInventory(page);
    await expect(page.locator('[data-testid="pause-quest-0"]')).toContainText('· pali poki: 1 / 2');
    await resumeFromPause(page);

    await catchForestCreature(page, 'soweli_kili');
    await expect.poll(async () => getFlag(page, 'quest_quest_nasin_poki_pack_progress')).toBe('2');

    await openPauseInventory(page);
    await expect(page.locator('[data-testid="pause-quest-0"]')).toContainText('· pali poki: 2 / 2');
    await resumeFromPause(page);

    const rewardTask = await beginEvent(page, 'jan-poki-nasin');
    await advanceDialog(page, 'wile pona a!', rewardTask);
    await advanceDialog(page, 'lukin la sina pilin pona...', rewardTask);
    await advanceDialog(page, 'pali pini: pali poki\npoki wawa x1\nXP +50\nnimi: poki', rewardTask);
    await expectTaskDone(page, rewardTask);

    await expect.poll(async () => getFlag(page, 'quest_quest_nasin_poki_pack_done')).toBe('1');
    await expect.poll(async () => getInventoryCount(page, 'poki_wawa')).toBe(1);

    await openPauseInventory(page);
    await expect(page.locator('[data-testid="pause-quest-0"]')).toContainText('✓ pali poki: 2 / 2');
});
