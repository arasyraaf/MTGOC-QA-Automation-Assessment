import { Page } from '@playwright/test';
import { ReviewSummaryPage } from './ReviewSummaryPage.js';

export class AddOnsPage {
  constructor(public readonly page: Page) {}

  // /e-combo and /upselling are both optional extras behind an identical
  // "Total - 0 item(s)" bar whose button is labelled with the running F&B total.
  async skipAll(): Promise<ReviewSummaryPage> {
    await this.skipCombo();
    return this.skipUpselling();
  }

  async skipCombo(): Promise<void> {
    await this.proceedWithoutAdding();
    await this.page.waitForURL(/\/upselling/);
  }

  async skipUpselling(): Promise<ReviewSummaryPage> {
    await this.proceedWithoutAdding();
    await this.page.waitForURL(/\/review-summary/);
    return new ReviewSummaryPage(this.page);
  }

  private async proceedWithoutAdding(): Promise<void> {
    await this.page.getByRole('button', { name: 'RM 0.00' }).click();
  }
}
