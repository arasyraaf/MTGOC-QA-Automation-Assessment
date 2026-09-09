import { test, expect } from '@playwright/test';

process.loadEnvFile('.env');

test('selecting a 2D showtime and logging in reaches seat selection', async ({ page, context }) => {
  await page.goto('https://www.gsc.com.my/');

  await page.getByRole('banner').getByRole('link', { name: 'Movies', exact: true }).click();
  await expect(page).toHaveURL(/\/movies\/now-showing/);

  const movieTitle = await page.getByRole('heading', { level: 3 }).first().innerText();
  // The same movie can also appear in an unrelated recommendations widget further
  // down the page, so .first() deliberately targets the primary listing above it.
  await page.getByRole('link', { name: movieTitle, exact: true }).first().click();
  await expect(page).toHaveURL(/gsc\.com\.my\/movie\//);

  // "Book Now" opens the booking flow in a new tab (target="_blank").
  const [showtimePage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'Book Now' }).click(),
  ]);
  await showtimePage.waitForLoadState();
  await expect(showtimePage).toHaveURL(/epaymentwebapp\.gsc\.com\.my\/showtime-by-movies/);

  const first2DShowtime = showtimePage
    .getByRole('button')
    .filter({ has: showtimePage.getByText('2D', { exact: true }) })
    .first();
  await first2DShowtime.click();

  await showtimePage.waitForURL(/\/(login|seat-selection)/);

  if (showtimePage.url().includes('/login')) {
    await showtimePage.locator('#phoneNo').fill(process.env.GSC_MOBILE_NUMBER!.replace(/^0/, ''));
    await showtimePage.locator('#password').fill(process.env.GSC_PASSWORD!);
    await showtimePage.getByRole('button', { name: 'Login' }).click();

    // A one-time-per-session rewards dialog may appear after login and blocks
    // navigation until dismissed; it doesn't always show, so wait for either.
    const rewardDialog = showtimePage.getByRole('dialog', { name: 'Start Your Reward Journey' });
    await Promise.race([
      rewardDialog.waitFor({ state: 'visible' }),
      showtimePage.waitForURL(/\/seat-selection/),
    ]);

    if (await rewardDialog.isVisible()) {
      await rewardDialog.getByRole('button', { name: 'I Got It' }).click();
    }
  }

  await expect(showtimePage).toHaveURL(/epaymentwebapp\.gsc\.com\.my\/seat-selection/);
});
