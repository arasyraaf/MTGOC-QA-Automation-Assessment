import { Page } from '@playwright/test';
import { MoviePage } from './MoviePage.js';

export class MoviesListingPage {
  constructor(private readonly page: Page) {}

  async firstMovieTitle(): Promise<string> {
    return this.page.getByRole('heading', { level: 3 }).first().innerText();
  }

  async selectMovie(title: string): Promise<MoviePage> {
    // The same movie can also appear in an unrelated recommendations widget further
    // down the page, so .first() deliberately targets the primary listing above it.
    await this.page.getByRole('link', { name: title, exact: true }).first().click();
    return new MoviePage(this.page);
  }

  async selectFirstMovie(): Promise<MoviePage> {
    const title = await this.firstMovieTitle();
    return this.selectMovie(title);
  }
}
