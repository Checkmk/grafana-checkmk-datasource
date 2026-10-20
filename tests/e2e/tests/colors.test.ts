import { expect, test } from '@grafana/plugin-e2e';

import pluginInfo from '../../../src/plugin.json';
import config from '../config';
import {
  CmkEdition,
  GRAFANA_FIRST_SERIES_COLOR,
  GraphLegends,
  Graphs,
  HOSTNAME0,
  TESTDATASOURCENAME2,
} from '../constants';
import { CmkCEEQueryEditorPage } from '../pom/CmkCEEQueryEditorPage';
import { CmkDataSourceConfigPage } from '../pom/CmkDataSourceConfigPage';

test.describe('Metric colors', () => {
  test('query editor switch turns off Checkmk metric colors', async ({ page, selectors, panelEditPage }) => {
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, panelEditPage);
    await panelPage.addPanel();

    await panelPage.filterByHostname(HOSTNAME0);
    await panelPage.selectPredefinedGraph(Graphs.RAM_USAGE);
    await panelPage.assertLegendElement(GraphLegends.RAM_USAGE);
    await expect(panelPage.firstSeriesIcon()).not.toHaveCSS('background-color', GRAFANA_FIRST_SERIES_COLOR);

    await panelPage.setCheckmkMetricColors(false);
    await expect(panelPage.firstSeriesIcon()).toHaveCSS('background-color', GRAFANA_FIRST_SERIES_COLOR);
  });

  test('data source sets the default for new queries', async ({
    createDataSourceConfigPage,
    gotoDashboardPage,
    page,
    selectors,
  }) => {
    const datasourcePage = new CmkDataSourceConfigPage(page, selectors);
    await datasourcePage.addCmkDatasource(
      createDataSourceConfigPage,
      pluginInfo.id,
      config.grafanaToCheckMkUrl!,
      config.grafanaToCheckMkUser!,
      config.grafanaToCheckMkPassword!,
      CmkEdition.CEE,
      TESTDATASOURCENAME2,
      false
    );

    const dashboardPage = await gotoDashboardPage({});
    const panelPage = new CmkCEEQueryEditorPage(page, selectors, await dashboardPage.addPanel());
    await panelPage.addPanel(TESTDATASOURCENAME2);
    // Grafana keeps the query when switching between two Checkmk data sources, so start a new one.
    await panelPage.replaceQuery();
    await expect(panelPage.metricColorsSwitch()).not.toBeChecked();

    await panelPage.filterByHostname(HOSTNAME0);
    await panelPage.selectPredefinedGraph(Graphs.RAM_USAGE);
    await panelPage.assertLegendElement(GraphLegends.RAM_USAGE);
    await expect(panelPage.firstSeriesIcon()).toHaveCSS('background-color', GRAFANA_FIRST_SERIES_COLOR);
  });
});
