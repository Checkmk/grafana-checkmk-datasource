// @ts-check

/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { test as teardown } from '@playwright/test';

import tests_config from '../config';
import { HOSTNAME0, HOSTNAME1 } from '../constants';
import cmkRestAPI from '../lib/checkmk_rest_api';
import grafanaRestApi from '../lib/grafana_rest_api';

teardown('Teardown Grafana and Checkmk', async ({}) => {
  await grafanaRestApi.deleteAllDatasources();

  await Promise.all([
    cmkRestAPI.deleteHost(HOSTNAME0),
    cmkRestAPI.deleteHost(HOSTNAME1),
    cmkRestAPI.deleteCmkAutomationUser(),
  ]);

  await cmkRestAPI.activateChanges(tests_config.site!);
});
