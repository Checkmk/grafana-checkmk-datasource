import { expect, test } from '@grafana/plugin-e2e';

import config from '../config';
import { CmkEdition, GRAFANA_TEXT, HOSTNAME0, HOSTNAME1, TESTDATASOURCENAME0, TESTDATASOURCENAME1 } from '../constants';
import cmkRestAPI from '../lib/checkmk_rest_api';
import grafanaRestApi from '../lib/grafana_rest_api';
import { CmkDataSourceConfigPage } from '../pom/CmkDataSourceConfigPage';

const PLUGIN_ID = 'tribe-29-checkmk-datasource';

test.describe('Initialization', () => {
  test('Early setup', async () => {
    test.slow();
    await grafanaRestApi.deleteAllDatasources();

    await cmkRestAPI.waitUntilCheckmkIsReady();

    await cmkRestAPI.deleteCmkAutomationUser(false);
    await cmkRestAPI.createCmkAutomationUser();

    await Promise.all([cmkRestAPI.deleteHost(HOSTNAME0, false), cmkRestAPI.deleteHost(HOSTNAME1, false)]);
    await Promise.all([cmkRestAPI.createHost(HOSTNAME0), cmkRestAPI.createHost(HOSTNAME1)]);

    await cmkRestAPI.executeServiceDiscovery(HOSTNAME0, 'tabula_rasa');
    await cmkRestAPI.executeServiceDiscovery(HOSTNAME1, 'tabula_rasa');

    await cmkRestAPI.activateChanges(config.site!);
  });

  test.describe('Data source creation', () => {
    test('Should display connection success message', async ({ createDataSourceConfigPage, page, selectors }) => {
      const datasourcePage = new CmkDataSourceConfigPage(page, selectors);
      const configPage = await datasourcePage.addCmkDatasource(
        createDataSourceConfigPage,
        PLUGIN_ID,
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
        PLUGIN_ID,
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

  test('Remaining setup', async () => {
    await grafanaRestApi.deleteAllDatasources();
    await grafanaRestApi.createDatasource(
      CmkEdition.CEE,
      config.grafanaToCheckMkUrl!,
      config.grafanaToCheckMkUser!,
      config.grafanaToCheckMkPassword!
    );
    await grafanaRestApi.createDatasource(
      CmkEdition.CRE,
      config.grafanaToCheckMkUrl!,
      config.grafanaToCheckMkUser!,
      config.grafanaToCheckMkPassword!
    );

    test.setTimeout(0);
    await cmkRestAPI.waitForPendingServices(2000);
  });
});
