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

type BrowserTaskStatus = {
    done: boolean;
    error: string | null;
};

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

async function getParty(page: Page): Promise<BrowserPartyMember[]> {
    return page.evaluate(() => window.__POKI__!.testing.getParty());
}

async function getInventoryCount(page: Page, itemId: string): Promise<number> {
    return page.evaluate((id) => window.__POKI__!.testing.getInventoryCount(id), itemId);
}

async function setInventoryItemCount(page: Page, itemId: string, count: number): Promise<void> {
    await page.evaluate(({ id, value }) => {
        return window.__POKI__!.testing.setInventoryItemCount(id, value);
    }, { id: itemId, value: count });
}

async function setLeadHp(page: Page, hp: number): Promise<void> {
    await page.evaluate((value) => window.__POKI__!.testing.setLeadHp(value), hp);
}

async function setPartyCurrentHp(page: Page, slot: number, hp: number): Promise<void> {
    await page.evaluate(({ index, value }) => {
        return window.__POKI__!.testing.setPartyCurrentHp(index, value);
    }, { index: slot, value: hp });
}

async function getTaskStatus(page: Page, taskId: string): Promise<BrowserTaskStatus | null> {
    return page.evaluate((id) => window.__POKI__!.testing.getTaskStatus(id), taskId);
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rpg-ui-title-screen-menu .rpg-ui-menu-item').nth(index);
}

function dialogChoice(page: Page, index: number) {
    return page.getByTestId(`dialog-choice-${index}`);
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

async function beginShape(page: Page): Promise<string> {
    return page.evaluate(() => {
        return window.__POKI__!.testing.beginShape(
            {
                name: 'encounter_0',
                properties: {
                    type: 'Encounter',
                    species: '{"jan_ike_lili":25,"jan_utala_lili":20,"soweli_musi":20,"soweli_kili":15,"soweli_jaki":10,"waso_pimeja":10}',
                    level_min: 3,
                    level_max: 5,
                },
            },
            { randomValues: [0, 0, 0, 0, 0.99, ...Array.from({ length: 128 }, () => 0)] },
        );
    });
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

test('mobile party panel renders details and can promote a caught creature to lead', async ({ page }) => {
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

    await setInventoryItemCount(page, 'kili', 1);
    await setLeadHp(page, 5);

    const encounterTask = await beginShape(page);
    await advanceDialog(page, 'sina soweli.', encounterTask);
    await expect(dialogChoice(page, 0)).toContainText('utala');
    await expect(dialogChoice(page, 1)).toContainText('poki');
    await expect(dialogChoice(page, 2)).toContainText('ijo');
    await dialogChoice(page, 2).tap();
    await expect(page.locator('.rpg-ui-dialog-content')).toHaveText('ijo');
    await expect(dialogChoice(page, 0)).toContainText('kili');
    await dialogChoice(page, 0).tap();
    await advanceDialog(page, /kili: \+20 HP\nHP 25 \/ \d+/, encounterTask);
    await expect.poll(async () => getInventoryCount(page, 'kili')).toBe(0);

    await expect(dialogChoice(page, 0)).toContainText('utala');
    await dialogChoice(page, 0).tap();
    await advanceDialog(page, /utala: -\d+ HP/, encounterTask);
    await expect(dialogChoice(page, 1)).toContainText('poki');
    await dialogChoice(page, 1).tap();
    await advanceDialog(page, 'a. pona.', encounterTask);
    await expect.poll(async () => {
        const status = await getTaskStatus(page, encounterTask);
        return status?.done ?? false;
    }).toBe(true);

    await expect.poll(async () => (await getParty(page)).map((member) => member.speciesId).join(','))
        .toBe('kon_moli,jan_ike_lili');
    await setInventoryItemCount(page, 'kili', 2);
    await setLeadHp(page, 5);
    await setPartyCurrentHp(page, 1, 6);
    await expect.poll(async () => getInventoryCount(page, 'kili')).toBe(2);

    await page.locator('[data-testid="hud-menu-toggle"]').tap();
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();

    await page.locator('[data-testid="pause-bestiary"]').tap();
    await expect(page.locator('.poki-pause-panel-heading')).toHaveText(/lipu soweli 2 \/ 43/);
    await expect(page.locator('[data-testid="bestiary-entry-kon_moli"]')).toContainText('kon moli');
    await expect(page.locator('[data-testid="bestiary-entry-kon_moli"]')).toContainText('jo');
    await expect(page.locator('[data-testid="bestiary-entry-jan_ike_lili"]')).toContainText('jan ike lili');
    await expect(page.locator('[data-testid="bestiary-entry-jan_ike_lili"]')).toContainText('jo');
    await page.locator('[data-testid="bestiary-entry-kon_moli"]').tap();
    await advanceDialog(page, 'kon moli\nsoweli tomo li suwi mute.');
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();

    await page.locator('[data-testid="pause-party"]').tap();
    await expect(page.locator('[data-testid="party-slot-0"]')).toContainText('kon moli');
    await expect(page.locator('[data-testid="party-slot-1"]')).toContainText('jan ike lili');
    await expect(page.locator('[data-testid="party-slot-0"]')).toContainText(/HP 5 \//);
    await expect(page.locator('[data-testid="party-slot-0"] .poki-party-hp-fill')).toHaveAttribute('style', /width:/);

    await page.locator('[data-testid="party-slot-0"]').tap();
    await expect(page.locator('[data-testid="party-heal-0"]')).toContainText('+20 HP | ×2');
    await page.locator('[data-testid="party-heal-0"]').tap();
    await expect.poll(async () => getInventoryCount(page, 'kili')).toBe(1);
    await expect(page.locator('[data-testid="party-slot-0"]')).toContainText(/HP 25 \//);

    await page.locator('[data-testid="party-slot-1"]').tap();
    await expect(page.locator('[data-testid="party-detail-card"]')).toContainText('type: kasi');
    await expect(page.locator('[data-testid="party-detail-card"]')).toContainText('moves: leaf');
    await expect(page.locator('[data-testid="party-heal-1"]')).toContainText('+20 HP | ×1');
    await page.locator('[data-testid="party-heal-1"]').tap();
    await expect.poll(async () => getInventoryCount(page, 'kili')).toBe(0);
    await expect(page.locator('[data-testid="party-slot-1"]')).toContainText('HP 26 / 42');
    await expect(page.locator('[data-testid="party-promote-1"]')).toContainText('lead');

    await page.locator('[data-testid="party-promote-1"]').tap();
    await expect.poll(async () => (await getParty(page)).map((member) => `${member.slot}:${member.speciesId}`).join(','))
        .toBe('0:jan_ike_lili,1:kon_moli');
    await expect(page.locator('[data-testid="party-slot-0"]')).toContainText('jan ike lili');
});
