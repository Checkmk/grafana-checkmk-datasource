// @ts-check
/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { test, expect } from '@playwright/test';
import grafanaRestAPI from '../lib/grafana_rest_api';
import config from '../config';
import DatasourceConfigPage from '../models/DatasourceConfigPage';
import { wait } from '../lib/util';
import { CMK_EDITION, GRAFANA_SELECTORS, GRAFANA_TEXT, DATASOURCENAME0, DATASOURCENAME1 } from '../constants';

test.describe.configure({ mode: 'serial' });

test.describe('Datasource creation test', () => {
  test.afterAll(async () => {
    await grafanaRestAPI.deleteDatasourcesByName([DATASOURCENAME0, DATASOURCENAME1]);
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
