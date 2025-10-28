// @ts-check
/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { test } from '@playwright/test';

import grafanaRestApi from '../lib/grafana_rest_api';

test('Teardown Grafana', async ({}) => {
  // await grafanaRestApi.deleteAllDatasources();
});
