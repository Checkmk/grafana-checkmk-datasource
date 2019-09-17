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
        hostregex: query.hostregex,
        usehostregex: query.usehostregex,
        service: query.service,
        serviceregex: query.serviceregex,
        useserviceregex: query.usehostregex || query.useserviceregex,
        show: show
    };
};

var CheckmkAnnotationsQueryCtrl = exports.CheckmkAnnotationsQueryCtrl = function () {
    function CheckmkAnnotationsQueryCtrl() /*timeSrv, dashboardSrv*/{
        _classCallCheck(this, CheckmkAnnotationsQueryCtrl);

        this.annotation.queries = this.annotation.queries || [];
        this.config = queryToConfig(this.annotation.queries[0]);
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
            return this.datasource.servicesQuery(this.config, false);
        }
    }, {
        key: 'onSiteChange',
        value: function onSiteChange() {
            this.config.host = '';
            this.config.hostregex = '';
            this.config.usehostregex = false;
            this.config.service = '';
            this.config.serviceregex = '';
            this.config.useserviceregex = false;
            this.update();
        }
    }, {
        key: 'onHostChange',
        value: function onHostChange() {
            this.config.service = '';
            this.config.hostregex = '';
            this.update();
        }
    }, {
        key: 'onHostRegexChange',
        value: function onHostRegexChange() {
            this.config.service = '';
            this.config.host = '';
            this.update();
        }
    }, {
        key: 'onServiceChange',
        value: function onServiceChange() {
            this.config.serviceregex = '';
            this.update();
        }
    }, {
        key: 'onServiceRegexChange',
        value: function onServiceRegexChange() {
            this.config.service = '';
            this.update();
        }
    }, {
        key: 'onShowAnnotationChange',
        value: function onShowAnnotationChange() {
            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            var _this = this;

            this.annotation.queries = [{
                site: this.config.site,
                host: this.config.host,
                hostregex: this.config.hostregex,
                usehostregex: this.config.usehostregex,
                service: this.config.service,
                serviceregex: this.config.serviceregex,
                useserviceregex: this.config.usehostregex || this.config.useserviceregex,
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
