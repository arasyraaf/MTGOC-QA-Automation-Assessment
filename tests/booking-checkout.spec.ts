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
  const movieTitle = await moviesListing.firstMovieTitle();
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
  const { cinema, showtime } = await seatSelection.bookingDetails();
  const seatId = await seatSelection.selectFirstAvailableSeat();

  await expect(bookingPage.getByText('Adult x 1', { exact: true })).toBeVisible();
  await expect(bookingPage.getByText('Confirm - 1 ticket(s)', { exact: true })).toBeVisible();

  // Priced per day and showtime, so it is carried forward from here rather than
  // hardcoded. These guards keep a mis-read from making the later checks vacuous.
  const ticketPrice = await seatSelection.ticketPrice();
  expect(ticketPrice).toMatch(/^RM \d+\.\d{2}$/);
  expect(ticketPrice).not.toBe('RM 0.00');

  const addOns = await seatSelection.confirm();
  const reviewSummary = await addOns.skipAll();
  await reviewSummary.dismissRewardsPromoIfPresent();

  await expect(bookingPage).toHaveURL(/epaymentwebapp\.gsc\.com\.my\/review-summary/);
  await expect(reviewSummary.checkoutButton()).toBeVisible();

  // The screening being paid for must be the one that was actually chosen, not
  // just any valid booking.
  await expect(bookingPage.getByText(movieTitle).first()).toBeVisible();
  await expect(bookingPage.getByText(cinema, { exact: true })).toBeVisible();
  await expect(bookingPage.getByText(showtime, { exact: true })).toBeVisible();
  await expect(bookingPage.getByText(seatId, { exact: true })).toBeVisible();

  await expect(bookingPage.getByText('Adult x 1', { exact: true })).toBeVisible();

  // Both add-on steps were skipped, so neither may contribute a charge and the
  // Total must still equal the price quoted back at seat selection. That price
  // renders on the Ticket(s) row as well as the Total row, so the total is the
  // later of the two.
  await expect(bookingPage.getByText('N/A', { exact: true })).toHaveCount(2);
  await expect(bookingPage.getByText(ticketPrice, { exact: true })).toHaveCount(2);
  await expect(bookingPage.getByText(ticketPrice, { exact: true }).last()).toBeVisible();
});
