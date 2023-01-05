import {
  DataQueryRequest,
  FieldType,
  Field,
  ArrayVector,
  DataQueryResponse,
  MutableDataFrame,
  dateTime,
  DateTime,
  TimeRange,
  DataQueryResponseData,
} from '@grafana/data';
import { BackendSrvRequest, FetchResponse, getBackendSrv } from '@grafana/runtime';

import { CmkQuery } from '../types';
import { DatasourceOptions, Backend } from './types';
// TODO: move to neutral place
import { updateQuery, createCmkContext } from '../webapi';

type RestApiGraphResponse = {
  time_range: {
    start: string;
    end: string;
  };
  step: number;
  curves: Array<{
    color: string;
    rrd_data: number[];
    line_type: string;
    title: string;
  }>;
};

type CommonRequest = {
  type: 'metric' | 'graph';
  metric_name?: string;
  graph_name?: string;
  time_range: {
    start: string;
    end: string;
  };
};
type RestApiGetRequest =
  | {
      site: string;
      host_name: string;
      service_description: string;
    }
  | CommonRequest;

export default class RestApiBackend implements Backend {
  datasource: DatasourceOptions;

  constructor(datasource: DatasourceOptions) {
    this.datasource = datasource;
  }

  async query(request: DataQueryRequest<CmkQuery>): Promise<DataQueryResponse> {
    const promises = request.targets.map((target) => {
      return this.getSingleGraph(request.range, target);
    });
    const result = await Promise.all(promises).then((data) => ({ data }));
    return result;
  }

  async testDatasource(): Promise<unknown> {
    // TODO: fix next line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.api<any>({
      url: '/version',
      method: 'GET',
    });
    // TODO: check if this version matches the edition!
    return {
      status: 'success',
      message: `Data source is working, reached version ${result.data.versions.checkmk} of checkmk`,
      title: 'Success',
    };
  }

  async api<T>(request: BackendSrvRequest): Promise<FetchResponse<T>> {
    const defaults = {
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
    };
    request = { ...defaults, ...request };
    request.url = `${this.datasource.getUrl()}/rest/check_mk/api/1.0${request.url}`;
    let result;
    try {
      result = await getBackendSrv().fetch<T>(request).toPromise();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // grafana error handling is only showing status code and status message,
      // but we may have a more detailed error message
      if (error.data && error.data.title && error.data.detail) {
        throw new Error(`${error.data.title} ${error.data.detail}`);
      }
      throw error;
    }
    if (result === undefined) {
      throw new Error('observable is undefined');
    }
    return result;
  }

  async getSingleGraph(range: TimeRange, query: CmkQuery): Promise<DataQueryResponseData> {
    // it's not about a single graph line, but a single chart. grafana supports
    // to query multiple graphs in one request, but we have to unwind this, as
    // our api only supports a single chart/query per api call.
    updateQuery(query);

    // prepare data required by cre and cee
    if (
      query.requestSpec === undefined ||
      (query.requestSpec.graph_type !== 'metric' && query.requestSpec.graph_type !== 'template') ||
      query.requestSpec.graph === undefined
    ) {
      throw 'Query is missing required fields';
    }

    const commonRequest: CommonRequest = {
      type: query.requestSpec.graph_type === 'metric' ? 'metric' : 'graph',
      time_range: {
        start: range.from.toISOString(),
        end: range.to.toISOString(),
      },
    };
    if (query.requestSpec.graph_type === 'metric') {
      commonRequest['metric_name'] = query.requestSpec.graph;
    } else {
      commonRequest['graph_name'] = query.requestSpec.graph;
    }

    let response: FetchResponse<RestApiGraphResponse>;
    if (this.datasource.getEdition() === 'RAW') {
      // send request for cre
      if (
        query.requestSpec.site === undefined ||
        query.requestSpec.host_name === undefined ||
        query.requestSpec.service === undefined
      ) {
        throw 'Query is missing required fields';
      }
      const request: RestApiGetRequest = {
        site: query.requestSpec.site,
        host_name: query.requestSpec.host_name,
        service_description: query.requestSpec.service,
        ...commonRequest,
      };
      response = await this.api<RestApiGraphResponse>({
        url: '/domain-types/graph/actions/get/invoke',
        method: 'POST',
        data: request,
      });
    } else {
      // send request for cee
      response = await this.api<RestApiGraphResponse>({
        url: '/domain-types/graph/actions/filter/invoke',
        method: 'POST',
        data: {
          filter: createCmkContext(query.requestSpec),
          only_from: ['host'],
          ...commonRequest,
        },
      });
    }

    const { time_range, step, curves } = response.data;

    const timeValues = [];
    let currentTime: DateTime = dateTime(time_range.start);
    const endTime: DateTime = dateTime(time_range.end);
    for (let i = 0; currentTime.isBefore(endTime) || currentTime.isSame(endTime); i++) {
      timeValues.push(currentTime);
      currentTime = dateTime(currentTime).add(step, 'seconds');
    }

    const fields: Field[] = [{ name: 'Time', type: FieldType.time, values: new ArrayVector(timeValues), config: {} }];
    for (const curve of curves) {
      fields.push({
        name: curve.title,
        type: FieldType.number,
        values: new ArrayVector(curve.rrd_data),
        config: { color: { mode: 'fixed', fixedColor: curve.color } },
      });
    }

    const frame = new MutableDataFrame({
      refId: query.refId,
      fields,
    });

    if (fields.length > 1) {
      return frame;
    } else {
      // a request for a metric with a template name returns empty curves.
      // this will result in a grafana note that suggests the graph should be
      // changed to a table. By returning an empty MutableDataFrame grafana
      // shows "no data" as expected.
      return new MutableDataFrame();
    }
  }
}
