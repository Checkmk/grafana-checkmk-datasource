import { defaults, get, isEmpty, zip } from 'lodash';

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

import { buildRequestBody, combinedDesc, extractSingleInfos, graphDefinitionRequest } from './graphspecs';
import { MyQuery, defaultQuery } from './types';

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
  constructor(private instanceSettings: DataSourceInstanceSettings) {
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

  async sitesQuery(): Promise<Array<SelectableValue<string>>> {
    const response = await this.doRequest({ refId: 'siteQuery', params: { action: 'get_user_sites' }, context: {} });
    const result = response.data.result;
    return result.map(([value, text]: [string, string]) => ({ label: text, value: value }));
  }

  async graphRecipesQuery({ refId, context }: MyQuery): Promise<Array<SelectableValue<number>>> {
    const template = buildRequestBody({
      specification: ['template', extractSingleInfos(context || {})],
    });
    const response = await this.doRequest({
      refId: refId,
      params: { action: 'get_graph_recipes' },
      data: template,
      context,
    });
    return response.data.result.map((graph: any, index: number) => ({ label: graph.title, value: index }));
  }

  async combinedGraphIdent({ refId, context }: MyQuery): Promise<Array<SelectableValue<string>>> {
    const response = await this.doRequest({
      refId: refId,
      params: { action: 'get_combined_graph_identifications' },
      data: buildRequestBody(combinedDesc(context || {})),
      context,
    });
    return response.data.result.map(({ title, identification }: { title: string; identification: [string, any] }) => ({
      label: title,
      value: identification[1].graph_template,
    }));
  }

  async getGraphQuery(range: number[], query: MyQuery) {
    if (isEmpty(query.context)) {
      return new MutableDataFrame();
    }

    const response = await this.doRequest({
      ...query,
      params: { action: 'get_graph' },
      data: graphDefinitionRequest(query, range),
    });
    return buildMetricDataFrame(response, query);
  }

  async testDatasource() {
    return this.doRequest({
      refId: 'testDatasource',
      params: { action: 'get_combined_graph_identifications' },
      data: buildRequestBody(combinedDesc({ host: { host: 'ARANDOMNAME' } })),
      context: {},
    }).then((response) => {
      if (
        response.data.result_code === 1 &&
        response.data.result === 'Checkmk exception: Currently not supported with this Checkmk Edition' &&
        get(this, 'instanceSettings.jsonData.edition', 'CEE') === 'CEE'
      ) {
        throw new Error('Mismatch between selected checkmk edition and monitoring site edition');
      }

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
    } else if (
      result.data.result_code !== 0 &&
      result.data.result !== 'Checkmk exception: Currently not supported with this Checkmk Edition'
    ) {
      throw new Error(`${result.data.result}`);
    } else {
      return result;
    }
  }
}
