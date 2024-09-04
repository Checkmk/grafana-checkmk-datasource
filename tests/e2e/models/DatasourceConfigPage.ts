import { expect, type Page } from '@playwright/test';
import { GRAFANA_SELECTORS, CMK_SELECTORS, CMK_EDITION, GRAFANA_TEXT } from '../constants.ts';
import current_config from '../config';

export class DatasourceConfigPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(current_config.grafanaUrl + 'connections/datasources/new');
  }

  addCmkDatasource = async (cmkUser: string, cmkPassword: string, edition: string, name: string | null) => {
    await this.goto();

    const dsName = name || `Checkmk ${edition}`;

    await this.page.click(GRAFANA_SELECTORS.DATASOURCE.CHECKMK_DATASOURCE_BUTTON);

    await this.page.locator(CMK_SELECTORS.SETUP_FORM.NAME).fill(dsName);
    await this.page.locator(CMK_SELECTORS.SETUP_FORM.URL).fill(current_config.grafanaToCheckMkUrl);
    await this.page.locator(CMK_SELECTORS.SETUP_FORM.EDITION).fill(edition);
    await this.page.keyboard.press('Enter');

    await this.page.locator(CMK_SELECTORS.SETUP_FORM.USERNAME).fill(cmkUser);
    await this.page.locator(CMK_SELECTORS.SETUP_FORM.PASSWORD).fill(cmkPassword);
    await this.page.locator(CMK_SELECTORS.SETUP_FORM.VERSION).press('>');
    await this.page.keyboard.press('Enter');

    await this.page.click(GRAFANA_SELECTORS.DATASOURCE.SAVE_AND_TEST_BUTTON);    
  };
}

export default DatasourceConfigPage;
