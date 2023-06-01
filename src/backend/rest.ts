import {
  ArrayVector,
  DataQueryRequest,
  DataQueryResponse,
  DataQueryResponseData,
  DateTime,
  Field,
  FieldType,
  MetricFindValue,
  MutableDataFrame,
  TimeRange,
  dateTime,
} from '@grafana/data';
import { BackendSrvRequest, FetchError, FetchResponse, getBackendSrv } from '@grafana/runtime';
import { Aggregation, GraphType, MetricFindQuery } from 'RequestSpec';
import * as process from 'process';

import { CmkQuery } from '../types';
import { createCmkContext, replaceVariables, toLiveStatusQuery, updateQuery } from '../utils';
import { Backend, DatasourceOptions } from './types';
import { validateRequestSpec } from './validate';

type RestApiError = {
  detail: string;
  status: number;
  title: string;
};

type RestApiGraphResponse = {
  time_range: {
    start: string;
    end: string;
  };
  step: number;
  metrics: Array<{
    color: string;
    data_points: number[];
    line_type: string;
    title: string;
  }>;
};

type CommonRequest = {
  type: GraphType;
  metric_id?: string;
  graph_id?: string;
  time_range: {
    start: string;
    end: string;
  };
};
type RestApiGetRequest = {
  site?: string;
  host_name: string;
  service_description: string;
} & CommonRequest;

type RestApiFilterRequest = {
  aggregation?: Aggregation;
  filter: unknown;
} & CommonRequest;

type RestApiSiteConnectionResponse = {
  value: Array<{
    extensions: {
      basic_settings: {
        alias: string;
        site_id: string;
      };
    };
  }>;
};

type RestApiLivestatusResponse<T> = {
  value: Array<{
    id: string;
    extensions: T;
  }>;
};

type RestApiHostResponse = RestApiLivestatusResponse<{ name: string }>;

type RestApiServiceResponse = RestApiLivestatusResponse<{ description: string }>;

export default class RestApiBackend implements Backend {
  datasource: DatasourceOptions;

  constructor(datasource: DatasourceOptions) {
    this.datasource = datasource;
  }

  async listSites(): Promise<MetricFindValue[]> {
    const query = {};
    const response = await this.api<RestApiSiteConnectionResponse>({
      url: '/domain-types/site_connection/collections/all',
      method: 'GET',
      params: {
        query: JSON.stringify(query),
      },
    });
    return response.data.value.map((element) => {
      const bs = element.extensions.basic_settings;
      return { text: bs.alias, value: bs.site_id, expandable: false };
    });
  }

  async listHosts(query: MetricFindQuery): Promise<MetricFindValue[]> {
    const liveStatusQuery = toLiveStatusQuery(replaceVariables(query.filter), 'host');
    const response = await this.api<RestApiHostResponse>({
      url: '/domain-types/host/collections/all',
      method: 'GET',
      params: {
        query: JSON.stringify(liveStatusQuery.query),
        sites: liveStatusQuery.sites,
        columns: 'name',
      },
    });
    return response.data.value.map((element) => {
      return { text: element.extensions.name, value: element.id, expandable: false };
    });
  }

  async listServices(query: MetricFindQuery): Promise<MetricFindValue[]> {
    const liveStatusQuery = toLiveStatusQuery(replaceVariables(query.filter), 'service');
    const response = await this.api<RestApiServiceResponse>({
      url: '/domain-types/service/collections/all',
      method: 'GET',
      params: {
        query: JSON.stringify(liveStatusQuery.query),
        sites: liveStatusQuery.sites,
        columns: 'description',
      },
    });
    return response.data.value.map((element) => {
      return { text: element.extensions.description, value: element.extensions.description, expandable: false };
    });
  }

  async metricFindQuery(query: MetricFindQuery): Promise<MetricFindValue[]> {
    if (query.objectType === 'site') {
      return await this.listSites();
    } else if (query.objectType === 'host') {
      return await this.listHosts(query);
    } else if (query.objectType === 'service') {
      return await this.listServices(query);
    }
    throw new Error(`objectType ${query.objectType} not known!`);
  }

  async query(request: DataQueryRequest<CmkQuery>): Promise<DataQueryResponse> {
    request.targets.forEach((query) => {
      validateRequestSpec(query.requestSpec, this.datasource.getEdition());
    });

    const promises = request.targets
      .filter((target) => !target.hide)
      .map((target) => {
        return this.getSingleGraph(request.range, target);
      });
    return await Promise.all(promises).then((data) => ({ data }));
  }

