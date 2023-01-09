import { DataQueryRequest, DataQueryResponse } from '@grafana/data';

import { CmkQuery, Edition } from '../types';

export interface Backend {
  query: (options: DataQueryRequest<CmkQuery>) => Promise<DataQueryResponse>;
  testDatasource: () => Promise<unknown>;
}

export interface DatasourceOptions {
  getBackend: () => Backend;
  getEdition: () => Edition;
  getUrl: () => string | undefined;
}
