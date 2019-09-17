"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var isValidRegex = function isValidRegex(regexString) {
    try {
        new RegExp(regexString);
        return true;
    } catch (e) {
        return false;
    }
};

exports.isValidRegex = isValidRegex;
//# sourceMappingURL=regex.js.map
