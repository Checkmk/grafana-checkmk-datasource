import { expect, test } from '@grafana/plugin-e2e';

import pluginInfo from '../../../src/plugin.json';
import config from '../config';
import { CmkEdition, GRAFANA_TEXT, TESTDATASOURCENAME0, TESTDATASOURCENAME1 } from '../constants';
import { CmkDataSourceConfigPage } from '../pom/CmkDataSourceConfigPage';

test.describe('Data source creation', () => {
  test('Should display connection success message', async ({ createDataSourceConfigPage, page, selectors }) => {
    const datasourcePage = new CmkDataSourceConfigPage(page, selectors);
    const configPage = await datasourcePage.addCmkDatasource(
      createDataSourceConfigPage,
      pluginInfo.id,
      config.grafanaToCheckMkUrl!,
      config.grafanaToCheckMkUser!,
      config.grafanaToCheckMkPassword!,
      CmkEdition.CEE,
      TESTDATASOURCENAME0
    );

    await expect(configPage.getByGrafanaSelector(selectors.pages.DataSource.alert)).toContainText(
      GRAFANA_TEXT.DATASOURCE_IS_WORKING
    );
  });

  test('Should display an edition mismatch warning', async ({ createDataSourceConfigPage, page, selectors }) => {
    const datasourcePage = new CmkDataSourceConfigPage(page, selectors);
    const configPage = await datasourcePage.addCmkDatasource(
      createDataSourceConfigPage,
      pluginInfo.id,
      config.grafanaToCheckMkUrl!,
      config.grafanaToCheckMkUser!,
      config.grafanaToCheckMkPassword!,
      CmkEdition.CRE,
      TESTDATASOURCENAME1
    );

    await expect(configPage.getByGrafanaSelector(selectors.pages.DataSource.alert)).toContainText(
      GRAFANA_TEXT.EDITION_MISMATCH
    );
  });
});
