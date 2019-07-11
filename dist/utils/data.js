'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var getHostTags = function getHostTags(target) {
    var hostTags = {};

    for (var i = 0; i <= 2; i++) {
        if (target['filter' + i + 'value'] != null && target['filter' + i + 'value'] != '') {
            hostTags['host_tag_' + i + '_grp'] = target['filter' + i + 'group'];
            hostTags['host_tag_' + i + '_op'] = target['filter' + i + 'op'];
            hostTags['host_tag_' + i + '_val'] = target['filter' + i + 'value'];
        }
    }

    return hostTags;
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

exports.getHostTags = getHostTags;
exports.formatCurveData = formatCurveData;
//# sourceMappingURL=data.js.map
