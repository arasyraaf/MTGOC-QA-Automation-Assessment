import { Locator, Page } from '@playwright/test';

export class ReviewSummaryPage {
  constructor(public readonly page: Page) {}

  // The button label embeds a live seat-hold countdown ("Checkout & Pay
  // Time Left: 07:26"), so it can only be matched on the stable prefix.
  checkoutButton(): Locator {
    return this.page.getByRole('button', { name: /Checkout & Pay/ });
  }

  async dismissRewardsPromoIfPresent(): Promise<void> {
    const promoClose = this.page.getByRole('img', { name: 'close button' });

    await Promise.race([
      promoClose.waitFor({ state: 'visible' }),
      this.checkoutButton().waitFor({ state: 'visible' }),
    ]);

    if (await promoClose.isVisible()) {
      await promoClose.click();
    }
  }
}
