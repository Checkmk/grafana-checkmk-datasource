import { defaults, get, isEmpty, zip } from 'lodash';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { buildRequestBody, combinedDesc, graphDefinitionRequest } from './graphspecs';
import { MyQuery, defaultQuery, MyDataSourceOptions } from './types';

export const buildUrlWithParams = (url: string, params: any) => url + '?' + new URLSearchParams(params).toString();

function buildMetricDataFrame(response: any, query: MyQuery) {
  if (response.data.result_code !== 0) {
    throw new Error(`${response.data.result}`);
  }
  const { start_time, step, curves } = response.data.result;

  const frame = new MutableDataFrame({
    refId: query.refId,
    fields: [{ name: 'Time', type: FieldType.time }].concat(
      curves.map((x: any) => ({ name: x.title, type: FieldType.number }))
    ),
  });
  zip(...curves.map((x: any) => x.rrddata)).forEach((d: any, i: number) =>
    frame.appendRow([(start_time + i * step) * 1000, ...d])
  );
  return frame;
}

export class DataSource extends DataSourceApi<MyQuery> {
  constructor(private instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.unix();
    const to = range!.to.unix();
    const datasource = this; // defined to be reachable on the next closure

    const promises = options.targets.map((target) => {
      const query = defaults(target, defaultQuery);
      return datasource.getGraphQuery([from, to], query);
    });
    return Promise.all(promises).then((data) => ({ data }));
  }

  async getGraphQuery(range: number[], query: MyQuery) {
    if (isEmpty(query.context) || !query.params.graph_name) {
      return new MutableDataFrame();
    }
    const editionMode = get(this, 'instanceSettings.jsonData.edition', 'CEE');
    const response = await this.doRequest({
      ...query,
      params: { action: 'get_graph' },
      data: graphDefinitionRequest(editionMode, query, range),
    });
    return buildMetricDataFrame(response, query);
  }

  async testDatasource() {
    return this.doRequest({
      refId: 'testDatasource',
      params: { action: 'get_combined_graph_identifications' },
      data: buildRequestBody(combinedDesc({ host: { host: 'ARANDOMNAME' } })),
      context: {},
    })
      .catch((error) => {
        let firstLineOfError = error.message.split('\n')[0];
        if (firstLineOfError === 'Checkmk exception: Currently not supported with this Checkmk Edition') {
          if ((this.instanceSettings.jsonData.edition ?? 'CEE') === 'CEE') {
            // edition dropdown = cee, so seeing this error means that we speak with a raw edition
            throw new Error('Mismatch between selected Checkmk edition and monitoring site edition');
          } else {
            // edition dropdown = raw, so seeing this error is expected (but auth worked, so we are fine)
            return;
          }
        }
        throw error;
      })
      .then((response) => {
        return {
          status: 'success',
          message: 'Data source is working',
          title: 'Success',
        };
      });
  }

  async doRequest(options: MyQuery) {
    return this.cmkRequest({
      method: options.data == null ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      url: buildUrlWithParams(`${this.instanceSettings.url}/cmk/check_mk/webapi.py`, options.params),
      data: options.data,
    });
  }

  async restRequest(api_url: string, data: any) {
    return this.cmkRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      url: `${this.instanceSettings.url}/cmk/check_mk/${api_url}`,
      data: buildRequestBody(data),
    });
  }

  async cmkRequest(request: any) {
    const result = await getBackendSrv()
      .datasourceRequest(request)
      .catch(({ cancelled }) => {
        if (cancelled) {
          throw new Error(
            `API request was cancelled. This has either happened because no 'Access-Control-Allow-Origin' header is present, or because of a ssl protocol error. Make sure you are running at least Checkmk version 2.0.`
          );
        } else {
          throw new Error('Could not read API response, make sure the URL you provided is correct.');
        }
      });

    if (typeof result.data === 'string') {
      throw new Error(`${result.data}`);
    } else if (result.data.result_code !== 0) {
      throw new Error(`${result.data.result}`);
    } else {
      return result;
    }
  }
}
