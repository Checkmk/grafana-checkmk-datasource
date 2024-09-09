import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  FieldType,
  MetricFindValue,
  ScopedVars,
  TestDataSourceResponse,
  addRow,
  toDataFrame,
} from '@grafana/data';
import { BackendSrvRequest, FetchError, FetchResponse, getBackendSrv } from '@grafana/runtime';
import { MetricFindQuery } from 'RequestSpec';
import { defaults, get, isUndefined, zip } from 'lodash';
import { lastValueFrom } from 'rxjs';

import { CmkQuery, defaultQuery } from '../types';
import { updateMetricTitles, updateQuery } from '../utils';
import {
  WebAPiGetGraphResult,
  WebApiResponse,
  buildRequestBody,
  buildUrlWithParams,
  createWebApiRequestBody,
  createWebApiRequestSpecification,
} from './../webapi';
import { BACKEND_TYPE, Backend, DatasourceOptions } from './types';
import { validateRequestSpec } from './validate';

export default class WebApiBackend implements Backend {
  datasource: DatasourceOptions;

  constructor(datasource: DatasourceOptions) {
    this.datasource = datasource;
  }
  async metricFindQuery(query: MetricFindQuery): Promise<MetricFindValue[]> {
    throw new Error('Not implemented. Use metricFindQuery from rest Backend, and filterSites from this backend.');
  }
  async testDatasource(): Promise<TestDataSourceResponse> {
    return this.cmkRequest<unknown>({
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      url: buildUrlWithParams(`${this.datasource.getUrl()}/cmk/check_mk/webapi.py`, {
        action: 'get_combined_graph_identifications',
      }),
      data: buildRequestBody({
        context: { host: { host: 'ARANDOMNAME' } },
        single_infos: ['host'],
        datasource: 'services',
      }),
    })
      .catch((error) => {
        const firstLineOfError = error.message.split('\n')[0];
        if (firstLineOfError === 'Checkmk exception: Currently not supported with this Checkmk Edition') {
          if (this.datasource.getEdition() === 'CEE') {
            // edition dropdown = cee, so seeing this error means that we speak with a raw edition
            throw new Error('Mismatch between selected Checkmk edition and monitoring site edition');
          } else {
            // edition dropdown = raw, so seeing this error is expected (but auth worked, so we are fine)
            return;
          }
        }
        throw error;
      })
      .then(() => {
        return {
          status: 'success',
          message: 'Data source is working',
        };
      });
  }

  async listSites(): Promise<MetricFindValue[]> {
    const response = (
      await lastValueFrom(
        getBackendSrv().fetch({
          url:
            `${this.datasource.getUrl()}/cmk/check_mk/webapi.py?` +
            new URLSearchParams({ action: 'get_user_sites' }).toString(),
        })
      )
    )?.data as WebApiResponse<Array<[string, string]>>;
    return response.result.map((element) => {
      return { text: element[1], value: element[0], expandable: false };
    });
  }

  async query(options: DataQueryRequest<CmkQuery>): Promise<DataQueryResponse> {
    options.targets.forEach((query) => {
      validateRequestSpec(query.requestSpec, this.datasource.getEdition());
    });

    const { range } = options;
    const from = range.from.unix();
    const to = range.to.unix();

    const promises = options.targets
      .filter((target) => !target.hide)
      .map((target) => {
        // TODO: check if the defaults call is still necessary.
        const query = defaults(target, defaultQuery);
        return this.getGraphQuery([from, to], query, options.scopedVars);
      });
    return Promise.all(promises).then((data) => ({ data }));
  }

  async autocompleterRequest<T>(api_url: string, data: unknown): Promise<FetchResponse<WebApiResponse<T>>> {
    return this.cmkRequest<T>({
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      url: `${this.datasource.getUrl()}/cmk/check_mk/${api_url}`,
      data: buildRequestBody(data),
    });
  }

  async cmkRequest<T>(request: BackendSrvRequest): Promise<FetchResponse<WebApiResponse<T>>> {
    const result = await lastValueFrom(getBackendSrv().fetch<WebApiResponse<T>>(request)).catch((e) => {
      const error = e as FetchError<unknown>;
      if (error.cancelled) {
        throw new Error(
          `API request was cancelled. This has either happened because no 'Access-Control-Allow-Origin' header is present, or because of a ssl protocol error. Make sure you are running at least Checkmk version 2.0.`
        );
      }
      if (error.status === 410) {
        throw new Error(
          "Web-API is not available. Choose correct Checkmk version in Data Source Settings, or enable Web-API in 'Global settings' if you use Checkmk 2.1.0."
        );
      }
      throw new Error('Could not read API response, make sure the URL you provided is correct.');
    });

    if (result === undefined) {
      throw new Error('Got undefined result');
    }
    if (typeof result.data === 'string') {
      throw new Error(`${result.data}`);
    } else if (result.data.result_code !== 0) {
      // error handling in web api: error is not transported via http-status codes :-/
      let message = `${result.data}`;
      if (result.data.result !== undefined) {
        message = `${result.data.result}`;
      }
      // TODO: error message is translated, see CMK-12886
      if (message === 'Sorry, you cannot create combined graphs for more than 100 objects') {
        throw new Error(
          'Result size limit reached. Please add more filters to reduce the number of elements in the result.'
        );
      }
      throw new Error(message);
    } else {
      return result;
    }
  }

  async getGraphQuery(range: number[], query: CmkQuery, scopedVars: ScopedVars = {}): Promise<DataFrame> {
    updateQuery(query);
    const graph = get(query, 'requestSpec.graph');
    if (isUndefined(graph) || graph === '') {
      return Promise.resolve(toDataFrame({}));
    }

    const response = (
      await lastValueFrom(
        getBackendSrv().fetch({
          url:
            `${this.datasource.getUrl()}/cmk/check_mk/webapi.py?` +
            new URLSearchParams({ action: 'get_graph' }).toString(),
          data: buildRequestBody(
            createWebApiRequestBody(
              createWebApiRequestSpecification(query.requestSpec, this.datasource.getEdition()),
              range
            )
          ),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          method: 'POST',
        })
      )
    )?.data as WebApiResponse<WebAPiGetGraphResult>;

    if (response.result_code !== 0) {
      throw new Error(`${response.result}`);
    }

    const { start_time, step, curves } = response.result;

    updateMetricTitles(curves, query, scopedVars);

    const frame = toDataFrame({
      refId: query.refId,
      fields: [
        { name: 'Time', type: FieldType.time },
        ...curves.map((x: { title: string }) => ({ name: x.title, type: FieldType.number })),
      ],
    });

    zip(...curves.map((x: { rrddata: Array<{ i: number; d: Record<string, unknown> }> }) => x.rrddata)).forEach(
      (d, i) => addRow(frame, [(start_time + i * step) * 1000, ...d])
    );

    return frame;
  }

  async getAutocompleteBackend(): Promise<BACKEND_TYPE> {
    return BACKEND_TYPE.WEB;
  }
}
