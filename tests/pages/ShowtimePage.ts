import { Locator, Page } from '@playwright/test';

// The app reports its cutoff as "-5 minutes before showtimes", i.e. sales appear
// to close a few minutes *after* a screening starts. This buffer keeps the
// happy path clear of that boundary and leaves room for the journey to finish.
const BOOKING_BUFFER_MINUTES = 20;

// Conversely, a showtime must be well past that grace window before it is
// reliably rejected; one that started a minute ago can still reach checkout.
const PAST_CUTOFF_MARGIN_MINUTES = 30;

// Listings for "today" also carry after-midnight screenings (12:05AM and such).
// Those parse as early-morning times but are still hours away, so they must not
// be mistaken for screenings that have already started.
const EARLY_MORNING_MINUTES = 6 * 60;

function nowInKualaLumpurMinutes(): number {
  const [hours, minutes] = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .split(':')
    .map(Number);
  return (hours % 24) * 60 + minutes;
}

export class ShowtimePage {
  constructor(public readonly page: Page) {}

  private twoDShowtimes(): Locator {
    return this.page.getByRole('button').filter({ has: this.page.getByText('2D', { exact: true }) });
  }

  async selectFirstBookable2DShowtime(): Promise<void> {
    const showtime = (await this.firstShowtimeStillBookableToday()) ?? (await this.firstShowtimeOnNextDate());
    await showtime.click();
    await this.page.waitForURL(/\/(login|seat-selection)/);
  }

  // Picks the most recent screening that is safely past the sales cutoff: recent
  // enough to be a representative state, but not so recent that it falls inside
  // the grace window and can still be booked.
  async selectShowtimePastBookingCutoff(): Promise<void> {
    const showtimes = this.twoDShowtimes();
    const labels = await showtimes.allInnerTexts();
    const now = nowInKualaLumpurMinutes();
    const cutoff = now - PAST_CUTOFF_MARGIN_MINUTES;

    let closedIndex = -1;
    let closedAt = -1;
    labels.forEach((label, index) => {
      const startsAt = this.startTimeInMinutes(label);
      if (startsAt === null) return;
      if (startsAt < EARLY_MORNING_MINUTES && now >= EARLY_MORNING_MINUTES) return;

      if (startsAt <= cutoff && startsAt > closedAt) {
        closedAt = startsAt;
        closedIndex = index;
      }
    });

    if (closedIndex === -1) {
      throw new Error(
        `No 2D showtime started more than ${PAST_CUTOFF_MARGIN_MINUTES} minutes ago, so the ` +
          'booking cutoff cannot be exercised. This test needs to run once the day of ' +
          'screenings is under way (Malaysia time).',
      );
    }

    await showtimes.nth(closedIndex).click();
    await this.page.waitForURL(/\/(login|seat-selection)/);
  }

  private async firstShowtimeStillBookableToday(): Promise<Locator | null> {
    const showtimes = this.twoDShowtimes();
    const cutoff = nowInKualaLumpurMinutes() + BOOKING_BUFFER_MINUTES;

    for (let index = 0; index < (await showtimes.count()); index++) {
      const showtime = showtimes.nth(index);
      const startsAt = this.startTimeInMinutes(await showtime.innerText());
      if (startsAt !== null && startsAt >= cutoff) {
        return showtime;
      }
    }
    return null;
  }

  private async firstShowtimeOnNextDate(): Promise<Locator> {
    const dates = this.page
      .getByRole('button')
      .filter({ has: this.page.getByText(/^(MON|TUE|WED|THU|FRI|SAT|SUN)$/) });
    await dates.nth(1).click();

    const showtimes = this.twoDShowtimes();
    await showtimes.first().waitFor();
    return showtimes.first();
  }

  private startTimeInMinutes(label: string): number | null {
    const match = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;

    const hour = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
    return hour * 60 + Number(match[2]);
  }
}
