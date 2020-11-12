import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
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

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  rawUrl: string;
  _username: string;
  _secret: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.rawUrl = instanceSettings.jsonData.url || '';
    this._username = instanceSettings.jsonData.username || '';
    this._secret = instanceSettings.jsonData.secret || 'undefined';
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

      let ret = this.sitesQuery(options.targets[0]);
      console.log(ret);
    // Return a constant for each query.
    const data = options.targets.map(target => {
      const query = defaults(target, defaultQuery);
      return new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'Time', values: [from, to], type: FieldType.time },
          { name: 'Value', values: [query.constant, query.constant], type: FieldType.number },
        ],
      });
    });

    return { data };
  }
    sitesQuery(options: MyQuery) {
        return this.doRequest({...options, params:{...options.params,  action: "get_user_sites"}}).then((response) => response.data.result);
    }

  async testDatasource() {
    const urlValidationRegex = /^https?:\/\/[^/]*\/[^/]*\/$/;
    if (!urlValidationRegex.test(this.rawUrl)) {
      return error(
        'Invalid URL format. Please make sure to include protocol and trailing slash. Example: https://checkmk.server/site/'
      );
    }
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
        url: buildUrlWithParams(
          `${this.rawUrl}check_mk/webapi.py`,
          Object.assign(
            {
              _username: this._username,
              _secret: this._secret,
              output_format: 'json',
            },
            options.params
          )
        ),
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
