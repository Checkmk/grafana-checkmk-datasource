import { E2ESelectorGroups, PanelEditPage } from '@grafana/plugin-e2e';
import { Page } from '@playwright/test';

import { CmkEdition } from '../constants';
import { CmkQueryEditorPage } from './CmkQueryEditorPage';

export class CmkRawQueryEditorPage extends CmkQueryEditorPage {
  protected _edition: CmkEdition = CmkEdition.CRE;

  constructor(
    readonly page: Page,
    readonly selectors: E2ESelectorGroups,
    readonly grafanaPanelEditPage: PanelEditPage
  ) {
    super(page);
    this.grafanaPanelEditPage = grafanaPanelEditPage;
    this.selectors = selectors;
  }

  async filterBySite(site: string) {
    await this._filterBy('Site', site);
  }

  async filterByHostname(hostname: string) {
    await this._filterBy('Hostname', hostname);
  }

  async filterByService(service: string) {
    await this._filterBy('Service', service);
  }

  async _filterBy(fieldLabel: string, value: string) {
    await this.page.getByLabel(fieldLabel).fill(value);
    await this.expectSpinners(false);
    await this.page.keyboard.press('Enter');
    await this.expectSpinners(false);
  }
}
