import ERROR from './utils/errors';
import {buildUrlWithParams, buildRequestBody, getResult} from './utils/request';
import {sortByText} from './utils/sort';
import {formatCurveData} from './utils/data';

/*
 * Grafana requires these methods:
 *
 * query(options)           // used by panels to get data
 * testDatasource()         // used by datasource configuration page to make sure the connection is working
 * metricFindQuery(options) // used by query editor to get metric suggestions.
 * annotationQuery(options) // used by dashboards to get annotations (optional)
 */

const metricDivider = '.';
const urlValidationRegex = /^https?:\/\/[^/]*\/[^/]*\/$/;

export class GenericDatasource {
    // backendSrv, templateSrv are injected - do not rename
    constructor(instanceSettings, backendSrv, templateSrv) {
        this.type = instanceSettings.type;
        this.name = instanceSettings.name;
        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;

        this.rawUrl = instanceSettings.jsonData.url;
        this._username = instanceSettings.jsonData.username;
        this._secret = instanceSettings.jsonData.secret;

        this.headers = {'Content-Type': 'application/x-www-form-urlencoded'};

        this.lastErrors = {};
    }

    queryTarget(target, {range}) {
        if(!target || !target.host || !target.service || (target.metric === '' && target.graph === '')) {
            return Promise.resolve({data: []});
        }

        const site = target.site || null;
        const host_name = target.host;
        const service_description = target.service;

        let graph_index;
        let metric_index;

        if(target.mode === 'metric') {
            [graph_index, metric_index] = target.metric.split(metricDivider).map((i) => +i);
        } else {
            graph_index = +target.graph;
        }

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

        delete this.lastErrors[target.refId];

        return this.doRequest({
            params: {action: 'get_graph'},
            data,
            method: 'POST'
        })
            .then((response) => {
                if(response.data.result_code !== 0) {
                    throw new Error(`${response.data.result}`);
                }

                const {start_time, step, curves} = response.data.result;

                if(metric_index != null) {
                    // filter for one specific metric
                    return [formatCurveData(start_time, step)(curves[metric_index])];
                }

                return curves.map(formatCurveData(start_time, step));
            })
            .catch((err) => {
                this.lastErrors[target.refId] = err.message;
            });
    }

    getLastError(refId) {
        return this.lastErrors[refId];
    }

    query(options) {
        const targets = options.targets.filter(({hide}) => !hide);
        return Promise.all(targets.map((target) => this.queryTarget(target, options)))
            .then((data) => data.reduce((all, d) => all.concat(d), []))
            .then((data) => ({data}));
    }

    testDatasource() {
        if(!urlValidationRegex.test(this.rawUrl)) {
            return ERROR.FORMAT;
        }

        return this.doRequest({
            params: {action: 'get_host_names'},
            method: 'GET',
        })
            .then((response) => {
                if(response.status !== 200) {
                    return ERROR.STATUS;
                } else if (!response.data.result) {
                    return ERROR.OTHER(response.data);
                } else {
                    return {
                        status: 'success',
                        message: 'Data source is working',
                        title: 'Success'
                    };
                }
            })
            .catch(({cancelled}) => cancelled ? ERROR.CANCEL : ERROR.READ);
    }

    annotationQuery() {
        throw new Error('Annotation Support not implemented.');
    }

    metricFindQuery() {
        throw new Error('Template Variable Support not implemented.');
    }

    sitesQuery() {
        return this.doRequest({
            params: {action: 'get_user_sites'},
            method: 'GET',
        })
            .then(getResult)
            .then((result) => result
                .map(([value, text]) => ({text, value}))
                .sort(sortByText)
            ).then((sites) => [{text: 'All Sites', value: ''}].concat(sites));
    }

    hostsQuery(query) {
        const params = {
            action: 'get_host_names'
        };

        if(query.site) {
            params.site_id = query.site;
        }

        return this.doRequest({
            params,
            method: 'GET',
        })
            .then(getResult)
            .then((result) => result
                .map((hostname) => ({text: hostname, value: hostname}))
                .sort(sortByText)
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
            .then(getResult)
            .then((result) => Object.keys(result)
                .map((key) => ({text: key, value: key}))
                .sort(sortByText)
            );
    }

    serviceOptionsQuery(query) {
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
        });
    }

    metricsQuery(query) {
        if(!query.host || !query.service) {
            return Promise.resolve([]);
        }

        return this.serviceOptionsQuery(query)
            .then(getResult)
            .then((result) => {
                if(!result.length) {
                    return [{text: 'no metrics available', value: '-'}];
                }

                return result
                    .map((graph, graphIndex) => graph.metrics
                        .map((metric, metricIndex) => ({text: metric.title, value: `${graphIndex}${metricDivider}${metricIndex}`}))
                    )
                    .reduce((all, metrics) => all.concat(metrics), [])
                    .filter((f, i, all) => all.findIndex((x) => x.text === f.text) === i) // metrics are not necessary unique to one graph, filtering here to make results unique
                    .sort(sortByText);
            });
    }

    graphsQuery(query) {
        if(!query.host || !query.service) {
            return Promise.resolve([]);
        }

        return this.serviceOptionsQuery(query)
            .then((response) => {
                if(!response.data.result.length) {
                    return [{text: 'no graphs available', value: '-'}];
                }

                return response.data.result
                    .map((graph, index) => ({text: graph.title, value: index}))
                    .sort(sortByText);
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
