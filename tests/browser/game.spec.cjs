const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
});

test('orientation pauses play; overtime, tabs, upgrades and sound work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('#modal-title')).toHaveText('DAY 1 — ORIENTATION');
  await page.clock.fastForward(60000);
  expect(await page.evaluate(() => Game.state.playTime)).toBe(0);
  await page.getByRole('button', { name: 'CLOCK IN' }).click();
  await page.locator('#btn-work').click();
  await page.locator('#stage').click();
  await page.locator('body').click({ position: { x: 2, y: 2 } });
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => Game.state.stats.clicks)).toBe(3);
  await page.clock.fastForward(10000);
  await page.locator('#tab-tasks .card').filter({ hasText: 'Type Reports' }).getByRole('button').click();
  expect(await page.evaluate(() => Game.state.tasks.t_reports.level)).toBe(2);
  await page.getByRole('button', { name: 'RESKILL', exact: true }).first().click();
  await expect(page.locator('#tab-reskill')).toBeVisible();
  await page.getByRole('button', { name: 'PERKS', exact: true }).click();
  await expect(page.locator('#tab-perks')).toBeVisible();
  await page.locator('#btn-mute').click();
  await expect(page.locator('#btn-mute')).toHaveText('SND:ON');
  await page.locator('#btn-reset').click();
  await page.getByRole('button', { name: 'WIPE IT' }).click();
  expect(await page.evaluate(() => Game.state.stats.clicks)).toBe(0);
  expect(await page.evaluate(() => Game.state.flags.muted)).toBe(false);
  expect(errors).toEqual([]);
});

test('game over survives reload and restart returns to a working game', async ({ page }) => {
  await page.getByRole('button', { name: 'CLOCK IN' }).click();
  await page.evaluate(() => { Game.tick(800); Game.save(); });
  await expect(page.locator('#modal-title')).toHaveText('MADE REDUNDANT');
  await page.reload();
  await expect(page.locator('#modal-title')).toHaveText('MADE REDUNDANT');
  await expect(page.locator('#btn-work')).toBeDisabled();
  await page.getByRole('button', { name: 'START OVER (AGAIN)' }).click();
  await expect(page.locator('#modal-veil')).toBeHidden();
  await expect(page.locator('#btn-work')).toBeEnabled();
  await page.locator('#btn-work').click();
  expect(await page.evaluate(() => Game.state.stats.clicks)).toBe(1);
});

test('offline return restores progress and credits earnings', async ({ page }) => {
  await page.getByRole('button', { name: 'CLOCK IN' }).click();
  await page.evaluate(() => {
    Game.tick(60);
    Game.save();
  });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('simulatedAbsence')) return;
    const saved = JSON.parse(localStorage.getItem('rtyj_save_v1'));
    saved.lastSeen -= 3600000;
    localStorage.setItem('rtyj_save_v1', JSON.stringify(saved));
    sessionStorage.setItem('simulatedAbsence', 'true');
  });
  await page.reload();
  await expect(page.locator('#modal-title')).toHaveText('WHILE YOU WERE AWAY');
  await page.getByRole('button', { name: 'BACK TO WORK' }).click();
  expect(await page.evaluate(() => Game.state.robot.absorbed)).toBe(1);
  expect(await page.evaluate(() => Game.state.money)).toBeGreaterThan(12960);
  await page.reload();
  expect(await page.evaluate(() => Game.state.robot.absorbed)).toBe(1);
  await expect(page.locator('#stat-money')).not.toContainText('NaN');
});

test('victory opens the ending and endless play continues', async ({ page }) => {
  await page.getByRole('button', { name: 'CLOCK IN' }).click();
  await page.evaluate(() => { Game.state.money = 100000; Game.state.robot.absorbed = 8; Game.emit('change'); });
  await page.locator('[data-tab="reskill"]').click();
  await page.locator('#tab-reskill .card').filter({ hasText: 'Robot Therapist' }).getByRole('button').click();
  await expect(page.locator('#modal-title')).toContainText('AUTOMATION-PROOF');
  await page.getByRole('button', { name: 'KEEP LISTENING (ENDLESS)' }).click();
  await page.evaluate(() => Game.tick(2000));
  await expect(page.locator('#stat-status')).toHaveText('AUTO-PROOF');
  expect(await page.evaluate(() => Game.state.flags.gameOver)).toBe(false);
});

test('layout fits the viewport and all local assets load without errors', async ({ page }) => {
  const errors = [];
  const failedAssets = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:8000') && response.status() >= 400) {
      failedAssets.push(response.url());
    }
  });
  await page.reload();
  await page.getByRole('button', { name: 'CLOCK IN' }).click();
  await page.evaluate(() => document.fonts.ready);
  for (const tab of ['tasks', 'reskill', 'perks']) {
    await page.locator(`[data-tab="${tab}"]`).click();
    const overflowing = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      return [...document.querySelectorAll('#header, #threat-bar, #stage, #action-row, #right-col, .tab-page.active .card, .tab-page.active .card-name, .tab-page.active .card-act')]
        .filter(el => el.getBoundingClientRect().right > width || el.getBoundingClientRect().left < 0)
        .map(el => el.id || el.className);
    });
    expect(overflowing).toEqual([]);
  }
  await page.evaluate(() => Game.tick(41));
  await page.locator('[data-tab="tasks"]').click();
  await expect(page.locator('.card.targeted')).toHaveCount(1);
  expect(errors).toEqual([]);
  expect(failedAssets).toEqual([]);
});
