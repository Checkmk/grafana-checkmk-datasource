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

import { buildRequestBody, graphSpecification } from './graphspecs';
import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';

const error = (message: string) => ({
  status: 'error',
  title: 'Error',
  message,
});

export function prepareHostsQuery(query: MyQuery, site: string) {
  return {
    ...query,
    params: { site_id: site, action: 'get_host_names' },
  };
}
const buildUrlWithParams = (url: string, params: any) => url + '?' + new URLSearchParams(params).toString();

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
    const datasource = this; // defined to be reachable on the next closure

    const promises = options.targets.map((target) => {
      const query = defaults(target, defaultQuery);
      return datasource.getGraphQuery([from, to], query);
    });
    return Promise.all(promises).then((data) => ({ data }));
  }

  async sitesQuery(): Promise<Array<SelectableValue<string>>> {
    const response = await this.doRequest({ refId: 'siteQuery', params: { action: 'get_user_sites' } });
    const result = response.data.result;
    return result.map(([value, text]: [string, string]) => ({ label: text, value: value }));
  }

  async hostsQuery(query: MyQuery): Promise<Array<SelectableValue<string>>> {
    const response = await this.doRequest(prepareHostsQuery(query, query.params.site_id));
    const result = response.data.result.sort();
    return result.map((hostname: string) => ({ label: hostname, value: hostname }));
  }

  async metricsOfHostQuery(query: MyQuery): Promise<Array<[string, any]>> {
    const response = await this.doRequest(query);
    return Object.entries(response.data.result);
  }

  async graphRecipesQuery(query: MyQuery): Promise<Array<SelectableValue<number>>> {
    const template = buildRequestBody({
      specification: [
        'template',
        {
          site: query.params.site_id,
          host_name: query.params.hostname,
          service_description: query.params.service,
        },
      ],
    });
    const response = await this.doRequest({
      refId: query.refId,
      params: { action: 'get_graph_recipes' },
      data: template,
    });
    return response.data.result.map((graph: any, index: number) => ({ label: graph.title, value: index }));
  }

  async combinedGraphIdent(query: MyQuery): Promise<Array<SelectableValue<string>>> {
    const data = buildRequestBody({
      context: query.context,
      datasource: 'services',
      presentation: query.params.presentation,
      single_infos: ['host'],
    });
    const response = await this.doRequest({
      refId: query.refId,
      params: { action: 'get_combined_graph_identifications' },
      data: data,
    });
    return response.data.result.map(({ title, identification } : { title: string, identification: Record<string | number, any>}) => ({
      label: title,
      value: identification[1].graph_template,
    }));
  }

  async getGraphQuery(range: number[], query: MyQuery) {
    const response = await this.doRequest({
      ...query,
      params: { action: 'get_graph' },
      data: graphSpecification(query, range),
    });
    return buildMetricDataFrame(response, query);
  }

  async testDatasource() {
    return this.doRequest({ params: { action: 'get_host_names' }, refId: 'testDatasource' }).then((response) => {
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
    return this.cmkRequest({
      method: options.data == null ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      url: buildUrlWithParams(`${this.url}/cmk/check_mk/webapi.py`, options.params),
      data: options.data,
    });
  }

  async restRequest(api_url: string, data: any) {
    return this.cmkRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      url: `${this.url}/cmk/check_mk/${api_url}`,
      data: buildRequestBody(data),
    });
  }

  async cmkRequest(request: any) {
    const result = await getBackendSrv()
      .datasourceRequest(request)
      .catch(({ cancelled }) =>
        cancelled
          ? error(
              `API request was cancelled. This has either happened because no 'Access-Control-Allow-Origin' header is present, or because of a ssl protocol error. Make sure you are running at least Checkmk version 2.0.`
            )
          : error('Could not read API response, make sure the URL you provided is correct.')
      );
    if (result.data.result_code !== 0) {
      throw new Error(`${result.data.result}`);
    } else {
      return result;
    }
  }
}
