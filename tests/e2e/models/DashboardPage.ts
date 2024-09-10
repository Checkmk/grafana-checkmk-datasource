import { type Page, expect } from '@playwright/test';

import current_config from '../config';
import { FilterTypes, GRAFANA_SELECTORS, GRAFANA_TEXT, GraphTypes } from '../constants';

const CUSTOM_TIMEOUT = 30000;

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(current_config.grafanaUrl + 'dashboards');
  }

  async addNewPanel() {
    await this.page.goto(current_config.grafanaUrl + 'dashboard/new');
    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.ADD_NEW_DASHBOARD_BUTTON).click();
  }

  async saveDashboard() {
    const randInt = Math.floor(Math.random() * 1000).toString();

    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.APPLY_CHANGES_AND_SAVE_BUTTON).click();
    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.SAVE_DASHBOARD_TITLE).fill('Test Dashboard ' + randInt);
    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.SAVE_BUTTON).click();

    await expect(this.page.getByText(GRAFANA_TEXT.DASHBOARD_SAVED)).toBeVisible();
  }

  async selectDatasource(edition: string) {
    await this.page
      .locator(GRAFANA_SELECTORS.DASHBOARD.DATASOURCES_LIST)
      .locator('button')
      .filter({ hasText: edition })
      .click();

    await expect(this.page.getByText(edition)).toBeVisible();
  }

  async removeFilter(filter: FilterTypes) {
    const selector = GRAFANA_SELECTORS.DASHBOARD.REMOVE_FILTER(filter);
    await this.page.locator(selector).click();
    await expect(this.page.locator('label', { hasText: filter })).not.toBeVisible();
  }

  async addFilter(filter: FilterTypes) {
    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.FILTER_FIELD).click();
    await this.page.keyboard.type(filter);
    await this.page.keyboard.press('Enter');

    await expect(this.page.locator('label', { hasText: filter })).toBeVisible();
  }

  async expectSpinners(visible = true) {
    const cmp = this.page.locator(GRAFANA_SELECTORS.SPINNER).first();
    if (visible) {
      await expect(cmp).toBeVisible();
    } else {
      await expect(cmp).not.toBeVisible({ timeout: CUSTOM_TIMEOUT });
    }
  }

  async _addFilterBy(fieldSelector: string, value: string, findByInputValue = false) {
    await this.page.locator(fieldSelector).fill(value);
    await this.expectSpinners(false);
    await this.page.keyboard.press('Enter');
    await this.expectSpinners(false);

    await this.page.locator(fieldSelector).blur();

    if (findByInputValue) {
      await expect(this.page.locator(fieldSelector).first()).toHaveValue(value);
    } else {
      await expect(this.page.locator(`text="${value}"`).first()).toBeVisible({ timeout: CUSTOM_TIMEOUT });
    }
  }

  async filterBySite(site: string) {
    await this._addFilterBy(`input[id="${GRAFANA_SELECTORS.DASHBOARD.SITE_FILTER_FIELD_ID}"]`, site);
  }

  async filterByHostname(hostname: string) {
    await this._addFilterBy(`input[id="${GRAFANA_SELECTORS.DASHBOARD.HOST_NAME_FILTER_FIELD_ID}"]`, hostname);
  }

  async filterByHostnameRegex(hostnameRegex: string) {
    await this._addFilterBy(GRAFANA_SELECTORS.DASHBOARD.HOSTNAME_REGEX_FILTER_FIELD, hostnameRegex, true);
  }

  async filterByServiceRegex(serviceRegex: string) {
    await this._addFilterBy(GRAFANA_SELECTORS.DASHBOARD.SERVICE_REGEX_FILTER_FIELD, serviceRegex, true);
  }

  async filterByService(service: string) {
    await this._addFilterBy(`input[id="${GRAFANA_SELECTORS.DASHBOARD.SERVICE_FILTER_FIELD_ID}"]`, service);
  }

  async filterByHostLabel(hostLabel: string) {
    await this._addFilterBy(`input[id="${GRAFANA_SELECTORS.DASHBOARD.HOST_LABEL_FILTER_FIELD_ID}"]`, hostLabel);
  }

  async selectPredefinedGraphType(graphType: GraphTypes) {
    await this.expectSpinners(false);
    await this._addFilterBy(`input[id="${GRAFANA_SELECTORS.DASHBOARD.PREDEFINED_GRAPH_FIELD_ID}"]`, graphType);
  }

  async selectSingleGraphType() {
    await this.page.locator(`input[id="${GRAFANA_SELECTORS.DASHBOARD.GRAPH_TYPE_ID}"]`).click();
    await this.page.locator('span', { hasText: 'Single metric' }).click();
    await expect(
      this.page.locator(`input[id="${GRAFANA_SELECTORS.DASHBOARD.PREDEFINED_GRAPH_FIELD_ID}"]`)
    ).not.toBeVisible();
  }

  async selectSingleMetricGraphType(graphType: string) {
    await this._addFilterBy(`input[id="${GRAFANA_SELECTORS.DASHBOARD.SINGLE_METRIC_GRAPH_FIELD_ID}"]`, graphType);
  }

  async assertLegendElement(legendElement: string | RegExp) {
    await expect(
      this.page.locator(GRAFANA_SELECTORS.DASHBOARD.PANEL_CONTENT_SELECTOR).filter({ hasText: legendElement })
    ).toBeVisible();
  }

  async assertHoverSelectorsOn(nSelectors: number) {
    const locator = this.page.locator(GRAFANA_SELECTORS.DASHBOARD.PANEL_HOVER);
    const box = await locator.boundingBox();
    await this.page.mouse.click(box!.x + box!.width - 20, box!.y + box!.height / 6);

    await expect(this.page.locator(GRAFANA_SELECTORS.DASHBOARD.PLOTTED_HOVER_ON)).toHaveCount(nSelectors);
    await this.assertHoverSelectorsOff(0);
  }

  async assertHoverSelectorsOff(nSelectors: number) {
    await expect(this.page.locator(GRAFANA_SELECTORS.DASHBOARD.PLOTTED_HOVER_OFF)).toHaveCount(nSelectors);
  }

  async setCustomLabel(label: string) {
    await this._addFilterBy(GRAFANA_SELECTORS.DASHBOARD.CUSTOM_LABEL_FIELD, label, true);
  }

  async refresGraph() {
    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.REFRESH_GRAPH_BUTTON).click();
  }
}
export default DashboardPage;
