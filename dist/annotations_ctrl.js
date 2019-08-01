'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GenericAnnotationsQueryCtrl = exports.GenericAnnotationsQueryCtrl = function () {
    function GenericAnnotationsQueryCtrl() /*timeSrv, dashboardSrv*/{
        _classCallCheck(this, GenericAnnotationsQueryCtrl);

        this.target = this.target || {};
        this.target.site = this.target.site || '';
        this.target.host = this.target.host || '';
        this.target.service = this.target.service || '';

        this.annotation.queries = this.annotation.queries || [];
    }

    _createClass(GenericAnnotationsQueryCtrl, [{
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
            // do nothing for now
            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            this.annotation.queries = [{
                site: this.target.site,
                host: this.target.host,
                service: this.target.service
            }];
        }
    }]);

    return GenericAnnotationsQueryCtrl;
}();

GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
//# sourceMappingURL=annotations_ctrl.js.map
