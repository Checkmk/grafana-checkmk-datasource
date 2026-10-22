import { dateTime } from '@grafana/data';
import { BackendSrvRequest } from '@grafana/runtime';
import { expect } from '@jest/globals';
import { EditionFamily } from 'edition';
import { cloneDeep } from 'lodash';
import path from 'path';
import { of } from 'rxjs';

import RestApiBackend from '../../src/backend/rest';
import plugin from '../../src/plugin.json';
import { CmkQuery } from '../../src/types';

const PROXY_URL = '/api/datasources/proxy/uid/abc';

type Route = (typeof plugin.routes)[number];

const responses: Record<string, unknown> = {
  version: { versions: { checkmk: '2.5.0p1' }, edition: 'community' },
  collection: { value: [] },
  graph: { time_range: { start: '2026-01-01T00:00:00Z', end: '2026-01-01T00:00:00Z' }, step: 60, metrics: [] },
  autocomplete: { choices: [] },
};

const requests: BackendSrvRequest[] = [];

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getTemplateSrv: () => ({ replace: (value: string) => value }),
  getBackendSrv: () => ({
    fetch: (request: BackendSrvRequest) => {
      requests.push(request);
      const url: string = request.url;
      let data = responses.collection;
      if (url.endsWith('/version')) {
        data = responses.version;
      } else if (url.endsWith('/invoke')) {
        data = responses.graph;
      } else if (url.includes('/objects/autocomplete/')) {
        data = responses.autocomplete;
      }
      return of({ data, headers: new Headers() });
    },
  }),
}));

// Same matching as Grafana's data source proxy: method, then prefix of the cleaned path
const cleanRelativePath = (p: string): string => path.posix.normalize(`/${p}`).replace(/^\/+/, '').replace(/\/+$/, '');

const matchRoute = (method: string, proxyPath: string): Route | undefined =>
  plugin.routes.find(
    (route) =>
      (route.method === undefined || route.method === method) &&
      cleanRelativePath(proxyPath).startsWith(cleanRelativePath(route.path))
  );

const forwardedUrl = (route: Route, proxyPath: string): string =>
  route.url.replace('{{ .JsonData.url }}', 'https://checkmk.example/site') + proxyPath.slice(route.path.length);

const createBackend = (family: EditionFamily) =>
  new RestApiBackend({
    getEdition: () => (family === EditionFamily.COMMUNITY ? 'RAW' : 'CEE'),
    getUrl: () => PROXY_URL,
    getEditionFamily: () => family,
  });

const graphQuery = {
  refId: 'A',
  requestSpec: {
    graph_type: 'predefined_graph',
    graph: 'cpu_load',
    site: 'site1',
    host_name: 'host1',
    service: 'CPU load',
  },
} as unknown as CmkQuery;

const range = () => ({ from: dateTime(0), to: dateTime(60000), raw: { from: 'now-1m', to: 'now' } });

const sendAllRequests = async (family: EditionFamily) => {
  const backend = createBackend(family);
  responses.version = {
    versions: { checkmk: '2.5.0p1' },
    edition: family === EditionFamily.COMMUNITY ? 'community' : 'ultimate',
  };
  await backend.testDatasource();
  await backend.metricFindQuery({ objectType: 'site' } as never);
  await backend.metricFindQuery({ objectType: 'host', filter: {} } as never);
  await backend.metricFindQuery({ objectType: 'service', filter: {} } as never);
  await backend.getSingleGraph(range(), cloneDeep(graphQuery));
  await backend.autocompleterRequest({ ident: 'sites', value: '', params: {} });
};

describe('Plugin proxy routes', () => {
  beforeEach(() => {
    requests.length = 0;
  });

  it.each([EditionFamily.COMMUNITY, EditionFamily.COMMERCIAL])(
    'cover every request the %s backend sends',
    async (family) => {
      await sendAllRequests(family);
      expect(requests.length).toBeGreaterThan(0);

      for (const request of requests) {
        expect(request.url.startsWith(`${PROXY_URL}/`)).toBe(true);
        const proxyPath = request.url.slice(PROXY_URL.length + 1);
        const route = matchRoute(request.method!, proxyPath);
        expect({ request: `${request.method} ${proxyPath}`, matched: route !== undefined }).toEqual({
          request: `${request.method} ${proxyPath}`,
          matched: true,
        });
        expect(forwardedUrl(route!, proxyPath)).toBe(`https://checkmk.example/site/${proxyPath.slice('rest/'.length)}`);
      }
    }
  );

  it('only define routes with a method and the REST API path', () => {
    for (const route of plugin.routes) {
      expect(['GET', 'POST']).toContain(route.method);
      expect(route.path.startsWith('rest/check_mk/api/1.0/')).toBe(true);
      expect(route.url).toBe(`{{ .JsonData.url }}/${route.path.slice('rest/'.length)}`);
    }
  });

  it.each([
    ['GET', 'rest/check_mk/api/1.0/objects/host_config/host1'],
    ['GET', 'rest/check_mk/api/1.0/domain-types/user_config/collections/all'],
    ['GET', 'rest/check_mk/api/1.0/objects/user_config/automation'],
    ['GET', 'rest/check_mk/api/1.0/domain-types/site_connection/collections/all'],
    ['DELETE', 'rest/check_mk/api/1.0/objects/host_config/host1'],
    ['POST', 'rest/check_mk/api/1.0/version'],
    ['GET', 'rest/check_mk/api/1.0/version/../objects/host_config/host1'],
    ['POST', 'rest/check_mk/api/1.0/domain-types/host_config/collections/all'],
    ['GET', 'cmk/check_mk/view.py'],
    ['GET', 'rest/check_mk/view.py'],
  ])('do not match %s %s', (method, proxyPath) => {
    expect(matchRoute(method, proxyPath)).toBeUndefined();
  });
});
