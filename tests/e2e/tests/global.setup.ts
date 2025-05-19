import { expect, test } from '@grafana/plugin-e2e';

import config from '../config';
import { CmkEdition, HOSTNAME0, HOSTNAME1 } from '../constants';
import cmkRestAPI from '../lib/checkmk_rest_api';
import grafanaRestApi from '../lib/grafana_rest_api';

test('Setup Granana', async () => {
  test.slow();
  await grafanaRestApi.deleteAllDatasources();
  const ceeDataSourcePromise = grafanaRestApi.createDatasource(
    CmkEdition.CEE,
    config.grafanaToCheckMkUrl!,
    config.grafanaToCheckMkUser!,
    config.grafanaToCheckMkPassword!
  );
  const rawDataSourcePromise = grafanaRestApi.createDatasource(
    CmkEdition.CRE,
    config.grafanaToCheckMkUrl!,
    config.grafanaToCheckMkUser!,
    config.grafanaToCheckMkPassword!
  );

  const waitForCheckmkPromise = cmkRestAPI.waitUntilAutomationIsReady();

  await Promise.all([ceeDataSourcePromise, rawDataSourcePromise, waitForCheckmkPromise]);
});
