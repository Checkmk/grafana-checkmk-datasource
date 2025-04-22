import { expect, test } from '@grafana/plugin-e2e';

import current_config from '../config';
import {
  CmkEdition,
  CustomLabels,
  FilterTypes,
  GRAFANA_SELECTORS,
  GraphLegends,
  GraphTypes,
  HOSTNAME0,
  HOSTNAME1,
  Services,
  Sites,
} from '../constants';
import DashboardPage from '../models/DashboardPage';

test.describe('Commercial editions tests', () => {
  test.slow();

  test('time-usage panel by service (single host)', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.addNewPanel();
    await dashboardPage.selectDatasource(CmkEdition.CEE);

    await dashboardPage.addFilter(FilterTypes.HOSTNAME);
    await dashboardPage.filterByHostname(HOSTNAME0);

    await dashboardPage.addFilter(FilterTypes.SERVICE);
    await dashboardPage.filterByService(Services.CHECK_MK);

    await dashboardPage.selectPredefinedGraphType(GraphTypes.TIME_BY_PHASE);

    await dashboardPage.assertLegendElement(GraphLegends.CPU_TIME_IN_USER_SPACE);
    await dashboardPage.assertLegendElement(GraphLegends.CPU_TIME_IN_OS);
    await dashboardPage.assertLegendElement(GraphLegends.TIME_SPENT_WAITING_FOR_CHECKMK);
    await dashboardPage.assertLegendElement(GraphLegends.TOTAL_EXECUTION_TIME);

    await dashboardPage.assertHoverSelectorsOff(4);
    await dashboardPage.assertHoverSelectorsOn(4);

    await expect(page.getByText('Type to trigger search').first()).not.toBeVisible();
    await dashboardPage.removeFilter(FilterTypes.HOSTNAME);
    await dashboardPage.removeFilter(FilterTypes.SERVICE);
    await dashboardPage.addFilter(FilterTypes.SERVICE);

    await expect(page.getByText('Type to trigger search').first()).toBeVisible();

    await dashboardPage.saveDashboard();
  });

  test('time-usage panel by service (multiple hosts)', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.addNewPanel();
    await dashboardPage.selectDatasource(CmkEdition.CEE);

    await dashboardPage.addFilter(FilterTypes.SERVICE);
    await dashboardPage.filterByService(Services.CHECK_MK);

    await dashboardPage.addFilter(FilterTypes.HOSTNAME_REGEX);
    await dashboardPage.filterByHostnameRegex('localhost_grafana[0-9]+');

    await dashboardPage.selectPredefinedGraphType(GraphTypes.TIME_BY_PHASE);

    for (const host of [HOSTNAME0, HOSTNAME1]) {
      await dashboardPage.assertLegendElement(`${GraphLegends.CPU_TIME_IN_USER_SPACE}, ${host}`);
      await dashboardPage.assertLegendElement(`${GraphLegends.CPU_TIME_IN_OS}, ${host}`);
    }

    await dashboardPage.assertHoverSelectorsOff(8);
    await dashboardPage.assertHoverSelectorsOn(8);
    await dashboardPage.saveDashboard();
  });

  test('RAM-used panel by service regex (multiple hosts)', async ({ page }) => {
    // Disabled
    return;

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.addNewPanel();
    await dashboardPage.selectDatasource(CmkEdition.CEE);

    await dashboardPage.addFilter(FilterTypes.SERVICE_REGEX);
    await dashboardPage.filterByServiceRegex('Memory');

    await dashboardPage.addFilter(FilterTypes.HOSTNAME_REGEX);
    await dashboardPage.filterByHostnameRegex('localhost_grafana[0-9]+');

    await dashboardPage.expectSpinners(false);

    await dashboardPage.selectPredefinedGraphType(GraphTypes.RAM_USAGE);

    await dashboardPage.assertLegendElement(HOSTNAME0);
    await dashboardPage.assertLegendElement(HOSTNAME1);

    await dashboardPage.assertHoverSelectorsOff(2);
    await dashboardPage.assertHoverSelectorsOn(2);

    await dashboardPage.saveDashboard();
  });

  test('RAM-used panel by host labels (multiple hosts, single metric)', async ({ page }) => {
    // Disabled
    return;
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.addNewPanel();
    await dashboardPage.selectDatasource(CmkEdition.CEE);

    await dashboardPage.addFilter(FilterTypes.HOST_LABELS);
    await dashboardPage.filterByHostLabel(`cmk/site:${current_config.site}`);

    await dashboardPage.addFilter(FilterTypes.HOSTNAME_REGEX);
    await dashboardPage.filterByHostnameRegex('localhost_grafana[0-9]+');

    await dashboardPage.selectSingleGraphType();

    await dashboardPage.selectSingleMetricGraphType(GraphTypes.RAM_USAGE);

    await dashboardPage.assertLegendElement(HOSTNAME0);
    await dashboardPage.assertLegendElement(HOSTNAME1);

    await dashboardPage.assertHoverSelectorsOff(2);
    await dashboardPage.assertHoverSelectorsOn(2);

    await dashboardPage.saveDashboard();
  });

  test('RAM-used panel by service regex and hostname regex', async ({ page }) => {
    // Disabled
    return;

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.addNewPanel();
    await dashboardPage.selectDatasource(CmkEdition.CEE);

    await dashboardPage.addFilter(FilterTypes.SERVICE_REGEX);
    await dashboardPage.filterByServiceRegex('Memory');

    await dashboardPage.addFilter(FilterTypes.HOSTNAME_REGEX);
    await dashboardPage.filterByHostnameRegex(`${HOSTNAME0}|${HOSTNAME1}`);

    await dashboardPage.selectPredefinedGraphType(GraphTypes.RAM_USAGE);

    await dashboardPage.assertLegendElement(HOSTNAME0);
    await dashboardPage.assertLegendElement(HOSTNAME1);

    await dashboardPage.assertHoverSelectorsOff(2);
    await dashboardPage.assertHoverSelectorsOn(2);

    await dashboardPage.filterByHostnameRegex(HOSTNAME0);
    await dashboardPage.assertLegendElement('RAM usage');

    await dashboardPage.assertHoverSelectorsOff(1);
    await dashboardPage.assertHoverSelectorsOn(1);

    await dashboardPage.saveDashboard();
  });

  test('Uptime panel by hostname', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.addNewPanel();
    await dashboardPage.selectDatasource(CmkEdition.CEE);

    await dashboardPage.addFilter(FilterTypes.HOSTNAME);
    await dashboardPage.filterByHostname(HOSTNAME0);

    //Let's check the Uptime graph is not available on predefined graphs
    await page.locator(`input[id="${GRAFANA_SELECTORS.DASHBOARD.PREDEFINED_GRAPH_FIELD_ID}"]`).fill(GraphTypes.UPTIME);
    await expect(page.locator(GRAFANA_SELECTORS.SPINNER).first()).not.toBeVisible();
    await expect(page.getByText('No options found').first()).toBeVisible();
    await page.keyboard.press('Escape');

    await dashboardPage.selectSingleGraphType();
    await dashboardPage.selectSingleMetricGraphType(GraphTypes.UPTIME);

    await dashboardPage.assertLegendElement('Uptime');

    await dashboardPage.assertHoverSelectorsOff(1);
    await dashboardPage.assertHoverSelectorsOn(1);

    await dashboardPage.saveDashboard();
  });

  test('Custom labels', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.addNewPanel();
    await dashboardPage.selectDatasource(CmkEdition.CEE);

    await dashboardPage.addFilter(FilterTypes.HOSTNAME);
    await dashboardPage.filterByHostname(HOSTNAME0);

    await dashboardPage.selectPredefinedGraphType(GraphTypes.TIME_BY_PHASE);
    await dashboardPage.assertLegendElement(GraphLegends.CPU_TIME_IN_USER_SPACE);

    // $label shoud return the same label
    await dashboardPage.setCustomLabel(CustomLabels.ORIGINAL);
    await dashboardPage.refresGraph();
    await dashboardPage.assertLegendElement(GraphLegends.CPU_TIME_IN_USER_SPACE);

    // $label + constant
    await dashboardPage.setCustomLabel(`${CustomLabels.ORIGINAL} - LMP`);
    await dashboardPage.refresGraph();
    await dashboardPage.assertLegendElement(`${GraphLegends.CPU_TIME_IN_USER_SPACE} - LMP`);

    // $label + $host_name
    await dashboardPage.setCustomLabel(`${CustomLabels.ORIGINAL} - ${CustomLabels.HOSTNAME}`);
    await dashboardPage.refresGraph();
    await dashboardPage.assertLegendElement(`${GraphLegends.CPU_TIME_IN_USER_SPACE} - ${HOSTNAME0}`);

    await dashboardPage.saveDashboard();
  });
});

