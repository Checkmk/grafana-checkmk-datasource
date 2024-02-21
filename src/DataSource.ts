import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
} from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { replaceVariables } from 'utils';

import { MetricFindQuery, RequestSpec } from './RequestSpec';
import RestApiBackend from './backend/rest';
import { BACKEND_TYPE, Backend } from './backend/types';
import WebApiBackend from './backend/web';
import { Settings } from './settings';
import { Backend as BackendType, CmkQuery, DataSourceOptions, Edition, ResponseDataAutocomplete } from './types';
import { AutoCompleteParams } from './ui/autocomplete';
import { createCmkContext } from './utils';
import { WebApiResponse } from './webapi';

export class DataSource extends DataSourceApi<CmkQuery> {
  webBackend: WebApiBackend;
  restBackend: RestApiBackend;
  settings: Settings;
  autocompleteBackend: BACKEND_TYPE | null = null;

  constructor(private instanceSettings: DataSourceInstanceSettings<DataSourceOptions>) {
    super(instanceSettings);
    this.webBackend = new WebApiBackend(this);
    this.restBackend = new RestApiBackend(this);
    this.settings = new Settings(instanceSettings.jsonData);
  }

  protected async setAutocompleteBackend() {
    this.autocompleteBackend = await this.getBackend().getAutocompleteBackend();
  }

  async query(dataQueryRequest: DataQueryRequest<CmkQuery>): Promise<DataQueryResponse> {
    for (const target of dataQueryRequest.targets) {
      target.requestSpec = replaceVariables(target.requestSpec, dataQueryRequest.scopedVars);
    }
    return this.getBackend().query(dataQueryRequest);
  }

  async metricFindQuery(query: MetricFindQuery, options?: unknown): Promise<MetricFindValue[]> {
    if (query.objectType === 'site') {
      // rest-api site endpoint were added in 2.2.0 so we have to use the web-api here
      // TODO: clean up (remove filterSites from Backend) with end of 2.1.0
      return await this.getBackend().listSites();
    }
    // we use the rest backend for both web and rest backend, because those endpoints are already implement in 2.1.0
    return await this.restBackend.metricFindQuery(query);
  }

  async testDatasource(): Promise<unknown> {
    return this.getBackend().testDatasource();
  }

  async autocompleterRequest(
    api_url: string,
    data: unknown
  ): Promise<FetchResponse<WebApiResponse<ResponseDataAutocomplete>>> {
    this.autocompleteBackend === null && (await this.setAutocompleteBackend());

    if (this.autocompleteBackend === BACKEND_TYPE.WEB) {
      return this.webBackend.autocompleterRequest(api_url, data);
    }

    return this.restBackend.autocompleterRequest(api_url, data);
  }

  async contextAutocomplete(
    ident: string,
    partialRequestSpec: Partial<RequestSpec>,
    prefix: string,
    params: Partial<AutoCompleteParams>
  ): Promise<Array<{ value: string; label: string; isDisabled: boolean }>> {
    if (ident === 'label' && this.getBackendType() === 'web') {
      // we have a 2.1.0 version without werk #15074 so label autocompleter is a special edge case
      // can be removed after we stop supporting 2.1.0
      const response = await this.webBackend.autocompleterRequest<Array<{ value: string }>>(
        'ajax_autocomplete_labels.py',
        {
          world: params.world,
          search_label: prefix,
        }
      );
      return response.data.result.map((val: { value: string }) => ({
        value: val.value,
        label: val.value,
        isDisabled: false,
      }));
    }
    const context = createCmkContext(
      replaceVariables(partialRequestSpec),
      this.getBackendType() === 'rest' ? 'latest' : '2.1.0'
    );
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

  getBackendType(): BackendType {
    return this.settings.backend;
  }

  getBackend(): Backend {
    if (this.getBackendType() === 'web') {
      return this.webBackend;
    }
    return this.restBackend;
  }

  getUsername(): string {
    return this.settings.username;
  }
}
