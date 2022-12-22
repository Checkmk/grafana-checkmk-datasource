import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';

import { CmkQuery, DataSourceOptions, Edition, Backend as BackendType } from './types';
import { buildRequestBody, WebApiResponse } from './webapi';

import WebApiBackend from './backend/web';
import RestApiBackend from './backend/rest';
import { Backend } from './backend/types';

export class DataSource extends DataSourceApi<CmkQuery> {
  webBackend: WebApiBackend;
  restBackend: RestApiBackend;

  constructor(private instanceSettings: DataSourceInstanceSettings<DataSourceOptions>) {
    super(instanceSettings);
    this.webBackend = new WebApiBackend(this);
    this.restBackend = new RestApiBackend(this);
  }

  async query(dataQueryRequest: DataQueryRequest<CmkQuery>): Promise<DataQueryResponse> {
    return this.getBackend().query(dataQueryRequest);
  }

  async testDatasource(): Promise<unknown> {
    return this.getBackend().testDatasource();
  }

  async autocompleterRequest<T>(api_url: string, data: unknown): Promise<FetchResponse<WebApiResponse<T>>> {
    return this.webBackend.cmkRequest<T>({
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      url: `${this.instanceSettings.url}/cmk/check_mk/${api_url}`,
      data: buildRequestBody(data),
    });
  }

  getUrl(): string | undefined {
    return this.instanceSettings.url;
  }

  getEdition(): Edition {
    return this.instanceSettings.jsonData.edition ?? 'RAW';
  }

  getBackendType(): BackendType {
    return this.instanceSettings.jsonData.backend ?? 'web';
  }

  getBackend(): Backend {
    if (this.getBackendType() === 'web') {
      return this.webBackend;
    }
    return this.restBackend;
  }
}
