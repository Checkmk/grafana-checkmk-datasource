import { DataQueryRequest, DataQueryResponse, MutableDataFrame } from '@grafana/data';
import { BackendSrvRequest, FetchResponse, getBackendSrv } from '@grafana/runtime';

import { CmkQuery } from '../types';
import { DatasourceOptions, Backend } from './types';

export default class RestApiBackend implements Backend {
  datasource: DatasourceOptions;

  constructor(datasource: DatasourceOptions) {
    this.datasource = datasource;
  }

  async query(options: DataQueryRequest<CmkQuery>): Promise<DataQueryResponse> {
    return { data: [new MutableDataFrame()] };
  }

  async testDatasource(): Promise<unknown> {
    // TODO: fix next line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.api<any>({
      url: '/version',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    // TODO: check if this version matches the edition!
    return {
      status: 'success',
      message: `Data source is working, reached version ${result.data.versions.checkmk} of checkmk`,
      title: 'Success',
    };
  }

  async api<T>(request: BackendSrvRequest): Promise<FetchResponse<T>> {
    request.url = `${this.datasource.getUrl()}/rest/check_mk/api/1.0${request.url}`;
    const result = await getBackendSrv().fetch<T>(request).toPromise();
    if (result === undefined) {
      // TODO: not sure about this...
      throw Error('promise undefined');
    }
    return result;
  }
}
