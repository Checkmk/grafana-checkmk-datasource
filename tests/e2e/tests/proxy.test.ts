import { expect, test } from '@grafana/plugin-e2e';

import config from '../config';
import { CmkEdition, HOSTNAME0 } from '../constants';
import grafanaRestApi from '../lib/grafana_rest_api';

const API = 'rest/check_mk/api/1.0';

test.describe('Data source proxy', () => {
  for (const [method, path, data] of [
    ['GET', `${API}/version`],
    ['GET', `${API}/domain-types/host/collections/all?columns=name`],
    ['POST', `${API}/objects/autocomplete/sites`, { value: '', parameters: {} }],
  ] as const) {
    test(`Should forward ${method} ${path}`, async () => {
      const response = await grafanaRestApi.proxyRequest(CmkEdition.CEE, method, path, data);
      expect(response.status()).toBe(200);
    });
  }

  test('Should list sites for the site variable without site management permission', async () => {
    const response = await grafanaRestApi.proxyRequest(CmkEdition.CEE, 'POST', `${API}/objects/autocomplete/sites`, {
      value: '',
      parameters: { strict: true },
    });
    expect(response.status()).toBe(200);
    const { choices } = await response.json();
    expect(choices.map((choice: { id: string }) => choice.id)).toEqual([config.site]);
  });

  for (const [method, path] of [
    ['GET', `${API}/objects/host_config/${HOSTNAME0}`],
    ['DELETE', `${API}/objects/host_config/${HOSTNAME0}`],
    ['GET', `${API}/domain-types/user_config/collections/all`],
    ['POST', `${API}/version`],
    ['GET', 'cmk/check_mk/view.py'],
    ['GET', 'check_mk/api/1.0/version'],
  ]) {
    test(`Should not forward ${method} ${path}`, async () => {
      const response = await grafanaRestApi.proxyRequest(CmkEdition.CEE, method, path);
      expect(response.ok()).toBeFalsy();
    });
  }
});
