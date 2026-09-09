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

  // The booking header renders the cinema directly above a "<date>, <time> at
  // <hall>" line, and neither carries a role, label or test id to target. They
  // are read from the rendered text here and asserted with real locators on the
  // page that follows.
  async bookingDetails(): Promise<{ cinema: string; showtime: string }> {
    // evaluate() does not auto-wait, so poll for the header to have rendered.
    await this.page.waitForFunction(() =>
      /\d{1,2}:\d{2}\s*(AM|PM)\s+at\s+/i.test(document.body.innerText),
    );

    return this.page.evaluate(() => {
      const lines = document.body.innerText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const showtimeIndex = lines.findIndex((line) => /\d{1,2}:\d{2}\s*(AM|PM)\s+at\s+/i.test(line));

      if (showtimeIndex < 1) {
        throw new Error('Could not read the cinema and showtime from the seat selection header');
      }
      return { cinema: lines[showtimeIndex - 1], showtime: lines[showtimeIndex] };
    });
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
