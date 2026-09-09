import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SeatSelectionPage } from './pages/SeatSelectionPage.js';

process.loadEnvFile('.env');

test('deselecting a seat clears the summary and blocks checkout', async ({ page, context }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  const moviesListing = await homePage.openMovies();
  const moviePage = await moviesListing.selectFirstMovie();

  const showtimePage = await moviePage.bookNow(context);
  await showtimePage.selectFirstBookable2DShowtime();

  if (showtimePage.page.url().includes('/login')) {
    const loginPage = new LoginPage(showtimePage.page);
    await loginPage.login(process.env.GSC_MOBILE_NUMBER!, process.env.GSC_PASSWORD!);
  }

  const bookingPage = showtimePage.page;
  const seatSelection = new SeatSelectionPage(bookingPage);

  const seatId = await seatSelection.selectFirstAvailableSeat();
  await expect(bookingPage.getByText('Adult x 1', { exact: true })).toBeVisible();
  await expect(bookingPage.getByText('RM 15.00', { exact: true })).toBeVisible();
  await expect(bookingPage.getByText('Confirm - 1 ticket(s)', { exact: true })).toBeVisible();

  await seatSelection.deselectSeat(seatId);

  await expect(bookingPage.getByText('Confirm - 0 ticket(s)', { exact: true })).toBeVisible();
  await expect(bookingPage.getByText('Adult x 1', { exact: true })).toBeHidden();
  await expect(bookingPage.getByText('RM 15.00', { exact: true })).toBeHidden();

  await seatSelection.attemptConfirmWithNoSeats();

  await expect(bookingPage).toHaveURL(/\/seat-selection/);
  await expect(bookingPage).not.toHaveURL(/\/e-combo/);
});
