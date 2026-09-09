import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage.js';

test('navigating to Movies and selecting a movie reaches its movie page', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  const moviesListing = await homePage.openMovies();
  await expect(page).toHaveURL(/\/movies\/now-showing/);

  await moviesListing.selectFirstMovie();
  await expect(page).toHaveURL(/gsc\.com\.my\/movie\//);
});
