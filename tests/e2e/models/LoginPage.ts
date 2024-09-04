import { type Page } from '@playwright/test';
import { GRAFANA_SELECTORS } from '../constants.ts';
import current_config from '../config';
import { wait } from '../lib/util.ts';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(current_config.grafanaUrl + 'login');
    await this.page.waitForURL(current_config.grafanaUrl + 'login');
  }

  async login(username: string, password: string) {
    await this.goto();
    await this.page.goto(current_config.grafanaUrl);
    await this.page.locator(GRAFANA_SELECTORS.LOGIN.USERNAME_FIELD).fill(username);
    await this.page.locator(GRAFANA_SELECTORS.LOGIN.PASSWORD_FIELD).fill(password);
    await this.page.locator(GRAFANA_SELECTORS.LOGIN.LOGIN_BUTTON).click();
    await wait(1000);
  }

  async logout() {
    await this.page.goto(current_config.grafanaUrl + 'logout');
  }
}

export default LoginPage;
