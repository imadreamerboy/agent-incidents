import { expect, test } from '@playwright/test';

test('selecting a year and month filters incidents and preserves browser history', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const entries = page.locator('article');
  await expect(entries).toHaveCount(7);
  await page.getByRole('button', { name: '2026, 6 incidents', exact: true }).click();
  await expect(entries).toHaveCount(6);
  await expect(page.locator('#example-unknown-date')).toHaveCount(0);

  const september = page.getByRole('button', { name: 'September 2026, 3 incidents', exact: true });
  await september.focus();
  await page.keyboard.press('Enter');
  await expect(september).toHaveAttribute('aria-pressed', 'true');
  await expect(entries).toHaveCount(3);
  await expect(page.locator('#example-range')).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get('year')).toBe('2026');
  expect(new URL(page.url()).searchParams.get('month')).toBe('09');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.reload();
  await expect(september).toHaveAttribute('aria-pressed', 'true');
  await expect(entries).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear date', exact: true }).click();
  await expect(entries).toHaveCount(7);
  await expect(page).toHaveURL('/');
  await page.goBack();
  await expect(september).toHaveAttribute('aria-pressed', 'true');
  await expect(entries).toHaveCount(3);
});

test('report month counts individual publications and the follow-up links to the complete incident', async ({ page }) => {
  await page.goto('/?mode=reported&year=2026');
  const entries = page.locator('article');
  await expect(entries).toHaveCount(10);
  await expect(page.locator('#report--example-incident-a--example-repository')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'September 2026, 9 sources', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'November 2026, 1 source', exact: true }).click();
  await expect(entries).toHaveCount(1);
  const followUp = page.locator('#report--example-incident-a--example-follow-up');
  await expect(followUp).toBeVisible();
  await followUp.getByRole('link', { name: 'View incident and all sources', exact: true }).click();
  await expect(page.locator('#example-incident-a')).toBeInViewport();
  await expect(page.locator('#example-incident-a .sources li')).toHaveCount(3);
});
