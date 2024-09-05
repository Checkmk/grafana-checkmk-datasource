// @ts-check
/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { test as teardown } from '@playwright/test';
import cmkRestAPI from '../lib/checkmk_rest_api';
import grafanaRestApi from '../lib/grafana_rest_api';
import tests_config from '../config';
import { HOSTNAME0, HOSTNAME1 } from '../constants';

teardown('Teardown Grafana and Checkmk', async ({}) => {
  console.log('▶️ Tearing down Grafana');
  await grafanaRestApi.deleteAllDatasources();

  console.log('✅ Grafana teardown complete');

  console.log('▶️ Tearing down Checkmk');

  await Promise.all([
    cmkRestAPI.deleteHost(HOSTNAME0),
    cmkRestAPI.deleteHost(HOSTNAME1),
    cmkRestAPI.deleteCmkAutomationUser(),
  ]);

  await cmkRestAPI.activateChanges(tests_config.site);
  console.log('✅ Checkmk teardown complete');
});
