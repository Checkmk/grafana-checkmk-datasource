'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GenericDatasourceQueryCtrl = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sdk = require('app/plugins/sdk');

require('./css/query-editor.css!');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var isValidRegex = function isValidRegex(regexString) {
    try {
        new RegExp(regexString);
        return true;
    } catch (e) {
        return false;
    }
};

var GenericDatasourceQueryCtrl = exports.GenericDatasourceQueryCtrl = function (_QueryCtrl) {
    _inherits(GenericDatasourceQueryCtrl, _QueryCtrl);

    function GenericDatasourceQueryCtrl($scope, $injector) {
        _classCallCheck(this, GenericDatasourceQueryCtrl);

        var _this = _possibleConstructorReturn(this, (GenericDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(GenericDatasourceQueryCtrl)).call(this, $scope, $injector));

        _this.scope = $scope;

        _this.target.site = _this.target.site || '';
        _this.target.host = _this.target.host || '';
        _this.target.hostregex = _this.target.hostregex || '';
        _this.target.service = _this.target.service || '';
        _this.target.serviceregex = _this.target.serviceregex || '';
        _this.target.mode = _this.target.mode || 'graph';
        _this.target.metric = _this.target.metric != null ? _this.target.metric : '';
        _this.target.graph = _this.target.graph != null ? _this.target.graph : '';
        _this.target.presentation = _this.target.presentation != null ? _this.target.presentation : '';
        _this.target.combinedgraph = _this.target.combinedgraph != null ? _this.target.combinedgraph : '';

        _this.target.filter0group = _this.target.filter0group || '';
        _this.target.filter1group = _this.target.filter1group || '';
        _this.target.filter2group = _this.target.filter2group || '';

        _this.target.filter0op = _this.target.filter0op || 'is';
        _this.target.filter1op = _this.target.filter1op || 'is';
        _this.target.filter2op = _this.target.filter2op || 'is';

        _this.target.filter0value = _this.target.filter0value || '';
        _this.target.filter1value = _this.target.filter1value || '';
        _this.target.filter2value = _this.target.filter2value || '';
        return _this;
    }

    _createClass(GenericDatasourceQueryCtrl, [{
        key: 'getSiteOptions',
        value: function getSiteOptions() {
            return this.datasource.sitesQuery(this.target);
        }
    }, {
        key: 'getHostOptions',
        value: function getHostOptions() {
            return this.datasource.hostsQuery(this.target);
        }
    }, {
        key: 'getServiceOptions',
        value: function getServiceOptions() {
            return this.datasource.servicesQuery(this.target);
        }
    }, {
        key: 'getMetricOptions',
        value: function getMetricOptions() {
            return this.datasource.metricsQuery(this.target);
        }
    }, {
        key: 'getGraphOptions',
        value: function getGraphOptions() {
            return this.datasource.graphsQuery(this.target);
        }
    }, {
        key: 'getCombinedGraphOptions',
        value: function getCombinedGraphOptions() {
            return this.datasource.combinedGraphsQuery(this.target);
        }
    }, {
        key: 'getFilterGroupOptions',
        value: function getFilterGroupOptions() {
            return this.datasource.filterGroupQuery(this.target);
        }
    }, {
        key: 'getFilterOperationOptions',
        value: function getFilterOperationOptions() {
            return [{ value: 'is', text: 'is' }, { value: 'isnot', text: 'is not' }];
        }
    }, {
        key: 'getFilterValueOptions',
        value: function getFilterValueOptions(index) {
            return this.datasource.filterValueQuery(this.target, index);
        }
    }, {
        key: 'getPresentationOptions',
        value: function getPresentationOptions() {
            return [{ value: 'lines', text: 'Lines' }, { value: 'stacked', text: 'Stacked' }, { value: 'sum', text: 'Sum' }, { value: 'average', text: 'Average' }, { value: 'min', text: 'Minimum' }, { value: 'max', text: 'Maximum' }];
        }
    }, {
        key: 'getModeOptions',
        value: function getModeOptions() {
            return [{ text: 'predefined graph', value: 'graph' }, { text: 'single metric', value: 'metric' }, { text: 'combined graph', value: 'combined' }];
        }
    }, {
        key: 'getLastError',
        value: function getLastError() {
            return this.datasource.getLastError(this.target.refId);
        }
    }, {
        key: 'toggleEditorMode',
        value: function toggleEditorMode() {
            this.target.rawQuery = !this.target.rawQuery;
        }
    }, {
        key: 'isHostRegexValid',
        value: function isHostRegexValid() {
            return isValidRegex(this.target.hostregex);
        }
    }, {
        key: 'isServiceRegexValid',
        value: function isServiceRegexValid() {
            return isValidRegex(this.target.serviceregex);
        }
    }, {
        key: 'resetGraph',
        value: function resetGraph() {
            this.target.metric = '';
            this.target.graph = '';
            this.target.combinedgraph = '';
            this.target.presentation = '';

            return this;
        }
    }, {
        key: 'resetFilter',
        value: function resetFilter(index) {
            this.target['filter' + index + 'group'] = '';
            this.target['filter' + index + 'op'] = 'is';
            this.target['filter' + index + 'value'] = '';

            return this;
        }
    }, {
        key: 'resetFilters',
        value: function resetFilters() {
            this.resetFilter(0).resetFilter(1).resetFilter(2);

            return this;
        }
    }, {
        key: 'resetService',
        value: function resetService() {
            this.target.service = '';
            return this.resetGraph();
        }
    }, {
        key: 'resetHost',
        value: function resetHost() {
            this.target.host = '';
            return this.resetService();
        }
    }, {
        key: 'onSiteChange',
        value: function onSiteChange() {
            this.resetHost().update();
        }
    }, {
        key: 'onHostChange',
        value: function onHostChange() {
            this.resetService().update();
        }
    }, {
        key: 'onHostRegexChange',
        value: function onHostRegexChange() {
            this.resetService().update();
        }
    }, {
        key: 'onServiceChange',
        value: function onServiceChange() {
            this.resetGraph().update();
        }
    }, {
        key: 'onServiceRegexChange',
        value: function onServiceRegexChange() {
            this.resetGraph().update();
        }
    }, {
        key: 'onMetricChange',
        value: function onMetricChange() {
            this.update();
        }
    }, {
        key: 'onFilterGroupChange',
        value: function onFilterGroupChange(index) {
            this.target['filter' + index + 'op'] = 'is';
            this.target['filter' + index + 'value'] = '';
            this.update();
        }
    }, {
        key: 'onFilterChange',
        value: function onFilterChange() {
            this.update();
        }
    }, {
        key: 'onPresentationChange',
        value: function onPresentationChange() {
            this.update();
        }
    }, {
        key: 'onGraphChange',
        value: function onGraphChange() {
            this.update();
        }
    }, {
        key: 'onCombinedGraphChange',
        value: function onCombinedGraphChange() {
            this.update();
        }
    }, {
        key: 'onModeChange',
        value: function onModeChange() {
            this.target.usehostregex = false;
            this.resetGraph().resetFilters().update();
        }
    }, {
        key: 'update',
        value: function update() {
            this.panelCtrl.refresh(); // Asks the panel to refresh data.
        }
    }]);

    return GenericDatasourceQueryCtrl;
}(_sdk.QueryCtrl);

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
//# sourceMappingURL=query_ctrl.js.map
