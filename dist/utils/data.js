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

var formatCurveData = function formatCurveData(startTime, step, formatString, _ref) {
    var site = _ref.site,
        host = _ref.host,
        service = _ref.service;
    return function (_ref2) {
        var rrddata = _ref2.rrddata,
            title = _ref2.title;

        var datapoints = rrddata.map(function (d, i) {
            return [d, (startTime + i * step) * 1000];
        }).filter(function (f) {
            return f[0];
        });

        formatString = formatString || '$title';

        var target = formatString.replace('$title', title).replace('$site', site || '').replace('$host', host || '').replace('$service', service || '');

        return {
            target: target,
            datapoints: datapoints
        };
    };
};

exports.getHostTags = getHostTags;
exports.formatCurveData = formatCurveData;
//# sourceMappingURL=data.js.map
