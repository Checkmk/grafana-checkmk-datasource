import { DataQueryRequest, DataQueryResponse, MetricFindValue, TestDataSourceResponse } from '@grafana/data';

import { MetricFindQuery } from '../RequestSpec';
import { CmkQuery, Edition } from '../types';

export interface Backend {
  query: (options: DataQueryRequest<CmkQuery>) => Promise<DataQueryResponse>;
  testDatasource: () => Promise<TestDataSourceResponse>;
  metricFindQuery: (query: MetricFindQuery) => Promise<MetricFindValue[]>;
  listSites: () => Promise<MetricFindValue[]>;
}

export interface DatasourceOptions {
  getEdition: () => Edition;
  getUrl: () => string | undefined;
  getUsername(): string;
}
