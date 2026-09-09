import { Page } from '@playwright/test';

export class ShowtimePage {
  constructor(public readonly page: Page) {}

  async selectFirst2DShowtime(): Promise<void> {
    const first2DShowtime = this.page
      .getByRole('button')
      .filter({ has: this.page.getByText('2D', { exact: true }) })
      .first();
    await first2DShowtime.click();
    await this.page.waitForURL(/\/(login|seat-selection)/);
  }
}
