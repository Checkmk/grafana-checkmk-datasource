import {
  ArrayVector,
  DataQueryRequest,
  DataQueryResponse,
  DataQueryResponseData,
  DateTime,
  Field,
  FieldType,
  MutableDataFrame,
  TimeRange,
  dateTime,
} from '@grafana/data';
import { BackendSrvRequest, FetchResponse, getBackendSrv } from '@grafana/runtime';

import { CmkQuery } from '../types';
// TODO: move to neutral place
import { createCmkContext, updateQuery } from '../webapi';
import { Backend, DatasourceOptions } from './types';

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
    const promises = request.targets
      .filter((target) => !target.hide)
      .map((target) => {
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
    const checkMkVersion: string = result.data.versions.checkmk;
    if (checkMkVersion.startsWith('2.0') || checkMkVersion.startsWith('1.')) {
      throw new Error(
        `A Checkmk version below 2.1.0 is not supported for this plugin, but you can set the backend to the '< 2.2' version and use at your own risk.`
      );
    }
    if (checkMkVersion.startsWith('2.1')) {
      throw new Error(
        `Checkmk version 2.1.0 has been detected, but this plugin is configured to use version 2.2.0 and above. Please set the backend option to '< 2.2' and make sure to have the Web Api enabled on the server.`
      );
    }
    if (this.datasource.getEdition() === 'CEE' && result.data.edition === 'raw') {
      throw new Error(
        'The data source specified the Checkmk Enterprise Edition, but Checkmk Raw Edition was detected. Please choose the raw edition in the data source settings.'
      );
    }
    return {
      status: 'success',
      message: `Data source is working, reached version ${checkMkVersion} of checkmk`,
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
      if (error.status === 404) {
        throw new Error(
          'REST API graph endpoints are unavailable. Choose correct checkmk version in data source settings.'
        );
      }

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
