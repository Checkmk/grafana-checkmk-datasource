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

var GenericDatasourceQueryCtrl = exports.GenericDatasourceQueryCtrl = function (_QueryCtrl) {
    _inherits(GenericDatasourceQueryCtrl, _QueryCtrl);

    function GenericDatasourceQueryCtrl($scope, $injector) {
        _classCallCheck(this, GenericDatasourceQueryCtrl);

        var _this = _possibleConstructorReturn(this, (GenericDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(GenericDatasourceQueryCtrl)).call(this, $scope, $injector));

        _this.scope = $scope;
        _this.target.site = _this.target.site || '';
        _this.target.host = _this.target.host || '';
        _this.target.service = _this.target.service || '';
        _this.target.mode = _this.target.mode || 'graph';
        _this.target.metric = _this.target.metric != null ? _this.target.metric : '';
        _this.target.graph = _this.target.graph != null ? _this.target.graph : '';
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
        key: 'getModeOptions',
        value: function getModeOptions() {
            return [{ text: 'predefined graph', value: 'graph' }, { text: 'single metric', value: 'metric' }];
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
        key: 'onChangeInternal',
        value: function onChangeInternal() {
            this.panelCtrl.refresh(); // Asks the panel to refresh data.
        }
    }, {
        key: 'onSiteChange',
        value: function onSiteChange() {
            this.target.host = '';
            this.target.service = '';
            this.target.metric = '';
            this.target.graph = '';
            this.onChangeInternal();
        }
    }, {
        key: 'onHostChange',
        value: function onHostChange() {
            this.target.service = '';
            this.target.metric = '';
            this.target.graph = '';
            this.onChangeInternal();
        }
    }, {
        key: 'onServiceChange',
        value: function onServiceChange() {
            this.target.metric = '';
            this.target.graph = '';
            this.onChangeInternal();
        }
    }, {
        key: 'onMetricChange',
        value: function onMetricChange() {
            this.onChangeInternal();
        }
    }, {
        key: 'onGraphChange',
        value: function onGraphChange() {
            this.onChangeInternal();
        }
    }, {
        key: 'onModeChange',
        value: function onModeChange() {
            this.onChangeInternal();
        }
    }]);

    return GenericDatasourceQueryCtrl;
}(_sdk.QueryCtrl);

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
//# sourceMappingURL=query_ctrl.js.map
