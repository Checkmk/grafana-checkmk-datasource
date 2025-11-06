// @ts-check
import { expect, test } from '@grafana/plugin-e2e';

import config from '../config';
import { CustomLabels, FilterTypes, GraphLegends, Graphs, HOSTNAME0, HOSTNAME1, Services, Sites } from '../constants';
import { CmkRawQueryEditorPage } from '../pom/CMKRawQueryEditorPage';
import { CmkCEEQueryEditorPage } from '../pom/CmkCEEQueryEditorPage';

test.describe('Comercial editions tests', () => {
  test('time-usage panel by service (single host)', async ({ panelEditPage, page, selectors }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterByHostname(HOSTNAME0);
    await panelPage.filterByService(Services.CHECK_MK);

    await panelPage.selectPredefinedGraph(Graphs.TIME_BY_PHASE);

    await panelPage.assertLegendElement(GraphLegends.CPU_TIME_IN_USER_SPACE);
    await panelPage.assertLegendElement(GraphLegends.CPU_TIME_IN_OS);
    await panelPage.assertLegendElement(GraphLegends.TIME_SPENT_WAITING_FOR_CHECKMK);
    await panelPage.assertLegendElement(GraphLegends.TOTAL_EXECUTION_TIME);

    await expect(page.getByText('Type to trigger search').first()).not.toBeVisible();

    await panelPage.removeFilter(FilterTypes.HOSTNAME);
    await panelPage.removeFilter(FilterTypes.SERVICE);

    await panelPage.addFilter(FilterTypes.SERVICE);
    await expect(page.getByText('Type to trigger search').first()).toBeVisible();

    await panelPage.savePanel();
  });

  test('time-usage panel by service (multiple hosts)', async ({ page, selectors, panelEditPage }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterByService(Services.CHECK_MK);
    await panelPage.filterByHostnameRegex('localhost_grafana[0-9]+');

    await panelPage.selectPredefinedGraph(Graphs.TIME_BY_PHASE);

    for (const host of [HOSTNAME0, HOSTNAME1]) {
      await panelPage.assertLegendElement(`${GraphLegends.CPU_TIME_IN_USER_SPACE}, ${host}`);
      await panelPage.assertLegendElement(`${GraphLegends.CPU_TIME_IN_OS}, ${host}`);
    }

    await panelPage.savePanel();
  });

  test('RAM-used panel by service regex (multiple hosts)', async ({ page, selectors, panelEditPage }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterByService(Services.MEMORY_REGEX);
    await panelPage.filterByHostnameRegex('localhost_grafana[0-9]+');

    await panelPage.expectSpinners(false);

    await panelPage.selectPredefinedGraph(Graphs.RAM_USAGE);

    await panelPage.assertLegendElement(HOSTNAME0);
    await panelPage.assertLegendElement(HOSTNAME1);

    await panelPage.savePanel();
  });

  test('RAM-used panel by host labels (multiple hosts, single metric)', async ({ page, selectors, panelEditPage }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterByHostLabel(`cmk/site:${config.site}`);
    await panelPage.filterByHostnameRegex('localhost_grafana[0-9]+');

    await panelPage.selectSingleMetricGraphType();
    await panelPage.selectSingleMetricGraph(Graphs.RAM_USAGE);

    await panelPage.assertLegendElement(HOSTNAME0);
    await panelPage.assertLegendElement(HOSTNAME1);

    await panelPage.savePanel();
  });

  test('RAM-used panel by service regex and hostname regex', async ({ page, selectors, panelEditPage }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterByServiceRegex(Services.MEMORY_REGEX);
    await panelPage.filterByHostnameRegex(`${HOSTNAME0}|${HOSTNAME1}`);

    await panelPage.selectPredefinedGraph(Graphs.RAM_USAGE);

    await panelPage.assertLegendElement(HOSTNAME0);
    await panelPage.assertLegendElement(HOSTNAME1);

    await panelPage.removeFilter(FilterTypes.HOSTNAME_REGEX);
    await panelPage.filterByHostnameRegex(HOSTNAME0);

    await panelPage.assertLegendElement('RAM usage');

    await panelPage.savePanel();
  });

  test('Uptime panel by hostname', async ({ page, selectors, panelEditPage }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterByHostname(HOSTNAME0);

    //Let's check the "Up hosts" graph is not available on predefined graphs
    await panelPage.expectSpinners(false);
    const locator = page.getByLabel('Predefined graph');
    await locator.fill(Graphs.HOSTS_UP);
    await panelPage.expectSpinners(false);
    await expect(page.getByText('No options found').first()).toBeVisible();
    await page.keyboard.press('Escape');

    await panelPage.selectSingleMetricGraphType();
    await panelPage.selectSingleMetricGraph(Graphs.UPTIME);

    await panelPage.assertLegendElement('Uptime');

    await panelPage.savePanel();
  });

  test('Custom labels', async ({ page, selectors, panelEditPage }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterByHostname(HOSTNAME0);

    await panelPage.selectPredefinedGraph(Graphs.RAM_USAGE);

    // Default label
    await panelPage.assertLegendElement(GraphLegends.RAM_USAGE);

    // $label shoud return the same label
    await panelPage.setCustomLabel(CustomLabels.ORIGINAL);
    await panelPage.refreshGraph();
    await panelPage.assertLegendElement(GraphLegends.RAM_USAGE);

    // $label + constant
    await panelPage.setCustomLabel(`${CustomLabels.ORIGINAL} - LMP`);
    await panelPage.refreshGraph();
    await panelPage.assertLegendElement(`${GraphLegends.RAM_USAGE} - LMP`);

    // $label + $host_name
    await panelPage.setCustomLabel(`${CustomLabels.ORIGINAL} - ${CustomLabels.HOSTNAME}`);
    await panelPage.refreshGraph();
    await panelPage.assertLegendElement(`${GraphLegends.RAM_USAGE} - ${HOSTNAME0}`);

    await panelPage.savePanel();
  });
});

