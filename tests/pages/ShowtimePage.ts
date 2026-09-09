import { Locator, Page } from '@playwright/test';

// Online bookings close ~5 minutes before a showtime starts, so a showtime that
// has already begun still renders a seat map but is rejected at the final step.
// The buffer also leaves room for the rest of the journey to complete.
const BOOKING_BUFFER_MINUTES = 20;

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
