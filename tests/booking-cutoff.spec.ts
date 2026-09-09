import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SeatSelectionPage } from './pages/SeatSelectionPage.js';

process.loadEnvFile('.env');

test('a showtime that has already started is rejected before checkout', async ({ page, context }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  const moviesListing = await homePage.openMovies();
  const moviePage = await moviesListing.selectFirstMovie();

  const showtimePage = await moviePage.bookNow(context);
  await showtimePage.selectMostRecentlyStartedShowtime();

  if (showtimePage.page.url().includes('/login')) {
    const loginPage = new LoginPage(showtimePage.page);
    await loginPage.login(process.env.GSC_MOBILE_NUMBER!, process.env.GSC_PASSWORD!);
  }

  // Nothing rejects the booking up to this point: the seat map loads and a seat
  // can be held, even though the screening can no longer be sold.
  const bookingPage = showtimePage.page;
  const seatSelection = new SeatSelectionPage(bookingPage);
  await seatSelection.selectFirstAvailableSeat();

  const addOns = await seatSelection.confirm();
  await addOns.skipCombo();
  await addOns.attemptToLeaveUpselling();

  const bookingClosed = bookingPage
    .getByRole('dialog')
    .filter({ hasText: 'Unable to book your selected seat(s)' });

  await expect(bookingClosed).toBeVisible();
  await expect(bookingClosed.getByRole('button', { name: 'OK' })).toBeVisible();
  await expect(bookingPage).toHaveURL(/\/upselling/);
  await expect(bookingPage).not.toHaveURL(/\/review-summary/);
});
