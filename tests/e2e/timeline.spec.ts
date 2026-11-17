import { expect, test } from '@playwright/test';

test('evaluator filters preserve distinct roles in both views and copied links', async ({ page }) => {
  await page.goto('/');
  const filters = page.getByRole('group', { name: 'Filter by provider or evaluator', exact: true });
  const evaluator = filters.getByRole('button', { name: 'Example evaluator (evaluator)', exact: true });
  await evaluator.click();
  await expect(page).toHaveURL(/providers=example-evaluator$/);
  await expect(page.locator('article')).toHaveCount(1);
  const incident = page.locator('#example-unknown-date');
  await expect(incident.locator('.evaluators')).toHaveText('Evaluator: Example evaluator');
  await expect(incident.locator('.attribution .providers')).toHaveText('Model provider: Unknown');
  await page.getByRole('radio', { name: 'Reporting date', exact: true }).check();
  const report = page.locator('#report--example-unknown-date--example-report');
  await expect(page.locator('article')).toHaveCount(1);
  await expect(report.locator('.evaluators')).toHaveText('Evaluator: Example evaluator');
  await expect(report.locator('.attribution .providers')).toHaveText('Model provider: Unknown');
  const copiedUrl = page.url();
  await page.goto('/');
  await page.goto(copiedUrl);
  await expect(evaluator).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('article')).toHaveCount(1);
  await report.getByRole('link', { name: 'View incident and all sources', exact: true }).click();
  await expect(page).toHaveURL(/providers=example-evaluator#example-unknown-date$/);
  await expect(incident).toBeInViewport();
  await page.reload();
  await expect(evaluator).toHaveAttribute('aria-pressed', 'true');
  await expect(incident.locator('.attribution .providers')).toHaveText('Model provider: Unknown');
  await filters.getByRole('button', { name: 'Unknown provider', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(1);
  await page.getByRole('radio', { name: 'Reporting date', exact: true }).check();
  await expect(page.locator('article')).toHaveCount(1);
});

test('chronology, provider union and history stay in sync', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const articles = page.locator('article');
  await expect(articles).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'Incident date uncertain', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Incident date unknown', exact: true })).toBeVisible();
  const ids = () => articles.evaluateAll((elements) => elements.map((element) => element.id));
  expect((await ids()).indexOf('example-incident-a')).toBeLessThan((await ids()).indexOf('example-incident-b'));

  const providerA = page.getByRole('button', { name: 'Example lab A', exact: true });
  // Safari does not focus buttons on mouse click. Establish keyboard focus so
  // this assertion tests its preservation during filtering on every browser.
  await providerA.focus();
  await expect(providerA).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toContainText('3 of 7 examples');
  await expect(page.getByRole('button', { name: 'Example lab A', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Example lab B', exact: true }).click();
  await expect(articles).toHaveCount(5);
  await expect(page.locator('#example-multiple-providers')).toHaveCount(1);
  await page.getByRole('radio', { name: 'Reporting date', exact: true }).check();
  await expect(articles).toHaveCount(9);
  await expect(page.getByRole('status')).toContainText('sources');
  await expect(page.getByRole('status')).toContainText('5 of 7 examples');
  await expect(articles.first()).toHaveAttribute('id', 'report--example-incident-a--example-follow-up');
  await expect(page).toHaveURL(/mode=reported/);
  await expect(page.getByRole('button', { name: 'Example lab B', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(page.getByRole('radio', { name: 'Incident date', exact: true })).toBeChecked();
  await expect(articles).toHaveCount(5);
  await page.goBack();
  await expect(articles).toHaveCount(3);
  await page.goForward();
  await expect(articles).toHaveCount(5);
  await page.getByRole('button', { name: 'All providers and evaluators', exact: true }).click();
  await expect(articles).toHaveCount(7);
  expect(errors).toEqual([]);
});

test('copied links restore order, filters and source anchors; sources link back to the incident', async ({ page }) => {
  await page.goto('/?mode=reported&order=asc&providers=example-lab-b,example-lab-a,example-lab-b#report--example-incident-b--example-report');
  await expect(page.getByRole('radio', { name: 'Reporting date', exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Oldest first', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('article')).toHaveCount(9);
  await expect(page).toHaveURL(/providers=example-lab-a%2Cexample-lab-b#report--example-incident-b--example-report$/);
  await expect(page.locator('#report--example-incident-b--example-report')).toBeInViewport();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Oldest first', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('article')).toHaveCount(9);
  await page.locator('#report--example-incident-a--example-follow-up').getByRole('link', { name: 'View incident and all sources', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Incident date', exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Oldest first', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('article')).toHaveCount(5);
  await expect(page.locator('#example-incident-a')).toBeInViewport();
  await expect(page.locator('#example-incident-a .sources li')).toHaveCount(3);
  await expect(page).toHaveURL(/#example-incident-a$/);
  await expect(page.getByRole('button', { name: 'Example lab A', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('date order combines all anchored precisions and reverses publications while unknown dates remain last', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Oldest first', exact: true }).click();
  await expect(page.locator('article').first()).toHaveAttribute('id', 'example-approximate');
  expect(await page.locator('article').evaluateAll((items) => items.map((item) => item.id))).toEqual(['example-approximate', 'example-month', 'example-range', 'example-incident-b', 'example-multiple-providers', 'example-incident-a', 'example-unknown-date']);
  await expect(page.locator('article').last()).toHaveAttribute('id', 'example-unknown-date');
  await expect(page).toHaveURL(/order=asc/);
  await page.getByRole('radio', { name: 'Reporting date', exact: true }).check();
  await expect(page.locator('article')).toHaveCount(11);
  await expect(page.locator('article').first()).toHaveAttribute('id', 'report--example-approximate--example-report');
  await expect(page.getByRole('heading', { name: 'Publication date unknown', exact: true })).toBeVisible();
  await expect(page.locator('article').last()).toHaveAttribute('id', 'report--example-incident-a--example-repository');
  await page.getByRole('button', { name: 'Oldest first', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('article').first()).toHaveAttribute('id', 'report--example-incident-a--example-follow-up');
  await expect(page.locator('article').last()).toHaveAttribute('id', 'report--example-incident-a--example-repository');
  await expect(page.getByRole('button', { name: 'Oldest first', exact: true })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Oldest first', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('article').first()).toHaveAttribute('id', 'report--example-approximate--example-report');
});

test('multiple typed links stay with an incident and appear on their separate publication dates', async ({ page }) => {
  await page.goto('/');
  const incident = page.locator('#example-incident-a');
  await expect(incident.locator('.sources li')).toHaveCount(3);
  for (const type of ['Official report', 'Independent research', 'Repository']) {
    await expect(incident.getByText(type, { exact: true })).toBeVisible();
  }
  await expect(incident.locator('.sources svg')).toHaveCount(3);
  await page.getByRole('radio', { name: 'Reporting date', exact: true }).check();
  await expect(page.locator('article[id^="report--example-incident-a--"]')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: '18 Sep 2026', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: '18 Nov 2026', exact: true })).toHaveCount(1);
  await expect(page.locator('#report--example-incident-a--example-follow-up')).toContainText('Independent research');
  await expect(page.getByRole('heading', { name: 'Publication date unknown', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('11 sources');
  await expect(page.getByRole('status')).toContainText('7 examples');
});

test('invalid filters and valid empty selections have explicit recovery', async ({ page }) => {
  await page.goto('/?mode=invalid&providers=missing');
  await expect(page.getByRole('heading', { name: 'Timeline view unavailable' })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset the view' }).click();
  await expect(page.locator('article')).toHaveCount(7);
  await page.goto('/?q=example');
  await expect(page.getByText('Search is not available in this timeline preview.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset the view' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('article')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Example lab D', exact: true })).toHaveCount(0);
  await page.goto('/?providers=example-empty');
  await expect(page.getByRole('heading', { name: 'No examples match the selected filters.' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('0 of 7 examples');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.locator('article')).toHaveCount(7);
  await page.getByRole('button', { name: 'Unknown provider', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Incident date unknown', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Unknown provider', exact: true }).click();
  await expect(page.getByRole('button', { name: 'All providers and evaluators', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('article')).toHaveCount(7);
});

test('keyboard controls retain focus and expose selection', async ({ page, browserName }) => {
  // On macOS, Safari's native Option+Tab includes links and buttons regardless
  // of the user's full-keyboard-access setting. Other platforms use Tab.
  const nextControl = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.goto('/');
  await expect(page.getByRole('radio', { name: 'Incident date', exact: true })).toBeEnabled();
  await page.keyboard.press(nextControl);
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  // The shared site navigation now precedes the timeline controls.
  await page.getByRole('radio', { name: 'Incident date', exact: true }).focus();
  await expect(page.getByRole('radio', { name: 'Incident date', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Reporting date', exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Reporting date', exact: true })).toBeFocused();
  await page.keyboard.press(nextControl);
  await expect(page.getByRole('button', { name: 'Oldest first', exact: true })).toBeFocused();
  await page.keyboard.press(nextControl);
  await expect(page.getByRole('button', { name: 'All time', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'All providers and evaluators', exact: true }).focus();
  await page.keyboard.press(nextControl);
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Example lab A', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Example lab A', exact: true })).toBeFocused();
});

test('prerendered default content remains readable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/?mode=reported&providers=example-lab-a');
  await expect(page.locator('article')).toHaveCount(7);
  await expect(page.getByRole('radio', { name: 'Incident date', exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Incident date', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'All providers and evaluators' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Oldest first', exact: true })).toBeDisabled();
  // Playwright text selectors omit noscript descendants; check the rendered notice directly.
  await expect(page.locator('noscript .no-script')).toBeVisible();
  await expect(page.locator('noscript .no-script')).toContainText('Filtering and chronology controls need JavaScript.');
  await expect(page.getByText('Illustrative data — not real incidents', { exact: true })).toBeVisible();
  await expect(page.locator('a[href*="example.invalid"]')).toHaveCount(0);
  await page.locator('#example-incident-a summary').click();
  await expect(page.locator('#event--example-incident-a--scope-crossed')).toBeVisible();
  await context.close();
});

test('missing static routes are genuine 404 responses', async ({ request }) => {
  for (const path of ['/this-page-does-not-exist/', '/lookup/', '/hosts/']) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('Page not found.');
  }
});

test('About, Roadmap and tip pages are reachable without search', async ({ page }) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Primary' });
  await expect(navigation.getByRole('link', { name: 'Timeline' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('searchbox')).toHaveCount(0);

  await navigation.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { name: 'What goes into the timeline' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');

  await navigation.getByRole('link', { name: 'Roadmap' }).click();
  await expect(page.getByRole('heading', { name: 'Planned steps' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'URL checks', exact: true })).toBeVisible();

  await navigation.getByRole('link', { name: 'Send a tip' }).click();
  await expect(page.getByRole('heading', { name: 'Send a tip or correction' })).toBeVisible();
  await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(1);
});

for (const width of [1440, 1024, 768, 390, 320]) {
  test(`layout preserves complete entries at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('article')).toHaveCount(7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const multi = page.locator('#example-multiple-providers');
    await expect(multi.locator('.sources li')).toHaveCount(3);
    await expect(multi.locator('h3')).toBeVisible();
    const controls = await page.locator('.providers button').evaluateAll((elements) => elements.map((element) => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
    expect(controls.every((box) => box.width >= 44 && box.height >= 44)).toBe(true);
    await page.screenshot({ path: `output/playwright/${testInfo.project.name}/timeline-${width}.png`, fullPage: true });
    await page.locator('#example-incident-a summary').click();
    await expect(page.locator('#event--example-incident-a--scope-crossed')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `output/playwright/${testInfo.project.name}/events-${width}.png`, fullPage: true });
    await page.getByRole('radio', { name: 'Reporting date', exact: true }).check();
    await expect(page.locator('article')).toHaveCount(11);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `output/playwright/${testInfo.project.name}/reports-${width}.png`, fullPage: true });
  });
}


test('incident events disclose with the keyboard, keep narrative order and cite visible sources', async ({ page }) => {
  await page.goto('/');
  const incident = page.locator('#example-incident-a');
  const details = incident.locator('details');
  const summary = details.locator('summary');
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toContainText('3 events');
  await expect(incident.locator('.sources')).toBeVisible();
  await expect(page.locator('#example-incident-b details')).toHaveCount(0);
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(summary).toBeFocused();
  const events = details.locator('li[id^="event--"]');
  await expect(events).toHaveCount(3);
  expect(await events.evaluateAll((items) => items.map((item) => item.id))).toEqual([
    'event--example-incident-a--task-assigned',
    'event--example-incident-a--scope-crossed',
    'event--example-incident-a--task-contained'
  ]);
  await page.getByRole('button', { name: 'Oldest first', exact: true }).click();
  await expect(details).toHaveAttribute('open', '');
  await expect(events.first()).toHaveAttribute('id', 'event--example-incident-a--task-assigned');
  const event = page.locator('#event--example-incident-a--scope-crossed');
  await event.getByRole('link', { name: /Source 2/ }).click();
  await expect(page).toHaveURL(/#source--example-incident-a--example-follow-up$/);
  const source = page.locator('#source--example-incident-a--example-follow-up');
  await expect(source).toBeInViewport();
  await expect(source).toHaveCSS('outline-style', 'solid');
  await page.goBack();
  await expect(details).toHaveAttribute('open', '');
  await summary.focus();
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
});

test('event deep links reveal their incident timeline after load and reload', async ({ page }) => {
  await page.goto('/?providers=example-lab-a#event--example-incident-a--scope-crossed');
  const details = page.locator('#example-incident-a details');
  const event = page.locator('#event--example-incident-a--scope-crossed');
  await expect(details).toHaveAttribute('open', '');
  await expect(event).toBeInViewport();
  await expect(page.locator('article')).toHaveCount(3);
  await page.reload();
  await expect(details).toHaveAttribute('open', '');
  await expect(event).toBeInViewport();
});

test('imprecise and unknown events retain their evidence precision', async ({ page }) => {
  await page.goto('/');
  const incident = page.locator('#example-multiple-providers');
  await incident.locator('summary').click();
  await expect(incident.locator('li[id^="event--"]')).toHaveCount(3);
  await expect(incident.locator('#event--example-multiple-providers--shared-workflow-started')).toContainText('2026');
  await expect(incident.locator('#event--example-multiple-providers--credentials-revoked')).toContainText('Unknown');
  for (const link of await incident.locator('.event-citations a').all()) {
    const target = await link.getAttribute('href');
    await expect(page.locator(target!)).toHaveCount(1);
  }
});