test.describe('RAW edition tests', () => {
  test.slow();
  test('time-usage panel by service (Single host)', async ({ page }, testInfo) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.addNewPanel();
    await dashboardPage.selectDatasource(CmkEdition.CRE);

    const timeout = testInfo.timeout;
    test.setTimeout(10000);
    await dashboardPage.expectSpinners(false);
    test.setTimeout(timeout);

    await dashboardPage.filterBySite(Sites.ALL_SITES);
    await dashboardPage.filterByHostname(HOSTNAME0);
    await dashboardPage.filterByService(Services.CHECK_MK);

    await dashboardPage.selectPredefinedGraphType(GraphTypes.TIME_BY_PHASE);

    await dashboardPage.assertLegendElement(GraphLegends.CPU_TIME_IN_USER_SPACE);
    await dashboardPage.assertLegendElement(GraphLegends.CPU_TIME_IN_OS);
    await dashboardPage.assertLegendElement(GraphLegends.TIME_SPENT_WAITING_FOR_CHECKMK);
    await dashboardPage.assertLegendElement(GraphLegends.TOTAL_EXECUTION_TIME);

    await dashboardPage.assertHoverSelectorsOff(4);
    await dashboardPage.assertHoverSelectorsOn(4);

    await expect(page.getByText("Could not find 'cmk_cpu_time_by_phase'").first()).not.toBeVisible();

    await dashboardPage.filterByService(Services.MEMORY_REGEX);

    await expect(page.getByText("Could not find 'cmk_cpu_time_by_phase'").first()).toBeVisible();

    await dashboardPage.saveDashboard();
  });

  test('RAM-used panel by service (single host)', async ({ page }, testInfo) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.addNewPanel();
    await dashboardPage.selectDatasource(CmkEdition.CRE);

    const timeout = testInfo.timeout;
    test.setTimeout(10000);
    await dashboardPage.expectSpinners(false);
    test.setTimeout(timeout);

    await dashboardPage.filterBySite(Sites.ALL_SITES);
    await dashboardPage.filterByHostname(HOSTNAME0);
    await dashboardPage.filterByService(Services.MEMORY_REGEX);

    await dashboardPage.selectPredefinedGraphType(GraphTypes.RAM_USAGE);
    await dashboardPage.assertLegendElement(GraphLegends.RAM_USAGE);

    await dashboardPage.assertHoverSelectorsOff(1);
    await dashboardPage.assertHoverSelectorsOn(1);

    await dashboardPage.saveDashboard();
  });
});

test.describe('Other tests', () => {
  test('Variables get rendered', async ({ page }) => {
    const customVariableName = 'MyVariable';
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goToNewDashboardSettings();
    await dashboardPage.addNewVariable(customVariableName);
    await dashboardPage.saveDashboard();
    await dashboardPage.goBackToDashboard();
    await dashboardPage.addVisualization();
    await dashboardPage.selectDatasource(CmkEdition.CEE);
    await dashboardPage.assertAggregationVariableExists(customVariableName);
  });
});
