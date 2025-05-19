import { expect } from '@grafana/plugin-e2e';
import { Page } from '@playwright/test';

import { GRAFANA_SELECTORS } from '../constants';

export class CmkBasePage {
  constructor(readonly page: Page) {
    this.page = page;
  }

  async expectSpinners(visible = true, timeout?: number) {
    const options = timeout ? { timeout } : {};
    const cmp = this.page.locator(GRAFANA_SELECTORS.SPINNER).first();
    if (visible) {
      await expect(cmp).toBeVisible();
    } else {
      await expect(cmp).not.toBeVisible(options);
    }
  }
}
