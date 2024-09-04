// @ts-check
/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { test } from '@playwright/test';
import tests_config from '../config';
import cmkRestAPI from '../lib/checkmk_rest_api';
import grafanaRestApi from '../lib/grafana_rest_api';

import { CMK_EDITION, HOSTNAME0, HOSTNAME1 } from '../constants';
import LoginPage from '../models/LoginPage';
import DashboardPage from '../models/DashboardPage';

export default function setHooks() {
  test.beforeAll('Checkmk setup', async ({}, testInfo) => {
    if (testInfo.retry > 0) {
      console.log('🔁 Retrying test. Skipping beforeAll hook');
      return;
    }

    test.setTimeout(300000);

    await cmkRestAPI.waitUntilCheckmkIsReady();

    test.setTimeout(0);

    await cmkRestAPI.deleteCmkAutomationUser(false);
    await cmkRestAPI.createCmkAutomationUser();

    await Promise.all([cmkRestAPI.deleteHost(HOSTNAME0, false), cmkRestAPI.deleteHost(HOSTNAME1, false)]);

    await Promise.all([cmkRestAPI.createHost(HOSTNAME0), cmkRestAPI.createHost(HOSTNAME1)]);

    await cmkRestAPI.executeServiceDiscovery(HOSTNAME0, 'tabula_rasa');
    await cmkRestAPI.executeServiceDiscovery(HOSTNAME1, 'tabula_rasa');

    await cmkRestAPI.activateChanges(tests_config.site);
    await cmkRestAPI.waitForPendingServices(2000);

    test.setTimeout(30000);

    console.log('✅ Checkmk initialization complete');
  });

  test.beforeAll('Grafana setup', async ({}, testInfo) => {
    if (testInfo.retry > 0) {
      console.log('🔁 Retrying test. Skipping beforeAll hook');
      return;
    }

    await grafanaRestApi.deleteAllDatasources();
    await grafanaRestApi.createDatasource(
      CMK_EDITION.CEE,
      tests_config.grafanaToCheckMkUrl,
      tests_config.grafanaToCheckMkUser,
      tests_config.grafanaToCheckMkPassword
    );
    await grafanaRestApi.createDatasource(
      CMK_EDITION.CRE,
      tests_config.grafanaToCheckMkUrl,
      tests_config.grafanaToCheckMkUser,
      tests_config.grafanaToCheckMkPassword
    );

    console.log('✅ Grafana initialization complete');
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.logout();
    await loginPage.login(tests_config.grafanaUser, tests_config.grafanaPassword);
    await dashboardPage.addNewPanel();

    console.log(`✅ Before test`);
  });

  test.afterEach(async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);

    await dashboardPage.saveDashboard();
    await loginPage.logout();

    console.log(`✅ After test`);
  });

  test.afterAll('Grafana teardown', async () => {
    // await grafanaRestApi.deleteAllDatasources();
    console.log('✅ Grafana teardown complete');
  });

  test.afterAll('Checkmk teardown', async () => {
    // await Promise.all([
    //     cmkRestAPI.deleteHost(HOSTNAME0),
    //     cmkRestAPI.deleteHost(HOSTNAME1),
    //     cmkRestAPI.deleteCmkAutomationUser()
    // ]);

    // await cmkRestAPI.activateChanges(tests_config.site);
    console.log('✅ Checkmk teardown complete');
  });
}
