import { E2ESelectorGroups, PanelEditPage, expect } from '@grafana/plugin-e2e';
import { Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

import { CmkEdition, GRAFANA_SELECTORS, GRAFANA_TEXT, GraphTypes, Graphs } from '../constants';
import { wait } from '../lib/util';
import { CmkBasePage } from './CmkBasePage';

export class CmkQueryEditorPage extends CmkBasePage {
  protected _edition: CmkEdition | null = null;

  constructor(
    readonly page: Page,
    readonly selectors: E2ESelectorGroups,
    readonly grafanaPanelEditPage: PanelEditPage
  ) {
    super(page);
  }

  async addPanel() {
    await this._selectDataSource();
  }

  async _selectDataSource() {
    await this.grafanaPanelEditPage.getByGrafanaSelector(this.selectors.components.DataSourcePicker.container).click();
    await this.page.keyboard.type(this._edition!);
    await this.page.keyboard.press('Enter');
  }

  async savePanel(name: string | null = null) {
    if (name == null) {
      name = 'Test Dashboard ' + uuidv4();
    }

    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.APPLY_CHANGES_AND_SAVE_BUTTON).click();
    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.SAVE_DASHBOARD_TITLE).fill(name);
    await this.page.locator(GRAFANA_SELECTORS.DASHBOARD.SAVE_BUTTON).click();

    await expect(this.page.getByText(GRAFANA_TEXT.DASHBOARD_SAVED)).toBeVisible();
  }

  async selectSingleMetricGraphType() {
    await this._selectGraphType(GraphTypes.SINGLE_METRIC);
  }

  async selectPredefinedGraphType() {
    await this._selectGraphType(GraphTypes.PREDEFINED);
  }

  async _selectGraphType(graphType: GraphTypes) {
    await this.expectSpinners(false);
    const locator = this.page.locator('#input_Graph_type');
    await locator.click();
    await this.page.locator('span', { hasText: graphType }).click();
    await this.expectSpinners(false);
  }

  async selectSingleMetricGraph(singleMetricGraph: Graphs) {
    await this._selectGraph('Single metric', singleMetricGraph);
  }

  async selectPredefinedGraph(predefinedGraph: Graphs) {
    await this._selectGraph('Predefined graph', predefinedGraph);
  }

  async _selectGraph(componentLabel: string, graph: Graphs) {
    await wait(1000);
    const locator = this.page.getByLabel(componentLabel, { exact: true });
    await this.expectSpinners(false);
    await locator.fill(graph);
    await this.expectSpinners(false);
    await this.expectLoadingOptions(false);
    await this.page.keyboard.press('Enter');
    await locator.blur();
  }

  async expectLoadingOptions(loading = true, timeout?: number) {
    const options = timeout ? { timeout } : {};
    const cmp = this.page.locator(GRAFANA_SELECTORS.SELECT_LOADING_MESSAGE).first();
    if (loading) {
      await expect(cmp).toBeVisible();
    } else {
      await expect(cmp).not.toBeVisible(options);
    }
  }

  async setCustomLabel(label: string) {
    await this.page.getByTestId(GRAFANA_SELECTORS.DASHBOARD.CUSTOM_LABEL_FIELD).fill(label);
    await this.page.keyboard.press('Enter');
    await this.expectSpinners(false);
  }

  async assertLegendElement(legend: string) {
    await this.expectSpinners(false);
    await expect(
      this.page.locator(GRAFANA_SELECTORS.DASHBOARD.PANEL_CONTENT_SELECTOR).filter({ hasText: legend })
    ).toBeVisible();
  }

  async assertAggregationVariableExists(variableName: string) {
    const fieldSelector = `input[id="${GRAFANA_SELECTORS.DASHBOARD.AGGREGATION_FIELD_ID}"]`;
    await this.page.locator(fieldSelector).fill(variableName);
    await this.expectSpinners(false);
    await this.page.keyboard.press('Enter');
    await this.expectSpinners(false);
    await expect(this.page.getByText(variableName).first()).toBeVisible();
  }
}
