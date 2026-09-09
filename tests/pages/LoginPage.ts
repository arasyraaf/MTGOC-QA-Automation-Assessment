import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('https://epaymentwebapp.gsc.com.my/login');
  }

  // The country code is chosen separately in its own control, so the national
  // leading zero has to come off the number itself.
  async submitCredentials(mobileNumber: string, password: string): Promise<void> {
    await this.page.locator('#phoneNo').fill(mobileNumber.replace(/^0/, ''));
    await this.page.locator('#password').fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async login(mobileNumber: string, password: string): Promise<void> {
    await this.submitCredentials(mobileNumber, password);

    // A one-time-per-session rewards dialog may appear after login and blocks
    // navigation until dismissed; it doesn't always show, so wait for either.
    const rewardDialog = this.page.getByRole('dialog', { name: 'Start Your Reward Journey' });
    await Promise.race([
      rewardDialog.waitFor({ state: 'visible' }),
      this.page.waitForURL(/\/seat-selection/),
    ]);

    if (await rewardDialog.isVisible()) {
      await rewardDialog.getByRole('button', { name: 'I Got It' }).click();
    }
  }
}
