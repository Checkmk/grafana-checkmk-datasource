'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AnnotationsQueryCtrl = exports.QueryOptionsCtrl = exports.ConfigCtrl = exports.QueryCtrl = exports.Datasource = undefined;

var _datasource = require('./datasource');

var _query_ctrl = require('./query_ctrl');

var _annotations_ctrl = require('./annotations_ctrl');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CheckmkConfigCtrl = function CheckmkConfigCtrl() {
    _classCallCheck(this, CheckmkConfigCtrl);
};

CheckmkConfigCtrl.templateUrl = 'partials/config.html';

var CheckmkQueryOptionsCtrl = function CheckmkQueryOptionsCtrl() {
    _classCallCheck(this, CheckmkQueryOptionsCtrl);
};

CheckmkQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

exports.Datasource = _datasource.CheckmkDatasource;
exports.QueryCtrl = _query_ctrl.CheckmkDatasourceQueryCtrl;
exports.ConfigCtrl = CheckmkConfigCtrl;
exports.QueryOptionsCtrl = CheckmkQueryOptionsCtrl;
exports.AnnotationsQueryCtrl = _annotations_ctrl.CheckmkAnnotationsQueryCtrl;
//# sourceMappingURL=module.js.map