test.describe('Community edition tests', () => {
  test.slow();

  test('time-usage panel by service (Single host)', async ({ page, selectors, panelEditPage }, testInfo) => {
    const panelPage = new CmkRawQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    const timeout = testInfo.timeout;
    test.setTimeout(10000);
    await panelPage.expectSpinners(false);
    test.setTimeout(timeout);

    await panelPage.filterBySite(Sites.ALL_SITES);
    await panelPage.filterByHostname(HOSTNAME0);
    await panelPage.filterByService(Services.CHECK_MK);

    await panelPage.selectPredefinedGraph(Graphs.TIME_BY_PHASE);

    await panelPage.assertLegendElement(GraphLegends.CPU_TIME_IN_USER_SPACE);
    await panelPage.assertLegendElement(GraphLegends.CPU_TIME_IN_OS);
    await panelPage.assertLegendElement(GraphLegends.TIME_SPENT_WAITING_FOR_CHECKMK);
    await panelPage.assertLegendElement(GraphLegends.TOTAL_EXECUTION_TIME);

    await expect(page.getByText("Could not find 'cmk_cpu_time_by_phase'").first()).not.toBeVisible();

    await panelPage.filterByService(Services.MEMORY_REGEX);

    await expect(page.getByText("Could not find 'cmk_cpu_time_by_phase'").first()).toBeVisible();

    await panelPage.savePanel();
  });

  test('Used-RAM panel by service (single host)', async ({ page, selectors, panelEditPage }, testInfo) => {
    const panelPage = new CmkRawQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    const timeout = testInfo.timeout;
    test.setTimeout(10000);
    await panelPage.expectSpinners(false);
    test.setTimeout(timeout);

    await panelPage.filterBySite(Sites.ALL_SITES);
    await panelPage.filterByHostname(HOSTNAME0);
    await panelPage.filterByService(Services.MEMORY_REGEX);

    await panelPage.selectPredefinedGraph(Graphs.RAM_USAGE);
    await panelPage.assertLegendElement(GraphLegends.RAM_USAGE);

    await panelPage.savePanel();
  });
});

test.describe('General tests', () => {
  test.slow();
  test('Variables get rendered', async ({ page, selectors, panelEditPage }) => {
    const customVariableName = 'MyVariable';
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanelWithVariable('myVariable');
    await panelPage.assertAggregationVariableExists(customVariableName);
  });
});
