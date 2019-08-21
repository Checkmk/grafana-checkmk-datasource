'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var showAnnotationsOptions = ['ok', 'warn', 'crit', 'unknown', 'flapping', 'host_down', 'in_downtime', 'outof_notification_period', 'outof_service_period', 'unmonitored'];

var queryToConfig = function queryToConfig(query) {
    if (!query) {
        return {};
    }

    var show = showAnnotationsOptions.reduce(function (all, option) {
        all[option] = query.showAnnotations.includes(option);
        return all;
    }, {});

    return {
        site: query.site,
        host: query.host,
        service: query.service,
        show: show
    };
};

var CheckmkAnnotationsQueryCtrl = exports.CheckmkAnnotationsQueryCtrl = function () {
    function CheckmkAnnotationsQueryCtrl() /*timeSrv, dashboardSrv*/{
        _classCallCheck(this, CheckmkAnnotationsQueryCtrl);

        console.log('1', JSON.parse(JSON.stringify(this)));
        this.config = queryToConfig(this.annotation.queries[0]);

        console.log('2', JSON.parse(JSON.stringify(this)));

        this.annotation.queries = this.annotation.queries || [];
    }

    _createClass(CheckmkAnnotationsQueryCtrl, [{
        key: 'getLastError',
        value: function getLastError() {
            return null;
        }
    }, {
        key: 'getSiteOptions',
        value: function getSiteOptions() {
            return this.datasource.sitesQuery(this.config, true);
        }
    }, {
        key: 'getHostOptions',
        value: function getHostOptions() {
            return this.datasource.hostsQuery(this.config);
        }
    }, {
        key: 'getServiceOptions',
        value: function getServiceOptions() {
            return this.datasource.servicesQuery(this.config);
        }
    }, {
        key: 'onSiteChange',
        value: function onSiteChange() {
            this.config.host = '';
            this.config.service = '';
            this.update();
        }
    }, {
        key: 'onHostChange',
        value: function onHostChange() {
            this.config.service = '';
            this.update();
        }
    }, {
        key: 'onServiceChange',
        value: function onServiceChange() {
            this.update();
        }
    }, {
        key: 'onShowAnnotationChange',
        value: function onShowAnnotationChange() {
            this.update();
            console.log('3', JSON.parse(JSON.stringify(this)));
        }
    }, {
        key: 'update',
        value: function update() {
            var _this = this;

            this.annotation.queries = [{
                site: this.config.site,
                host: this.config.host,
                service: this.config.service,
                showAnnotations: showAnnotationsOptions.filter(function (annotationType) {
                    return _this.config.show[annotationType];
                })
            }];
        }
    }]);

    return CheckmkAnnotationsQueryCtrl;
}();

CheckmkAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
//# sourceMappingURL=annotations_ctrl.js.map
