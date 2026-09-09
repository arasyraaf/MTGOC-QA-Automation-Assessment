import { BrowserContext, Page } from '@playwright/test';
import { ShowtimePage } from './ShowtimePage.js';

export class MoviePage {
  constructor(private readonly page: Page) {}

  async bookNow(context: BrowserContext): Promise<ShowtimePage> {
    // "Book Now" opens the booking flow in a new tab (target="_blank").
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      this.page.getByRole('link', { name: 'Book Now' }).click(),
    ]);
    await newPage.waitForLoadState();
    return new ShowtimePage(newPage);
  }
}
