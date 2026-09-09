import { test, expect } from '@playwright/test';

test('navigating to Movies and selecting a movie reaches its movie page', async ({ page }) => {
  await page.goto('https://www.gsc.com.my/');

  await page.getByRole('banner').getByRole('link', { name: 'Movies', exact: true }).click();
  await expect(page).toHaveURL(/\/movies\/now-showing/);

  const movieTitle = await page.getByRole('heading', { level: 3 }).first().innerText();
  // The same movie can also appear in an unrelated recommendations widget further
  // down the page, so .first() deliberately targets the primary listing above it.
  await page.getByRole('link', { name: movieTitle, exact: true }).first().click();

  await expect(page).toHaveURL(/gsc\.com\.my\/movie\//);
});