  async testDatasource(): Promise<unknown> {
    const result = await this.api<{ versions: { checkmk: string }; edition: string }>({
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
        `Checkmk version 2.1.0 has been detected, but this plugin is configured to use version 2.2.0 and above. Please set the backend option to '< 2.2'.`
      );
    }
    if (this.datasource.getEdition() === 'CEE' && result.data.edition === 'raw') {
      throw new Error(
        'The data source specified the Checkmk Enterprise Edition, but Checkmk Raw Edition was detected. Please choose the raw edition in the data source settings.'
      );
    }
    // The REST API would be ok with other users, but the autocompleter are not
    if (!(await this.isAutomationUser(this.datasource.getUsername()))) {
      throw new Error('This data source must authenticate against Checkmk using an automation user.');
    }
    return {
      status: 'success',
      message: `Data source is working, reached version ${checkMkVersion} of checkmk`,
      title: 'Success',
    };
  }

  async isAutomationUser(username: string): Promise<boolean> {
    const response = await this.api<{ extensions: { auth_option: { auth_type: string } } }>({
      url: `/objects/user_config/${username}`,
    });
    return response.data['extensions']['auth_option']['auth_type'] === 'automation';
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
    } catch (e) {
      const error = e as FetchError<RestApiError>;
      // grafana error handling is only showing status code and status message,
      // but we may have a more detailed error message
      if (error.status === 404) {
        throw new Error(
          'REST API graph endpoints are unavailable. Choose correct checkmk version in data source settings.'
        );
      }

      if (error.data && error.data.title && error.data.detail) {
        // TODO: error message is translated, see CMK-12886
        if (error.data.detail === 'Sorry, you cannot create combined graphs for more than 100 objects') {
          throw new Error(
            'Result size limit reached. Please add more filters to reduce the number of elements in the result.'
          );
        }
        throw new Error(`${error.data.title} ${error.data.detail}`);
      }
      throw error;
    }
    if (result === undefined) {
      throw new Error('observable is undefined');
    }

    // check for cloud edition header
    if (result.headers.get('X-Checkmk-Edition') !== 'cce' && process.env.BUILD_EDITION === 'CLOUD') {
      throw new Error(
        'Checkmk data source for Checkmk Cloud Edition« is only compatible with Checkmk Cloud Edition, but you are trying to connect to another edition.'
      );
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
      (query.requestSpec.graph_type !== 'single_metric' && query.requestSpec.graph_type !== 'predefined_graph') ||
      query.requestSpec.graph === undefined
    ) {
      throw 'Query is missing required fields';
    }

    const commonRequest: CommonRequest = {
      type: query.requestSpec.graph_type,
      time_range: {
        start: range.from.toISOString(),
        end: range.to.toISOString(),
      },
    };
    if (commonRequest.type === 'single_metric') {
      commonRequest['metric_id'] = query.requestSpec.graph;
    } else {
      commonRequest['graph_id'] = query.requestSpec.graph;
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
        host_name: query.requestSpec.host_name,
        service_description: query.requestSpec.service,
        ...commonRequest,
      };
      if (query.requestSpec.site !== '') {
        // the autocompleter has an additional element "All Sites" with value = ''
        // the rest-api does not accept an empty string for the site value, but a missing site key
        request.site = query.requestSpec.site;
      }
      response = await this.api<RestApiGraphResponse>({
        url: '/domain-types/metric/actions/get/invoke',
        method: 'POST',
        data: request,
      });
    } else {
      // send request for cee
      const request: RestApiFilterRequest = {
        filter: createCmkContext(query.requestSpec),
        aggregation: query.requestSpec.aggregation,
        ...commonRequest,
      };
      response = await this.api<RestApiGraphResponse>({
        url: '/domain-types/metric/actions/filter/invoke',
        method: 'POST',
        data: request,
      });
    }

    const { time_range, step, metrics } = response.data;

    const timeValues = [];
    let currentTime: DateTime = dateTime(time_range.start);
    const endTime: DateTime = dateTime(time_range.end);
    for (let i = 0; currentTime.isBefore(endTime) || currentTime.isSame(endTime); i++) {
      timeValues.push(currentTime);
      currentTime = dateTime(currentTime).add(step, 'seconds');
    }

    const fields: Field[] = [{ name: 'Time', type: FieldType.time, values: new ArrayVector(timeValues), config: {} }];
    for (const curve of metrics) {
      fields.push({
        name: curve.title,
        type: FieldType.number,
        values: new ArrayVector(curve.data_points),
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
      // a request for a metric with a template name returns empty metrics.
      // this will result in a grafana note that suggests the graph should be
      // changed to a table. By returning an empty MutableDataFrame grafana
      // shows "no data" as expected.
      return new MutableDataFrame();
    }
  }
}
