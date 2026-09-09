import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';

// A well-formed Malaysian mobile number that has no GSC account behind it.
// If it ever gets registered, swap it for another unused number.
const UNREGISTERED_MOBILE_NUMBER = '129999999';

test('logging in with an unregistered mobile number does not authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.submitCredentials(UNREGISTERED_MOBILE_NUMBER, 'WrongPassword123!');

  // An unrecognised number is treated as a new customer and sent to registration
  // rather than being shown an "account not found" error.
  await expect(page).toHaveURL(/epaymentwebapp\.gsc\.com\.my\/sign-up/);
  await expect(page.getByText('Full Name', { exact: true })).toBeVisible();
  await expect(page.getByText('Already a member?', { exact: true })).toBeVisible();
});
