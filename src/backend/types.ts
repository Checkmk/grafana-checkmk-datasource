import { DataQueryRequest, DataQueryResponse, MetricFindValue } from '@grafana/data';

import { MetricFindQuery } from '../RequestSpec';
import { CmkQuery, Edition } from '../types';

export enum BACKEND_TYPE {
  REST = 'rest',
  WEB = 'web',
}

export interface Backend {
  query: (options: DataQueryRequest<CmkQuery>) => Promise<DataQueryResponse>;
  testDatasource: () => Promise<unknown>;
  metricFindQuery: (query: MetricFindQuery) => Promise<MetricFindValue[]>;
  listSites: () => Promise<MetricFindValue[]>;
  getAutocompleteBackend: () => Promise<BACKEND_TYPE>;
}

export interface DatasourceOptions {
  getBackend: () => Backend;
  getEdition: () => Edition;
  getUrl: () => string | undefined;
  getUsername(): string;
}
