'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CheckmkDatasource = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./utils/errors');

var _errors2 = _interopRequireDefault(_errors);

var _request = require('./utils/request');

var _sort = require('./utils/sort');

var _data = require('./utils/data');

var _runtime = require('@grafana/runtime');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Grafana requires these methods:
 *
 * query(options)           // used by panels to get data
 * testDatasource()         // used by datasource configuration page to make sure the connection is working
 * metricFindQuery(options) // used by query editor to get metric suggestions.
 * annotationQuery(options) // used by dashboards to get annotations (optional)
 */

var metricDivider = '.';
var urlValidationRegex = /^https?:\/\/[^/]*\/[^/]*\/$/;

var getContext = function getContext(target) {
    var context = {
        siteopt: { site: target.site },
        host_tags: (0, _data.getHostTags)(target)
    };

    if (target.usehostregex && target.hostregex) {
        context.hostregex = { host_regex: target.hostregex };
    }

    if (!target.usehostregex && target.host) {
        context.host = { host: target.host };
    }

    if (target.serviceregex) {
        context.serviceregex = { service_regex: target.serviceregex };
    }

    return context;
};

var CheckmkDatasource = exports.CheckmkDatasource = function () {
    // backendSrv, templateSrv are injected - do not rename
    function CheckmkDatasource(instanceSettings, backendSrv, templateSrv) {
        _classCallCheck(this, CheckmkDatasource);

        this.type = instanceSettings.type;
        this.name = instanceSettings.name;
        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;

        this.rawUrl = instanceSettings.jsonData.url;
        this._username = instanceSettings.jsonData.username;
        this._secret = instanceSettings.jsonData.secret;

        this.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

        this.lastErrors = {};
    }

    _createClass(CheckmkDatasource, [{
        key: 'queryTarget',
        value: function queryTarget(target, _ref) {
            var _this = this;

            var scopedVars = _ref.scopedVars,
                range = _ref.range;

            if (!target || target.combinedgraph === '' && (!target.host || !target.service || target.metric === '' && target.graph === '')) {
                return Promise.resolve({ data: [] });
            }

            var site = target.site || null;
            var host_name = (0, _runtime.getTemplateSrv)().replace(target.host, scopedVars);

            var service_description = target.service;

            var graph_index = void 0;
            var metric_index = void 0;

            if (target.mode === 'combined') {
                return this.queryCombinedTarget(target, { scopedVars: scopedVars, range: range });
            } else if (target.mode === 'metric') {
                var _target$metric$split$ = target.metric.split(metricDivider).map(function (i) {
                    return +i;
                });

                var _target$metric$split$2 = _slicedToArray(_target$metric$split$, 2);

                graph_index = _target$metric$split$2[0];
                metric_index = _target$metric$split$2[1];
            } else {
                graph_index = +target.graph;
            }

            if (isNaN(graph_index)) {
                return Promise.resolve({ data: [] });
            }

            var data = (0, _request.buildRequestBody)({
                specification: ['template', {
                    site: site,
                    host_name: host_name,
                    service_description: service_description,
                    graph_index: graph_index
                }],
                data_range: {
                    time_range: [range.from.unix(), range.to.unix()]
                }
            });

            delete this.lastErrors[target.refId];

            return this.doRequest({
                params: { action: 'get_graph' },
                data: data
            }).then(function (response) {
                if (response.data.result_code !== 0) {
                    throw new Error('' + response.data.result);
                }

                var _response$data$result = response.data.result,
                    start_time = _response$data$result.start_time,
                    step = _response$data$result.step,
                    curves = _response$data$result.curves;

                var format = (0, _data.formatCurveData)(start_time, step, target.format, target);

                if (metric_index != null) {
                    // filter for one specific metric
                    return [format(curves[metric_index])];
                }

                return curves.map(format);
            }).catch(function (err) {
                _this.lastErrors[target.refId] = err.message;
            });
        }
    }, {
        key: 'queryCombinedTarget',
        value: function queryCombinedTarget(target, _ref2) {
            var _this2 = this;

            var scopedVars = _ref2.scopedVars,
                range = _ref2.range;

            var host_name = (0, _runtime.getTemplateSrv)().replace(target.host, scopedVars);
            target.host = host_name;

            var data = {
                specification: ['combined', {
                    context: getContext(target),
                    graph_template: target.combinedgraph,
                    presentation: target.presentation,
                    single_infos: ['host'],
                    datasource: 'services'
                }],
                data_range: {
                    time_range: [range.from.unix(), range.to.unix()]
                }
            };

            if (!target.usehostregex) {
                data.specification[1].host_name = target.host;
            }

            delete this.lastErrors[target.refId];

            return this.doRequest({
                params: { action: 'get_graph' },
                data: (0, _request.buildRequestBody)(data)
            }).then(function (response) {
                if (response.data.result_code !== 0) {
                    throw new Error('' + response.data.result);
                }

                var _response$data$result2 = response.data.result,
                    start_time = _response$data$result2.start_time,
                    step = _response$data$result2.step,
                    curves = _response$data$result2.curves;

                return curves.map((0, _data.formatCurveData)(start_time, step, target.format, target));
            }).catch(function (err) {
                _this2.lastErrors[target.refId] = err.message;
            });
        }
    }, {
        key: 'getLastError',
        value: function getLastError(refId) {
            return this.lastErrors[refId];
        }
    }, {
        key: 'query',
        value: function query(options) {
            var _this3 = this;

            var targets = options.targets.filter(function (_ref3) {
                var hide = _ref3.hide;
                return !hide;
            });
            return Promise.all(targets.map(function (target) {
                return _this3.queryTarget(target, options);
            })).then(function (data) {
                return data.reduce(function (all, d) {
                    return all.concat(d);
                }, []);
            }).then(function (data) {
                return { data: data };
            });
        }
    }, {
        key: 'testDatasource',
        value: function testDatasource() {
            if (!urlValidationRegex.test(this.rawUrl)) {
                return _errors2.default.FORMAT;
            }

            return this.doRequest({
                params: { action: 'get_host_names' }
            }).then(function (response) {
                if (response.status !== 200) {
                    return _errors2.default.STATUS;
                } else if (!response.data.result) {
                    return _errors2.default.OTHER(response.data);
                } else {
                    return {
                        status: 'success',
                        message: 'Data source is working',
                        title: 'Success'
                    };
                }
            }).catch(function (_ref4) {
                var cancelled = _ref4.cancelled;
                return cancelled ? _errors2.default.CANCEL : _errors2.default.READ;
            });
        }
    }, {
        key: 'annotationQuery',
        value: function annotationQuery(options) {
            var _this4 = this;

            var _options$annotation$q = _slicedToArray(options.annotation.queries, 1),
                query = _options$annotation$q[0];

            var context = {
                site: query.site,
                serviceregex: { service_regex: query.useserviceregex ? query.serviceregex : query.service || '.*' }
            };

            if (query.usehostregex) {
                context.hostregex = { host_regex: query.hostregex };
            } else {
                context.host = query.host;
            }

            var data = {
                context: context,
                start_time: options.range.from.unix(),
                end_time: options.range.to.unix()
            };

            return this.doRequest({
                params: { action: 'get_graph_annotations' },
                data: (0, _request.buildRequestBody)(data)
            }).then(function (result) {
                if (!result.data.result.availability_timelines) {
                    throw new Error('Annotations are not supported by this Checkmk version.');
                }
                if (!result.data.result.availability_timelines.length) {
                    return [];
                }

                var items = result.data.result.availability_timelines.map(function (tl) {
                    return tl.timeline.filter(function (_ref5) {
                        var _ref6 = _slicedToArray(_ref5, 2),
                            state = _ref6[1];

                        return query.showAnnotations.includes(state);
                    }).map(function (_ref7) {
                        var _ref8 = _slicedToArray(_ref7, 2),
                            item = _ref8[0],
                            state = _ref8[1];

                        return Object.assign(item, { state: state });
                    });
                }).reduce(function (all, a) {
                    return all.concat(a);
                }, []);

                var baseLink = _this4.rawUrl + 'check_mk/view.py';

                return items.map(function (item) {
                    var hostLink = (0, _request.buildUrlWithParams)(baseLink, {
                        host: item.host_name,
                        site: item.site,
                        view_name: 'hoststatus'
                    });
                    var serviceLink = (0, _request.buildUrlWithParams)(baseLink, {
                        host: item.host_name,
                        site: item.site,
                        service: item.service_description,
                        view_name: 'service'
                    });
                    var stateLink = (0, _request.buildUrlWithParams)(baseLink, {
                        host: item.host_name,
                        site: item.site,
                        service: item.service_description,
                        view_name: 'service',
                        mode: 'availability',
                        av_mode: 'timeline'
                    });
                    var tableData = [['Host', '<a href="' + hostLink + '" target="_blank">' + item.host_name + '</a>'], ['Service Description', '<a href="' + serviceLink + '" target="_blank">' + item.service_description + '</a>'], ['State', '<a href="' + stateLink + '" target="_blank">' + item.state + '</a>'], ['In Downtime', item.in_downtime ? 'Yes' : 'No']];

                    var text = '<table>' + tableData.map(function (tr) {
                        return tr.map(function (td) {
                            return '<td>&nbsp;' + td + '&nbsp;</td>';
                        }).join('');
                    }).map(function (tr) {
                        return '<tr>' + tr + '</tr>';
                    }).join('') + '</table>';

                    return {
                        annotation: options,
                        time: item.from * 1000,
                        text: text
                    };
                });
            });
        }
    }, {
        key: 'metricFindQuery',
        value: function metricFindQuery(query) {
            if (query == 'host') {
                return this.hostsQuery({ site: '' });
            }

            return [{ 'text': query, 'value': query }];
        }
    }, {
        key: 'sitesQuery',
        value: function sitesQuery(query) {
            var disableAll = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            return this.doRequest({
                params: { action: 'get_user_sites' }
            }).then(_request.getResult).then(function (result) {
                return result.map(function (_ref9) {
                    var _ref10 = _slicedToArray(_ref9, 2),
                        value = _ref10[0],
                        text = _ref10[1];

                    return { text: text, value: value };
                }).sort(_sort.sortByText);
            }).then(function (sites) {
                return disableAll ? sites : [{ text: 'All Sites', value: '' }].concat(sites);
            });
        }
    }, {
        key: 'hostsQuery',
        value: function hostsQuery(query) {
            var params = {
                action: 'get_host_names'
            };

            if (query.site) {
                params.site_id = query.site;
            }

            return this.doRequest({ params: params }).then(_request.getResult).then(function (result) {
                return result.map(function (hostname) {
                    return { text: hostname, value: hostname };
                }).sort(_sort.sortByText);
            });
        }
    }, {
        key: 'servicesQuery',
        value: function servicesQuery(query) {
            var disableAll = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            if (!query.host) {
                return Promise.resolve([]);
            }
            return this.doRequest({
                params: { action: 'get_metrics_of_host' },
                data: (0, _request.buildRequestBody)({ hostname: query.host })
            }).then(_request.getResult).then(function (result) {
                return Object.keys(result).map(function (key) {
                    return { text: key, value: key };
                }).sort(_sort.sortByText);
            }).then(function (services) {
                return disableAll ? services : [{ text: 'All Services', value: '' }].concat(services);
            });
        }
    }, {
        key: 'serviceOptionsQuery',
        value: function serviceOptionsQuery(query) {
            var data = {
                specification: ['template', {
                    site: query.site || null,
                    service_description: query.service,
                    host_name: query.host
                }]
            };

            return this.doRequest({
                params: { action: 'get_graph_recipes' },
                data: (0, _request.buildRequestBody)(data)
            });
        }
    }, {
        key: 'filterGroupQuery',
        value: function filterGroupQuery() {
            return this.doRequest({ params: { action: 'get_hosttags' } }).then(_request.getResult).then(function (result) {
                return result.tag_groups.map(function (_ref11) {
                    var id = _ref11.id,
                        title = _ref11.title;
                    return { text: title, value: id };
                }).sort(_sort.sortByText);
            });
        }
    }, {
        key: 'filterValueQuery',
        value: function filterValueQuery(query, index) {
            if (!query['filter' + index + 'group']) {
                return Promise.resolve([]);
            }
            return this.doRequest({ params: { action: 'get_hosttags' } }).then(_request.getResult).then(function (result) {
                return result.tag_groups.find(function (_ref12) {
                    var id = _ref12.id;
                    return id === query['filter' + index + 'group'];
                }).tags.map(function (_ref13) {
                    var id = _ref13.id,
                        title = _ref13.title;
                    return { text: title, value: id };
                }).sort(_sort.sortByText);
            });
        }
    }, {
        key: 'metricsQuery',
        value: function metricsQuery(query) {
            if (!query.host || !query.service) {
                return Promise.resolve([]);
            }

            return this.serviceOptionsQuery(query).then(_request.getResult).then(function (result) {
                if (!result.length) {
                    return [{ text: 'no metrics available', value: '-' }];
                }

                return result.map(function (graph, graphIndex) {
                    return graph.metrics.map(function (metric, metricIndex) {
                        return { text: metric.title, value: '' + graphIndex + metricDivider + metricIndex };
                    });
                }).reduce(function (all, metrics) {
                    return all.concat(metrics);
                }, []).filter(function (f, i, all) {
                    return all.findIndex(function (x) {
                        return x.text === f.text;
                    }) === i;
                }) // metrics are not necessary unique to one graph, filtering here to make results unique
                .sort(_sort.sortByText);
            });
        }
    }, {
        key: 'graphsQuery',
        value: function graphsQuery(query) {
            if (!query.host || !query.service) {
                return Promise.resolve([]);
            }

            return this.serviceOptionsQuery(query).then(function (response) {
                if (!response.data.result.length) {
                    return [{ text: 'no graphs available', value: '-' }];
                }

                return response.data.result.map(function (graph, index) {
                    return { text: graph.title, value: index };
                }).sort(_sort.sortByText);
            });
        }
    }, {
        key: 'combinedGraphsQuery',
        value: function combinedGraphsQuery(query) {
            if (!query.presentation) {
                return Promise.resolve([]);
            }

            var data = {
                context: getContext(query),
                datasource: 'services',
                presentation: query.presentation,
                single_infos: ['host']
            };

            return this.doRequest({
                params: { action: 'get_combined_graph_identifications' },
                data: (0, _request.buildRequestBody)(data)
            }).then(function (response) {
                if (!response.data.result.length) {
                    return [{ text: 'no graphs available', value: '-' }];
                }

                return response.data.result.map(function (_ref14) {
                    var title = _ref14.title,
                        identification = _ref14.identification;
                    return { text: title, value: identification[1].graph_template };
                }).sort(_sort.sortByText);
            });
        }
    }, {
        key: 'doRequest',
        value: function doRequest(options) {
            options.url = (0, _request.buildUrlWithParams)(this.rawUrl + 'check_mk/webapi.py', Object.assign({
                _username: this._username,
                _secret: this._secret,
                output_format: 'json'
            }, options.params));

            delete options.params;

            options.method = options.data == null ? 'GET' : 'POST';
            options.headers = this.headers;

            return this.backendSrv.datasourceRequest(options);
        }
    }]);

    return CheckmkDatasource;
}();
//# sourceMappingURL=datasource.js.map
