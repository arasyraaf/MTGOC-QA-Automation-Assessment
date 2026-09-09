import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';

process.loadEnvFile('.env');

test('selecting a 2D showtime and logging in reaches seat selection', async ({ page, context }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  const moviesListing = await homePage.openMovies();
  await expect(page).toHaveURL(/\/movies\/now-showing/);

  const moviePage = await moviesListing.selectFirstMovie();
  await expect(page).toHaveURL(/gsc\.com\.my\/movie\//);

  const showtimePage = await moviePage.bookNow(context);
  await expect(showtimePage.page).toHaveURL(/epaymentwebapp\.gsc\.com\.my\/showtime-by-movies/);

  await showtimePage.selectFirstBookable2DShowtime();

  if (showtimePage.page.url().includes('/login')) {
    const loginPage = new LoginPage(showtimePage.page);
    await loginPage.login(process.env.GSC_MOBILE_NUMBER!, process.env.GSC_PASSWORD!);
  }

  await expect(showtimePage.page).toHaveURL(/epaymentwebapp\.gsc\.com\.my\/seat-selection/);
});
