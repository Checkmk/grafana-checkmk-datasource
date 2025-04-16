import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
  TestDataSourceResponse,
} from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { replaceVariables } from 'utils';

import { MetricFindQuery, RequestSpec } from './RequestSpec';
import RestApiBackend from './backend/rest';
import { Settings } from './settings';
import { CmkQuery, DataSourceOptions, Edition, ResponseDataAutocomplete, type WebApiResponse } from './types';
import { AutoCompleteParams } from './ui/autocomplete';
import { createCmkContext } from './utils';

export class DataSource extends DataSourceApi<CmkQuery> {
  restBackend: RestApiBackend;
  settings: Settings;

  constructor(private instanceSettings: DataSourceInstanceSettings<DataSourceOptions>) {
    super(instanceSettings);
    this.restBackend = new RestApiBackend(this);
    this.settings = new Settings(instanceSettings.jsonData);
  }

  async query(dataQueryRequest: DataQueryRequest<CmkQuery>): Promise<DataQueryResponse> {
    for (const target of dataQueryRequest.targets) {
      target.requestSpec = replaceVariables(target.requestSpec, dataQueryRequest.scopedVars);
    }
    return this.restBackend.query(dataQueryRequest);
  }

  async metricFindQuery(query: MetricFindQuery, options?: unknown): Promise<MetricFindValue[]> {
    return await this.restBackend.metricFindQuery(query);
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return this.restBackend.testDatasource();
  }

  async autocompleterRequest(
    api_url: string,
    data: unknown
  ): Promise<FetchResponse<WebApiResponse<ResponseDataAutocomplete>>> {
    return this.restBackend.autocompleterRequest(api_url, data);
  }

  async contextAutocomplete(
    ident: string,
    partialRequestSpec: Partial<RequestSpec>,
    prefix: string,
    params: Partial<AutoCompleteParams>
  ): Promise<Array<{ value: string; label: string; isDisabled: boolean }>> {
    const context = createCmkContext(replaceVariables(partialRequestSpec));

    const response = await this.autocompleterRequest('ajax_vs_autocomplete.py', {
      ident,
      value: prefix,
      params: {
        ...params,
        context,
      },
    });
    return response.data.result.choices.map(([value, label]: [string, string]) => ({
      value,
      label,
      isDisabled: value === null,
    }));
  }

  getUrl(): string | undefined {
    return this.instanceSettings.url;
  }

  getEdition(): Edition {
    return this.settings.edition;
  }

  getUsername(): string {
    return this.settings.username;
  }
}
