// @ts-check
/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { test, expect } from '@playwright/test';
import cmkRestAPI from '../lib/checkmk_rest_api';
import grafanaRestAPI from '../lib/grafana_rest_api';
import config from '../config';
import LoginPage from '../models/LoginPage';
import DatasourceConfigPage from '../models/DatasourceConfigPage';
import { wait } from '../lib/util';
import { CMK_EDITION, GRAFANA_SELECTORS, GRAFANA_TEXT } from '../constants';

const DATASOURCENAME0 = 'cmk_test_datasource_0';
const DATASOURCENAME1 = 'cmk_test_datasource_1';

test.describe.configure({ mode: 'serial' });

test.describe('Datasource creation test', () => {
  test.beforeAll('Setup', async ({}, testInfo) => {
    if (testInfo.retry > 0) {
      console.log('🔁 Retrying test. Skipping beforeAll hook');
      return;
    }
    await cmkRestAPI.waitUntilCheckmkIsReady();
    await cmkRestAPI.deleteCmkAutomationUser(false);
    await cmkRestAPI.createCmkAutomationUser();
    await grafanaRestAPI.deleteDatasourcesByName([DATASOURCENAME0, DATASOURCENAME1]);
    console.log('✅ Initialization complete');
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.logout();
    await loginPage.login(config.grafanaUser, config.grafanaPassword);
  });

  test.afterEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.logout();
  });

  test.afterAll(async () => {
    await Promise.all([
      cmkRestAPI.deleteCmkAutomationUser(false),
      grafanaRestAPI.deleteDatasourcesByName([DATASOURCENAME0, DATASOURCENAME1]),
    ]);
    console.log('✅ Teardown complete');
  });

  test('Should display connection success message', async ({ page }) => {
    await wait(500);
    const datasourceConfigPage = new DatasourceConfigPage(page);
    await datasourceConfigPage.addCmkDatasource(
      config.grafanaToCheckMkUser,
      config.grafanaToCheckMkPassword,
      CMK_EDITION.CEE,
      DATASOURCENAME0
    );

    await expect(page.locator(GRAFANA_SELECTORS.DATASOURCE.SUCCESS)).toBeVisible();
    await expect(page.getByText(GRAFANA_TEXT.DATASOURCE_IS_WORKING)).toBeVisible();
  });

  test('Should display an edition mismatch warning', async ({ page }) => {
    await wait(500);
    const datasourceConfigPage = new DatasourceConfigPage(page);
    await datasourceConfigPage.addCmkDatasource(
      config.grafanaToCheckMkUser,
      config.grafanaToCheckMkPassword,
      CMK_EDITION.CRE,
      DATASOURCENAME1
    );

    await expect(page.getByText(GRAFANA_TEXT.EDITION_MISMATCH)).toBeVisible();
  });
});
