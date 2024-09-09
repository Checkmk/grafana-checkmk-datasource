// @ts-check

/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { expect, test } from '@playwright/test';

import config from '../config';
import { CMK_EDITION, DATASOURCENAME0, DATASOURCENAME1, GRAFANA_SELECTORS, GRAFANA_TEXT } from '../constants';
import grafanaRestAPI from '../lib/grafana_rest_api';
import { wait } from '../lib/util';
import DatasourceConfigPage from '../models/DatasourceConfigPage';

test.describe.configure({ mode: 'serial' });

test.describe('Datasource creation test', () => {
  test.afterAll(async () => {
    await grafanaRestAPI.deleteDatasourcesByName([DATASOURCENAME0, DATASOURCENAME1]);
  });

  test('Should display connection success message', async ({ page }) => {
    await wait(500);
    const datasourceConfigPage = new DatasourceConfigPage(page);
    await datasourceConfigPage.addCmkDatasource(
      config.grafanaToCheckMkUser!,
      config.grafanaToCheckMkPassword!,
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
      config.grafanaToCheckMkUser!,
      config.grafanaToCheckMkPassword!,
      CMK_EDITION.CRE,
      DATASOURCENAME1
    );

    await expect(page.getByText(GRAFANA_TEXT.EDITION_MISMATCH)).toBeVisible();
  });
});
