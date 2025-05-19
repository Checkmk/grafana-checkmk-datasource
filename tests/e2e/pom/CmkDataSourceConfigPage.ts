import { E2ESelectorGroups, PluginFixture } from '@grafana/plugin-e2e';
import { type Page, expect } from '@playwright/test';

import { CmkEdition } from '../constants';
import { CmkBasePage } from './CmkBasePage';

export class CmkDataSourceConfigPage extends CmkBasePage {
  readonly selectors: E2ESelectorGroups;

  constructor(page: Page, selectors: E2ESelectorGroups) {
    super(page);
    this.selectors = selectors;
  }

  addCmkDatasource = async (
    builder: PluginFixture['createDataSourceConfigPage'],
    datasourceId: string,
    url: string,
    cmkUser: string,
    cmkPassword: string,
    edition: CmkEdition,
    name: string
  ) => {
    const configPage = await builder({ type: datasourceId, name: name });
    await this.page.getByTestId('checkmk-url').fill(url);
    //await this.page.getByTestId('checkmk-edition-input').fill(edition);
    await this.page.locator('#checkmk-edition').fill(edition);
    await this.expectSpinners(false);
    await this.page.keyboard.press('Enter');

    await this.page.getByTestId('checkmk-username').fill(cmkUser);
    await this.page.getByTestId('checkmk-password').fill(cmkPassword);

    await configPage.getByGrafanaSelector(this.selectors.pages.DataSource.saveAndTest).click();
    await expect(configPage.getByGrafanaSelector(this.selectors.pages.DataSource.alert)).toBeVisible();

    return configPage;
  };
}
