import { DataQueryRequest, DataQueryResponse, MetricFindValue } from '@grafana/data';

import { MetricFindQuery } from '../RequestSpec';
import { CmkQuery, Edition } from '../types';

export interface Backend {
  query: (options: DataQueryRequest<CmkQuery>) => Promise<DataQueryResponse>;
  testDatasource: () => Promise<unknown>;
  metricFindQuery: (query: MetricFindQuery) => Promise<MetricFindValue[]>;
  listSites: () => Promise<MetricFindValue[]>;
}

export interface DatasourceOptions {
  getBackend: () => Backend;
  getEdition: () => Edition;
  getUrl: () => string | undefined;

  getUsername(): string;
}
