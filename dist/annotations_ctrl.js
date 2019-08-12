'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var showAnnotationsOptions = ['ok', 'warn', 'crit', 'unknown', 'flapping', 'host_down', 'in_downtime', 'outof_notification_period', 'outof_service_period', 'unmonitored'];

var CheckmkAnnotationsQueryCtrl = exports.CheckmkAnnotationsQueryCtrl = function () {
    function CheckmkAnnotationsQueryCtrl() /*timeSrv, dashboardSrv*/{
        _classCallCheck(this, CheckmkAnnotationsQueryCtrl);

        this.target = this.target || {};
        this.target.site = this.target.site || '';
        this.target.host = this.target.host || '';
        this.target.service = this.target.service || '';

        this.target.show = showAnnotationsOptions.reduce(function (all, option) {
            all[option] = all[option] != null ? all[option] : true;
            return all;
        }, this.target.show || {});

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
            return this.datasource.sitesQuery(this.target, true);
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
        key: 'onSiteChange',
        value: function onSiteChange() {
            this.target.host = '';
            this.target.service = '';
            this.update();
        }
    }, {
        key: 'onHostChange',
        value: function onHostChange() {
            this.target.service = '';
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
        }
    }, {
        key: 'update',
        value: function update() {
            var _this = this;

            this.annotation.queries = [{
                site: this.target.site,
                host: this.target.host,
                service: this.target.service,
                showAnnotations: showAnnotationsOptions.filter(function (annotationType) {
                    return _this.target.show[annotationType];
                })
            }];
        }
    }]);

    return CheckmkAnnotationsQueryCtrl;
}();

CheckmkAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
//# sourceMappingURL=annotations_ctrl.js.map
