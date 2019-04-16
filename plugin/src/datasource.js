/*
 * Grafana requires these methods:
 *
 * query(options)           // used by panels to get data
 * testDatasource()         // used by datasource configuration page to make sure the connection is working
 * metricFindQuery(options) // used by query editor to get metric suggestions.
 * annotationQuery(options) // used by dashboards to get annotations (optional)
 */

const DEFAULT_SITE = 'cmk';

//TODO: move utilities
const buildUrlWithParams = (url, params) => url + Object.keys(params)
    .reduce((string, param) => `${string}${string ? '&' : '?'}${param}=${params[param]}`, '');

const buildRequestBody = (data) => `request=${JSON.stringify(data)}`;

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

    queryTarget(target, {range}) {
        if(!target || !target.site || !target.host || !target.service) {
            return Promise.resolve({data: []});
        }

        const site = target.site;
        const host_name = target.host;
        const service_description = target.service;
        const graph_index = +(target.metric || 0);

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

                return {
                    target: response.data.result.curves[0].title,
                    datapoints
                };
            });
    }

    query(options) {
        return Promise.all(options.targets.map((target) => this.queryTarget(target, options)))
            .then((data) => {
                return {data};
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

    annotationQuery() {
        throw new Error('Annotation Support not implemented.');
    }

    metricFindQuery() {
        throw new Error('Template Variable Support not implemented.');
    }


    getDefaultSite() {
        return DEFAULT_SITE;
    }

    sitesQuery() {
        return [{text: `${this.getDefaultSite()} (default)`, value: this.getDefaultSite()}];
    }

    hostsQuery(query) {
        if(!query.site ) {
            return Promise.resolve([]);
        }
        return this.doRequest({
            url: `${this.url}&action=get_all_hosts`,
            method: 'GET',
        })
            .then((response) => Object.keys(response.data.result)
                .map((hostname) => ({text: hostname, value: hostname}))
            );
    }

    servicesQuery(query) {
        if(!query.site || !query.host) {
            return Promise.resolve([]);
        }
        return this.doRequest({
            url: `${this.url}&action=get_metrics_of_host`,
            data: buildRequestBody({hostname: query.host}),
            method: 'POST',
        })
            .then((response) => Object.keys(response.data.result)
                .map((key) => ({text: key, value: key}))
            );
    }

    metricsQuery(query) {
        if(!query.site || !query.host || !query.service) {
            return Promise.resolve([]);
        }
        const data = {
            specification: [
                'template',
                {
                    site: query.site,
                    service_description: query.service,
                    host_name: query.host
                }
            ]
        };

        return this.doRequest({
            url: `${this.url}&action=get_graph_recipes`,
            data: buildRequestBody(data),
            method: 'POST',
        })
            .then((response) => response.data.result.map((metric, index) => ({text: metric.title, value: index})));
    }

    doRequest(options) {
        options.headers = this.headers;
        return this.backendSrv.datasourceRequest(options);
    }
}
