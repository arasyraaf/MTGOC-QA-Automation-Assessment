import { Locator, Page } from '@playwright/test';
import { AddOnsPage } from './AddOnsPage.js';

export class SeatSelectionPage {
  constructor(public readonly page: Page) {}

  // Available seats render their seat ID as visible text (e.g. "L03"); occupied
  // ones render an icon instead, so matching the ID pattern selects only seats
  // that can actually be booked. The \s* is required: getByText does not
  // normalize whitespace for regex matches, and the IDs are padded (" L03 ").
  private availableSeats(): Locator {
    return this.page.getByText(/^\s*[A-Z]\d{2}\s*$/);
  }

  async selectFirstAvailableSeat(): Promise<string> {
    const seat = this.availableSeats().first();
    const seatId = (await seat.innerText()).trim();
    await seat.click();
    return seatId;
  }

  async confirm(): Promise<AddOnsPage> {
    // This label also appears inside the collapsed ticket-type panel, so match
    // on exact text rather than role to hit the summary bar's control.
    await this.page.getByText('Confirm - 1 ticket(s)', { exact: true }).click();
    await this.page.waitForURL(/\/e-combo/);
    return new AddOnsPage(this.page);
  }
}
