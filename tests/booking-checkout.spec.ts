import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SeatSelectionPage } from './pages/SeatSelectionPage.js';

process.loadEnvFile('.env');

test('booking a 2D seat without add-ons reaches review summary ready for checkout', async ({
  page,
  context,
}) => {
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
  await expect(bookingPage).toHaveURL(/\/seat-selection/);

  const seatSelection = new SeatSelectionPage(bookingPage);
  const seatId = await seatSelection.selectFirstAvailableSeat();

  await expect(bookingPage.getByText('Adult x 1', { exact: true })).toBeVisible();
  await expect(bookingPage.getByText('RM 15.00', { exact: true })).toBeVisible();
  await expect(bookingPage.getByText('Confirm - 1 ticket(s)', { exact: true })).toBeVisible();

  const addOns = await seatSelection.confirm();
  const reviewSummary = await addOns.skipAll();
  await reviewSummary.dismissRewardsPromoIfPresent();

  await expect(bookingPage).toHaveURL(/epaymentwebapp\.gsc\.com\.my\/review-summary/);
  await expect(reviewSummary.checkoutButton()).toBeVisible();
  await expect(bookingPage.getByText(seatId, { exact: true })).toBeVisible();
  await expect(bookingPage.getByText('Adult x 1', { exact: true })).toBeVisible();
  // Skipping both add-on steps must leave the total at the ticket price alone.
  await expect(bookingPage.getByText('RM 15.00', { exact: true }).first()).toBeVisible();
});
