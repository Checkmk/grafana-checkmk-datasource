'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var buildUrlWithParams = function buildUrlWithParams(url, params) {
    return url + Object.keys(params).reduce(function (string, param) {
        return '' + string + (string ? '&' : '?') + param + '=' + params[param];
    }, '');
};

var buildRequestBody = function buildRequestBody(data) {
    return 'request=' + JSON.stringify(data);
};

var getResult = function getResult(response) {
    return response.data.result;
};

exports.default = {
    buildUrlWithParams: buildUrlWithParams,
    buildRequestBody: buildRequestBody,
    getResult: getResult
};
//# sourceMappingURL=request.js.map
