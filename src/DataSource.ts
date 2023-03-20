import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';

import { RequestSpec } from './RequestSpec';
import RestApiBackend from './backend/rest';
import { Backend } from './backend/types';
import WebApiBackend from './backend/web';
import { Backend as BackendType, CmkQuery, DataSourceOptions, Edition, ResponseDataAutocomplete } from './types';
import { createAutocompleteConfig } from './ui/autocomplete';
import { WebApiResponse, buildRequestBody } from './webapi';

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

  async contextAutocomplete(
    ident: string,
    partialRequestSpec: Partial<RequestSpec>,
    prefix: string,
    params: Record<string, string | boolean>
  ): Promise<Array<{ value: string; label: string; isDisabled: boolean }>> {
    if (ident === 'label' && this.getBackendType() === 'web') {
      // we have a 2.1.0 version without werk #15074 so label autocompleter is a special edge case
      // can be removed after we stop supporting 2.1.0
      const response = await this.autocompleterRequest<Array<{ value: string }>>('ajax_autocomplete_labels.py', {
        world: params['world'],
        search_label: prefix,
      });
      return response.data.result.map((val: { value: string }) => ({
        value: val.value,
        label: val.value,
        isDisabled: false,
      }));
    }
    const response = await this.autocompleterRequest<ResponseDataAutocomplete>(
      'ajax_vs_autocomplete.py',
      createAutocompleteConfig(partialRequestSpec, ident, prefix, params)
    );
    return response.data.result.choices.map(([value, label]: [string, string]) => ({
      value,
      label,
      isDisabled: value === null,
    }));
  }

  getUrl(): string | undefined {
    return this.instanceSettings.url;
  }

  // TODO: Move config default values to a central place instead of scattering it in getEdition and getBackendType

  getEdition(): Edition {
    return this.instanceSettings.jsonData.edition ?? 'RAW';
  }

  getBackendType(): BackendType {
    return this.instanceSettings.jsonData.backend ?? 'rest';
  }

  getBackend(): Backend {
    if (this.getBackendType() === 'web') {
      return this.webBackend;
    }
    return this.restBackend;
  }

  getUsername(): string {
    return this.instanceSettings.jsonData.username!;
  }
}
