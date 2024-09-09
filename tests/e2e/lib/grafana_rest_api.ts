import { APIRequestContext, expect, request } from '@playwright/test';
import { assert } from 'console';

import config from '../config';
import { CMK_EDITION } from '../constants';

// import { wait } from './util';

let requestContext: APIRequestContext;

(async () => {
  requestContext = await request.newContext({
    baseURL: config.grafanaUrl,
    httpCredentials: {
      username: config.grafanaUser!,
      password: config.grafanaPassword!,
      send: 'always',
    },
  });
})();

const createDatasource = async (edition: string, url: string, username: string, password: string) => {
  const apiUrl = 'api/datasources';

  const name = edition === CMK_EDITION.CEE ? CMK_EDITION.CEE : CMK_EDITION.CRE;
  const backend = 'rest';

  const response = await requestContext.post(apiUrl, {
    data: {
      type: 'tribe-29-checkmk-datasource',
      access: 'proxy',
      basicAuth: false,

      name: name,
      jsonData: {
        backend: backend,
        edition: edition === CMK_EDITION.CEE ? 'CEE' : 'RAW',
        url: url,
        username: username,
      },
      secureJsonData: {
        secret: password,
      },
    },
  });

  expect(response.ok()).toBeTruthy();
  console.log(`📊 ${name} datasource created`);
};

const deleteAllDatasources = async () => {
  await deleteDatasourcesByName();
};

const deleteDatasourcesByName = async (names: string[] | null = null) => {
  const url = 'api/datasources';
  let count = 0;

  const response = await requestContext.get(url, { failOnStatusCode: false });

  expect(response.status()).toBe(200);

  const datasources = await response.json();

  for (const ds of datasources) {
    if (names === null || names.includes(ds.name)) {
      const deleteResponse = await requestContext.delete(`${url}/uid/${ds.uid}`, { failOnStatusCode: false });
      expect(deleteResponse.ok()).toBeTruthy();
      count++;
    }
  }
  console.log(`📊 ${count} datasources removed`);
};

export default {
  createDatasource,
  deleteAllDatasources,
  deleteDatasourcesByName,
};
