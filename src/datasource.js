import ERROR from './utils/errors';
import {buildUrlWithParams, buildRequestBody, getResult} from './utils/request';
import {sortByText} from './utils/sort';
import {formatCurveData, getHostTags} from './utils/data';
import { getTemplateSrv } from '@grafana/runtime';

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

const getContext = (target) => {
    const context = {
        siteopt: {site: target.site},
        host_tags: getHostTags(target)
    };

    if(target.usehostregex && target.hostregex) {
        context.hostregex = {host_regex: target.hostregex};
    }

    if(!target.usehostregex && target.host) {
        context.host = {host: target.host};
    }

    if(target.serviceregex) {
        context.serviceregex = {service_regex: target.serviceregex};
    }

    return context;
};

export class CheckmkDatasource {
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

    queryTarget(target, {scopedVars,range}) {
        if(!target || (target.combinedgraph === '' && (!target.host || !target.service || (target.metric === '' && target.graph === '')))) {
            return Promise.resolve({data: []});
        }

        const site = target.site || null;
        const host_name = getTemplateSrv().replace(target.host,scopedVars);

        const service_description = target.service;

        let graph_index;
        let metric_index;

        if(target.mode === 'combined') {
            return this.queryCombinedTarget(target, {scopedVars,range});
        } else if(target.mode === 'metric') {
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
            data
        })
            .then((response) => {
                if(response.data.result_code !== 0) {
                    throw new Error(`${response.data.result}`);
                }

                const {start_time, step, curves} = response.data.result;
                const format = formatCurveData(start_time, step, target.format, target);

                if(metric_index != null) {
                    // filter for one specific metric
                    return [format(curves[metric_index])];
                }

                return curves.map(format);
            })
            .catch((err) => {
                this.lastErrors[target.refId] = err.message;
            });
    }

    queryCombinedTarget(target, {scopedVars,range}) {
        let host_name = getTemplateSrv().replace(target.host,scopedVars);
        target.host = host_name;

        const data = {
            specification: [
                'combined',
                {
                    context: getContext(target),
                    graph_template: target.combinedgraph,
                    presentation: target.presentation,
                    single_infos: ['host'],
                    datasource: 'services'
                }
            ],
            data_range: {
                time_range: [
                    range.from.unix(),
                    range.to.unix()
                ]
            }
        };

        if(!target.usehostregex) {
            data.specification[1].host_name = target.host;
        }

        delete this.lastErrors[target.refId];

        return this.doRequest({
            params: {action: 'get_graph'},
            data: buildRequestBody(data)
        })
            .then((response) => {
                if(response.data.result_code !== 0) {
                    throw new Error(`${response.data.result}`);
                }

                const {start_time, step, curves} = response.data.result;
                return curves.map(formatCurveData(start_time, step, target.format, target));
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
            params: {action: 'get_host_names'}
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

    annotationQuery(options) {
        const [query] = options.annotation.queries;

        const context = {
            site: query.site,
            serviceregex: {service_regex: query.useserviceregex ? query.serviceregex : query.service || '.*'}
        };

        if(query.usehostregex) {
            context.hostregex = {host_regex: query.hostregex};
        } else {
            context.host = query.host;
        }

        const data = {
            context,
            start_time: options.range.from.unix(),
            end_time: options.range.to.unix()
        };

        return this.doRequest({
            params: {action: 'get_graph_annotations'},
            data: buildRequestBody(data)
        }).then((result) => {
            if(!result.data.result.availability_timelines) {
                throw new Error('Annotations are not supported by this Checkmk version.');
            }
            if(!result.data.result.availability_timelines.length) {
                return [];
            }

            const items = result.data.result.availability_timelines
                .map((tl) => tl.timeline
                    .filter(([, state]) => query.showAnnotations.includes(state))
                    .map(([item, state]) => Object.assign(item, {state}))
                )
                .reduce((all, a) => all.concat(a), []);

            const baseLink = `${this.rawUrl}check_mk/view.py`;

            return items.map((item) => {
                const hostLink = buildUrlWithParams(baseLink, {
                    host: item.host_name,
                    site: item.site,
                    view_name: 'hoststatus'
                });
                const serviceLink = buildUrlWithParams(baseLink, {
                    host: item.host_name,
                    site: item.site,
                    service: item.service_description,
                    view_name: 'service'
                });
                const stateLink = buildUrlWithParams(baseLink, {
                    host: item.host_name,
                    site: item.site,
                    service: item.service_description,
                    view_name: 'service',
                    mode: 'availability',
                    av_mode: 'timeline'
                });
                const tableData = [
                    ['Host', `<a href="${hostLink}" target="_blank">${item.host_name}</a>`],
                    ['Service Description', `<a href="${serviceLink}" target="_blank">${item.service_description}</a>`],
                    ['State', `<a href="${stateLink}" target="_blank">${item.state}</a>`],
                    ['In Downtime', item.in_downtime ? 'Yes' : 'No']
                ];

                const text = `<table>${
                    tableData
                        .map((tr) => tr.map((td) => `<td>&nbsp;${td}&nbsp;</td>`).join(''))
                        .map((tr) => `<tr>${tr}</tr>`)
                        .join('')
                }</table>`;

                return {
                    annotation: options,
                    time: item.from * 1000,
                    text
                };
            });
        });
    }

    metricFindQuery(query) {
        if(query == 'host') {
            return this.hostsQuery({site: ''});
        }
        
        return [ { 'text' : query, 'value': query} ];
    }

    
    sitesQuery(query, disableAll = false) {
        return this.doRequest({
            params: {action: 'get_user_sites'}
        })
            .then(getResult)
            .then((result) => result
                .map(([value, text]) => ({text, value}))
                .sort(sortByText)
            )
            .then((sites) => disableAll ? sites : [{text: 'All Sites', value: ''}].concat(sites));
    }

    hostsQuery(query) {
        const params = {
            action: 'get_host_names'
        };

        if(query.site) {
            params.site_id = query.site;
        }

        return this.doRequest({params})
            .then(getResult)
            .then((result) => result
                .map((hostname) => ({text: hostname, value: hostname}))
                .sort(sortByText)
            );
    }

    servicesQuery(query, disableAll = false) {
        if(!query.host) {
            return Promise.resolve([]);
        }
        return this.doRequest({
            params: {action: 'get_metrics_of_host'},
            data: buildRequestBody({hostname: query.host})
        })
            .then(getResult)
            .then((result) => Object.keys(result)
                .map((key) => ({text: key, value: key}))
                .sort(sortByText)
            )
            .then((services) => disableAll ? services : [{text: 'All Services', value: ''}].concat(services));
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
            data: buildRequestBody(data)
        });
    }

    filterGroupQuery() {
        return this.doRequest({params: {action: 'get_hosttags'}})
            .then(getResult)
            .then((result) => result.tag_groups
                .map(({id, title}) => ({text: title, value: id}))
                .sort(sortByText)
            );
    }

    filterValueQuery(query, index) {
        if(!query[`filter${index}group`]) {
            return Promise.resolve([]);
        }
        return this.doRequest({params: {action: 'get_hosttags'}})
            .then(getResult)
            .then((result) => result.tag_groups
                .find(({id}) => id === query[`filter${index}group`]).tags
                .map(({id, title}) => ({text: title, value: id}))
                .sort(sortByText)
            );
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

    combinedGraphsQuery(query) {
        if(!query.presentation) {
            return Promise.resolve([]);
        }

        const data = {
            context: getContext(query),
            datasource: 'services',
            presentation: query.presentation,
            single_infos: ['host']
        };

        return this.doRequest({
            params: {action: 'get_combined_graph_identifications'},
            data: buildRequestBody(data)
        })
            .then((response) => {
                if(!response.data.result.length) {
                    return [{text: 'no graphs available', value: '-'}];
                }

                return response.data.result
                    .map(({title, identification}) => ({text: title, value: identification[1].graph_template}))
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

        options.method = options.data == null ? 'GET' : 'POST';
        options.headers = this.headers;

        return this.backendSrv.datasourceRequest(options);
    }
}
