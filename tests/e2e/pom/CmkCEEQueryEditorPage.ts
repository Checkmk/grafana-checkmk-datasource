import { E2ESelectorGroups, PanelEditPage, expect } from '@grafana/plugin-e2e';
import { Locator, Page } from '@playwright/test';

import { CmkEdition, FilterTypes, GRAFANA_SELECTORS, Services } from '../constants';
import { CmkQueryEditorPage } from './CmkQueryEditorPage';

export class CmkCEEQueryEditorPage extends CmkQueryEditorPage {
  protected _edition: CmkEdition = CmkEdition.CEE;

  constructor(
    readonly page: Page,
    readonly selectors: E2ESelectorGroups,
    readonly grafanaPanelEditPage: PanelEditPage
  ) {
    super(page);
    this.grafanaPanelEditPage = grafanaPanelEditPage;
    this.selectors = selectors;
  }

  async filterByHostname(hostname: string) {
    await this.addFilter(FilterTypes.HOSTNAME);
    await this.page.getByLabel(FilterTypes.HOSTNAME, { exact: true }).fill(hostname);
    await this.expectSpinners(false);
    await this.page.keyboard.press('Enter');
    await this.page.getByLabel(FilterTypes.HOSTNAME, { exact: true }).blur();
    await this.expectSpinners(false);
  }

  async filterByHostnameRegex(hostnameRegex: string) {
    const testId = 'host_name_regex-filter-input';
    await this.addFilter(FilterTypes.HOSTNAME_REGEX, testId);
    await this.expectSpinners(false);
    await this.page.getByTestId(testId).fill(hostnameRegex);
    await this.expectSpinners(false);
    await this.page.keyboard.press('Enter');
    await this.expectSpinners(false);
  }

  async filterByServiceRegex(serviceRegex: string) {
    const testId = 'service_regex-filter-input';
    await this.addFilter(FilterTypes.SERVICE_REGEX, testId);
    await this.expectSpinners(false);
    await this.page.getByTestId(testId).fill(serviceRegex);
    await this.expectSpinners(false);
    await this.page.keyboard.press('Enter');
    await this.expectSpinners(false);
  }

  async filterByService(service: Services) {
    await this.addFilter(FilterTypes.SERVICE);
    await this.page.getByLabel('Service', { exact: true }).fill(service);
    await this.expectSpinners(false);
    await this.page.keyboard.press('Enter');
    await this.expectSpinners(false);
  }

  async filterByHostLabel(label: string) {
    await this.addFilter(FilterTypes.HOST_LABELS);
    await this.page.getByLabel(FilterTypes.HOST_LABELS, { exact: true }).fill(label);
    await this.expectSpinners(false);
    await this.page.keyboard.press('Enter');
    await this.expectSpinners(false);
  }

  async addFilter(filter: FilterTypes, testId: string | null = null) {
    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.FILTER_FIELD).click();
    await this.page.keyboard.type(filter);
    await this.page.keyboard.press('Enter', { delay: 300 });
    await this.expectSpinners(false);

    let component: Locator;
    if (testId) {
      component = this.page.getByTestId(testId);
    } else {
      component = this.page.getByLabel(filter, { exact: true });
    }

    await expect(component).toBeVisible();
  }

  async removeFilter(filter: FilterTypes) {
    const locator = GRAFANA_SELECTORS.DASHBOARD.REMOVE_FILTER(filter);
    await this.page.locator(locator).click();
  }

  async refreshGraph() {
    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.REFRESH_GRAPH_BUTTON).click();
    // await this.grafanaPanelEditPage.getByGrafanaSelector(this.selectors.components.RefreshPicker.runButtonV2).click();
  }
}
