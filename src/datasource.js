/*
 * Grafana requires these methods:
 *
 * query(options)           // used by panels to get data
 * testDatasource()         // used by datasource configuration page to make sure the connection is working
 * metricFindQuery(options) // used by query editor to get metric suggestions.
 * annotationQuery(options) // used by dashboards to get annotations (optional)
 */

const urlValidationRegex = /^https?:\/\/[^/]*\/[^/]*\/$/;

//TODO: move utilities
const buildUrlWithParams = (url, params) => url + Object.keys(params)
    .reduce((string, param) => `${string}${string ? '&' : '?'}${param}=${params[param]}`, '');

const buildRequestBody = (data) => `request=${JSON.stringify(data)}`;

const formatCurveData = (startTime, step) => (curveData) => {
    const datapoints = curveData.rrddata
        .map((d, i) => {
            return [d, (startTime + i * step) * 1000];
        })
        .filter((f) => f[0]);

    return {
        target: curveData.title,
        datapoints
    };
};

export class GenericDatasource {
    // backendSrv, templateSrv are injected - do not rename
    constructor(instanceSettings, $q, backendSrv, templateSrv) {
        this.type = instanceSettings.type;
        this.name = instanceSettings.name;
        this.q = $q;
        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;

        this.rawUrl = instanceSettings.jsonData.url;
        this._username = instanceSettings.jsonData.username;
        this._secret = instanceSettings.jsonData.secret;

        this.headers = {'Content-Type': 'application/x-www-form-urlencoded'};
    }

    queryTarget(target, {range}) {
        if(!target || !target.host || !target.service || target.metric === '') {
            return Promise.resolve({data: []});
        }

        const site = target.site || null;
        const host_name = target.host;
        const service_description = target.service;
        const graph_index = +target.metric;

        if(isNaN(graph_index)) {
            return Promise.resolve({data: []});
        }

        const data = buildRequestBody({
            specification: [
                'template',
                {
                    site,
                    host_name,
                    service_description,
                    graph_index
                }
            ],
            data_range: {
                time_range: [
                    range.from.unix(),
                    range.to.unix()
                ]
            }
        });

        return this.doRequest({
            params: {action: 'get_graph'},
            data,
            method: 'POST'
        })
            .then((response) => {
                if(response.data.result_code !== 0) {
                    throw new Error('Error while fetching data');
                }

                const {start_time, step, curves} = response.data.result;
                return curves.map(formatCurveData(start_time, step));
            });
    }

    query(options) {
        const targets = options.targets.filter(({hide}) => !hide);
        return Promise.all(targets.map((target) => this.queryTarget(target, options)))
            .then((data) => data.reduce((all, d) => all.concat(d), []))
            .then((data) => ({data}));
    }

    testDatasource() {
        if(!urlValidationRegex.test(this.rawUrl)) {
            return {
                status: 'error',
                message: 'Invalid URL format. Please make sure to include protocol and trailing slash. Example: https://checkmk.server/site/',
                title: 'Error'
            };
        }

        return this.doRequest({
            params: {action: 'get_all_hosts'},
            method: 'GET',
        })
            .then((response) => {
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
            })
            .catch(() => {
                return {
                    status: 'error',
                    message: 'Could not read API response, make sure the URL you provided is correct.',
                    title: 'Error'
                };
            });
    }

    annotationQuery() {
        throw new Error('Annotation Support not implemented.');
    }

    metricFindQuery() {
        throw new Error('Template Variable Support not implemented.');
    }

    sitesQuery() {
        return [{text: 'All Sites', value: ''}];
    }

    hostsQuery() {
        return this.doRequest({
            params: {action: 'get_all_hosts'},
            method: 'GET',
        })
            .then((response) => Object.keys(response.data.result)
                .map((hostname) => ({text: hostname, value: hostname}))
            );
    }

    servicesQuery(query) {
        if(!query.host) {
            return Promise.resolve([]);
        }
        return this.doRequest({
            params: {action: 'get_metrics_of_host'},
            data: buildRequestBody({hostname: query.host}),
            method: 'POST',
        })
            .then((response) => Object.keys(response.data.result)
                .map((key) => ({text: key, value: key}))
            );
    }

    metricsQuery(query) {
        if(!query.host || !query.service) {
            return Promise.resolve([]);
        }
        const data = {
            specification: [
                'template',
                {
                    site: query.site || null,
                    service_description: query.service,
                    host_name: query.host
                }
            ]
        };

        return this.doRequest({
            params: {action: 'get_graph_recipes'},
            data: buildRequestBody(data),
            method: 'POST',
        })
            .then((response) => {
                if(!response.data.result.length) {
                    return [{text: 'no graphs available', value: '-'}];
                }

                return response.data.result.map((metric, index) => ({text: metric.title, value: index}));
            });
    }

    doRequest(options) {
        options.url = buildUrlWithParams(`${this.rawUrl}check_mk/webapi.py`, Object.assign({
            _username: this._username,
            _secret: this._secret,
            output_format: 'json',
        }, options.params));

        delete options.params;

        options.headers = this.headers;

        return this.backendSrv.datasourceRequest(options);
    }
}
