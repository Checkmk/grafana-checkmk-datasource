import { defaults, zip } from 'lodash';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  SelectableValue,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';

const error = (message: string) => ({
  status: 'error',
  title: 'Error',
  message,
});

const buildUrlWithParams = (url: string, params: any) =>
  url + Object.keys(params).reduce((string, param) => `${string}${string ? '&' : '?'}${param}=${params[param]}`, '');

const buildRequestBody = (data: any) => `request=${JSON.stringify(data)}`;

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

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  url: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.url = instanceSettings.url!;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.unix();
    const to = range!.to.unix();

    let datasource = this; // defined to be reachable on the next closure

    const promises = options.targets.map(target => {
      const query = defaults(target, defaultQuery);
      console.log(query);
      return datasource.getGraphQuery([from, to], query);
    });
    return Promise.all(promises).then(data => ({ data }));
  }

  sitesQuery(): Promise<Array<SelectableValue<string>>> {
    return this.doRequest({ refId: 'query_editor', params: { action: 'get_user_sites' } })
      .then(response => response.data.result)
      .then(result => result.map(([value, text]: [string, string]) => ({ label: text, value: value })));
  }

  hostsQuery(query: MyQuery): Promise<Array<SelectableValue<string>>> {
    return this.doRequest({ refId: 'query_editor', params: { action: 'get_host_names' } })
      .then(response => response.data.result.sort())
      .then(result => result.map((hostname: string) => ({ label: hostname, value: hostname })));
  }

  getGraphQuery(range: number[], query: MyQuery) {
    const recipe = buildRequestBody({
      specification: [
        'template',
        {
          site: query.params.siteId || '',
          host_name: query.params.hostname || '',
          service_description: 'CPU utilization',
          graph_index: 0,
        },
      ],
      data_range: {
        time_range: range,
      },
    });
    return this.doRequest({ ...query, params: { action: 'get_graph' }, data: recipe }).then(response =>
      buildMetricDataFrame(response, query)
    );
  }

  async testDatasource() {
    return this.doRequest({ params: { action: 'get_host_names' }, refId: 'testDatasource' }).then(response => {
      if (response.status !== 200) {
        return error('Could not connect to provided URL');
      } else if (!response.data.result) {
        return error(response.data);
      } else {
        return {
          status: 'success',
          message: 'Data source is working',
          title: 'Success',
        };
      }
    });
  }

  async doRequest(options: MyQuery) {
    const result = await getBackendSrv()
      .datasourceRequest({
        method: options.data == null ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        url: buildUrlWithParams(`${this.url}/cmk/check_mk/webapi.py`, options.params),
        data: options.data,
      })
      .catch(({ cancelled }) =>
        cancelled
          ? error(
              `API request was cancelled. This has either happened because no 'Access-Control-Allow-Origin' header is present, or because of a ssl protocol error. Make sure you are running at least Checkmk version 2.0.`
            )
          : error('Could not read API response, make sure the URL you provided is correct.')
      );

    return result;
  }
}
