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

  // The ticket price varies by day and showtime, so it is read from the summary
  // bar rather than assumed. Only meaningful once a seat is selected; before
  // that the bar reads RM 0.00.
  async ticketPrice(): Promise<string> {
    const price = this.page.getByText(/^\s*RM\s*\d+\.\d{2}\s*$/);
    return (await price.innerText()).trim();
  }

  // Once selected, the seat ID also appears in the summary bar, but the seat on
  // the map comes first in the DOM and is the one that toggles the selection.
  async deselectSeat(seatId: string): Promise<void> {
    await this.page.getByText(seatId, { exact: true }).first().click();
  }

  // The same control confirm() uses. With nothing selected it stays clickable
  // rather than being disabled, so the guard lives in the handler and the click
  // is expected to go nowhere.
  async attemptConfirmWithNoSeats(): Promise<void> {
    await this.page.getByText('Confirm - 0 ticket(s)', { exact: true }).click();
  }

  async confirm(): Promise<AddOnsPage> {
    // This label also appears inside the collapsed ticket-type panel, so match
    // on exact text rather than role to hit the summary bar's control.
    await this.page.getByText('Confirm - 1 ticket(s)', { exact: true }).click();
    await this.page.waitForURL(/\/e-combo/);
    return new AddOnsPage(this.page);
  }
}
