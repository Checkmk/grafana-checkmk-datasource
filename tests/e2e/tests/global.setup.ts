// @ts-check

/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { test as setup } from '@playwright/test';

import tests_config from '../config';
import { CMK_EDITION, HOSTNAME0, HOSTNAME1 } from '../constants';
import cmkRestAPI from '../lib/checkmk_rest_api';
import grafanaRestApi from '../lib/grafana_rest_api';

setup('Set up Grafana and Checkmk', async ({}) => {
  console.log('▶️ Setting up Grafana');

  await grafanaRestApi.deleteAllDatasources();
  await grafanaRestApi.createDatasource(
    CMK_EDITION.CEE,
    tests_config.grafanaToCheckMkUrl!,
    tests_config.grafanaToCheckMkUser!,
    tests_config.grafanaToCheckMkPassword!
  );
  await grafanaRestApi.createDatasource(
    CMK_EDITION.CRE,
    tests_config.grafanaToCheckMkUrl!,
    tests_config.grafanaToCheckMkUser!,
    tests_config.grafanaToCheckMkPassword!
  );
  console.log('✅ Grafana setup complete');

  console.log('▶️ Setting up Checkmk');

  setup.setTimeout(0);
  await cmkRestAPI.waitUntilCheckmkIsReady();

  setup.setTimeout(300000);

  await cmkRestAPI.deleteCmkAutomationUser(false);
  await cmkRestAPI.createCmkAutomationUser();

  await Promise.all([cmkRestAPI.deleteHost(HOSTNAME0, false), cmkRestAPI.deleteHost(HOSTNAME1, false)]);

  await Promise.all([cmkRestAPI.createHost(HOSTNAME0), cmkRestAPI.createHost(HOSTNAME1)]);

  await cmkRestAPI.executeServiceDiscovery(HOSTNAME0, 'tabula_rasa');
  await cmkRestAPI.executeServiceDiscovery(HOSTNAME1, 'tabula_rasa');

  await cmkRestAPI.activateChanges(tests_config.site!);
  await cmkRestAPI.waitForPendingServices(2000);

  console.log('✅ Checkmk initialization complete');
});
