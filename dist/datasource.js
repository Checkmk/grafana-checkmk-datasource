'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GenericDatasource = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _errors2 = _interopRequireDefault(_errors);

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

//TODO: move utilities
var buildUrlWithParams = function buildUrlWithParams(url, params) {
    return url + Object.keys(params).reduce(function (string, param) {
        return '' + string + (string ? '&' : '?') + param + '=' + params[param];
    }, '');
};

var sortByText = function sortByText(a, b) {
    return a.text > b.text ? 1 : -1;
};

var buildRequestBody = function buildRequestBody(data) {
    return 'request=' + JSON.stringify(data);
};

var getResult = function getResult(response) {
    return response.data.result;
};

var formatCurveData = function formatCurveData(startTime, step) {
    return function (curveData) {
        var datapoints = curveData.rrddata.map(function (d, i) {
            return [d, (startTime + i * step) * 1000];
        }).filter(function (f) {
            return f[0];
        });

        return {
            target: curveData.title,
            datapoints: datapoints
        };
    };
};

var GenericDatasource = exports.GenericDatasource = function () {
    // backendSrv, templateSrv are injected - do not rename
    function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
        _classCallCheck(this, GenericDatasource);

        this.type = instanceSettings.type;
        this.name = instanceSettings.name;
        this.q = $q;
        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;

        this.rawUrl = instanceSettings.jsonData.url;
        this._username = instanceSettings.jsonData.username;
        this._secret = instanceSettings.jsonData.secret;

        this.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    }

    _createClass(GenericDatasource, [{
        key: 'queryTarget',
        value: function queryTarget(target, _ref) {
            var range = _ref.range;

            if (!target || !target.host || !target.service || target.metric === '' && target.graph === '') {
                return Promise.resolve({ data: [] });
            }

            var site = target.site || null;
            var host_name = target.host;
            var service_description = target.service;

            var graph_index = void 0;
            var metric_index = void 0;

            if (target.mode === 'metric') {
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

            var data = buildRequestBody({
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

            return this.doRequest({
                params: { action: 'get_graph' },
                data: data,
                method: 'POST'
            }).then(function (response) {
                if (response.data.result_code !== 0) {
                    throw new Error('Error while fetching data');
                }

                var _response$data$result = response.data.result,
                    start_time = _response$data$result.start_time,
                    step = _response$data$result.step,
                    curves = _response$data$result.curves;


                if (metric_index != null) {
                    // filter for one specific metric
                    return [formatCurveData(start_time, step)(curves[metric_index])];
                }

                return curves.map(formatCurveData(start_time, step));
            });
        }
    }, {
        key: 'query',
        value: function query(options) {
            var _this = this;

            var targets = options.targets.filter(function (_ref2) {
                var hide = _ref2.hide;
                return !hide;
            });
            return Promise.all(targets.map(function (target) {
                return _this.queryTarget(target, options);
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
                params: { action: 'get_host_names' },
                method: 'GET'
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
            }).catch(function (_ref3) {
                var cancelled = _ref3.cancelled;
                return cancelled ? _errors2.default.CANCEL : _errors2.default.READ;
            });
        }
    }, {
        key: 'annotationQuery',
        value: function annotationQuery() {
            throw new Error('Annotation Support not implemented.');
        }
    }, {
        key: 'metricFindQuery',
        value: function metricFindQuery() {
            throw new Error('Template Variable Support not implemented.');
        }
    }, {
        key: 'sitesQuery',
        value: function sitesQuery() {
            return this.doRequest({
                params: { action: 'get_user_sites' },
                method: 'GET'
            }).then(getResult).then(function (result) {
                return result.map(function (_ref4) {
                    var _ref5 = _slicedToArray(_ref4, 2),
                        value = _ref5[0],
                        text = _ref5[1];

                    return { text: text, value: value };
                }).sort(sortByText);
            }).then(function (sites) {
                return [{ text: 'All Sites', value: '' }].concat(sites);
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

            return this.doRequest({
                params: params,
                method: 'GET'
            }).then(getResult).then(function (result) {
                return result.map(function (hostname) {
                    return { text: hostname, value: hostname };
                }).sort(sortByText);
            });
        }
    }, {
        key: 'servicesQuery',
        value: function servicesQuery(query) {
            if (!query.host) {
                return Promise.resolve([]);
            }
            return this.doRequest({
                params: { action: 'get_metrics_of_host' },
                data: buildRequestBody({ hostname: query.host }),
                method: 'POST'
            }).then(getResult).then(function (result) {
                return Object.keys(result).map(function (key) {
                    return { text: key, value: key };
                }).sort(sortByText);
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
                data: buildRequestBody(data),
                method: 'POST'
            });
        }
    }, {
        key: 'metricsQuery',
        value: function metricsQuery(query) {
            if (!query.host || !query.service) {
                return Promise.resolve([]);
            }

            return this.serviceOptionsQuery(query).then(getResult).then(function (result) {
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
                .sort(sortByText);
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
                }).sort(sortByText);
            });
        }
    }, {
        key: 'doRequest',
        value: function doRequest(options) {
            options.url = buildUrlWithParams(this.rawUrl + 'check_mk/webapi.py', Object.assign({
                _username: this._username,
                _secret: this._secret,
                output_format: 'json'
            }, options.params));

            delete options.params;

            options.headers = this.headers;

            return this.backendSrv.datasourceRequest(options);
        }
    }]);

    return GenericDatasource;
}();
//# sourceMappingURL=datasource.js.map
