"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
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

exports.default = {
    formatCurveData: formatCurveData
};
//# sourceMappingURL=data.js.map
