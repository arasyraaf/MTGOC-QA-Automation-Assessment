import { Page } from '@playwright/test';
import { MoviesListingPage } from './MoviesListingPage.js';

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    // Waits for 'load' deliberately: this is a Nuxt SSR app, and continuing at
    // domcontentloaded clicks nav links before hydration attaches, so they no-op.
    await this.page.goto('https://www.gsc.com.my/');
  }

  async openMovies(): Promise<MoviesListingPage> {
    await this.page.getByRole('banner').getByRole('link', { name: 'Movies', exact: true }).click();
    return new MoviesListingPage(this.page);
  }
}
