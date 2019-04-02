/*
 * Grafana requires these methods:
 *
 * query(options)           // used by panels to get data
 * testDatasource()         // used by datasource configuration page to make sure the connection is working
 * metricFindQuery(options) // used by query editor to get metric suggestions.
 * annotationQuery(options) // used by dashboards to get annotations (optional)
 */

//TODO: move utilities
const buildUrlWithParams = (url, params) => url + Object.keys(params)
    .reduce((string, param) => `${string}${string ? '&' : '?'}${param}=${params[param]}`, '');

export class GenericDatasource {
    // backendSrv, templateSrv are injected - do not rename
    constructor(instanceSettings, $q, backendSrv, templateSrv) {
        this.type = instanceSettings.type;
        this.name = instanceSettings.name;
        this.q = $q;
        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;

        this.url = buildUrlWithParams(instanceSettings.jsonData.url, {
            _username: instanceSettings.jsonData.username,
            _secret: instanceSettings.jsonData.secret,
            output_format: 'json'
        });

        this.headers = {'Content-Type': 'application/x-www-form-urlencoded'};
    }

    query(options) {
        const data = `request=${JSON.stringify(
            {
                'specification': [
                    'template',
                    {
                        'service_description': 'Memory',
                        'site': 'cmk',
                        'graph_index': 4,
                        'host_name': '192.168.1.11'
                    }
                ],
                'data_range': {
                    'time_range': [
                        options.range.from.unix(),
                        options.range.to.unix()
                    ]
                }
            }
        )}`;

        return this.doRequest({
            url: `${this.url}&action=get_graph`,
            data,
            method: 'POST'
        })
            .then((response) => {
                const datapoints = response.data.result.curves[0].rrddata
                    .map((d, i) => {
                        return [d, (response.data.result.start_time + i * response.data.result.step) * 1000];
                    })
                    .filter((f) => f[0]);

                const res = {
                    target: response.data.result.curves[0].title,
                    datapoints
                };

                response.data = [res];

                return response;
            });
    }

    testDatasource() {
        return this.doRequest({
            url: `${this.url}&action=get_all_hosts`,
            method: 'GET',
        }).then((response) => {
            if(response.status !== 200) {
                return {
                    status: 'error',
                    message: 'Could not connect to provided URL',
                    title: 'Error'
                };
            } else if (!response.data.result) {
                return {
                    status: 'error',
                    message: response.data,
                    title: 'Error'
                };
            } else {
                return {
                    status: 'success',
                    message: 'Data source is working',
                    title: 'Success'
                };
            }
        });
    }

    metricFindQuery(/* query */) {
        const data = `request=${JSON.stringify(
            {
                'specification': [
                    'template',
                    {
                        'service_description': 'Memory',
                        'site': 'cmk',
                        'graph_index': 4,
                        'host_name': '192.168.1.11'
                    }
                ],
                'data_range': {
                    'time_range': [
                        1553683195,
                        1553693195
                    ]
                }
            }
        )}`;

        return this.doRequest({
            url: `${this.url}&action=get_hosts`,
            data,
            method: 'POST',
        })
            .then(() => {
                return [{text: 'Memory', value: 'Memory'}, {text: 'testB', value: 'b'}];
            });
    }

    doRequest(options) {
        options.headers = this.headers;
        return this.backendSrv.datasourceRequest(options);
    }
}
