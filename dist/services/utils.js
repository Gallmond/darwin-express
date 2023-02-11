"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boolOrNull = exports.daysBetweenDates = exports.MILLISECONDS = void 0;
var MILLISECONDS;
(function (MILLISECONDS) {
    MILLISECONDS[MILLISECONDS["HOUR"] = 3600000] = "HOUR";
    MILLISECONDS[MILLISECONDS["DAY"] = 86400000] = "DAY";
})(MILLISECONDS = exports.MILLISECONDS || (exports.MILLISECONDS = {}));
const daysBetweenDates = (dateOne, dateTwo) => {
    const diff = Math.abs(dateOne.valueOf() - dateTwo.valueOf());
    return diff / MILLISECONDS.DAY;
};
exports.daysBetweenDates = daysBetweenDates;
/**
 * only an actual boolean or string 'true' should be true
 */
const boolOrNull = (val) => {
    if (typeof val === null)
        return null;
    if (typeof val === 'boolean')
        return val;
    if (typeof val === 'string') {
        if (val.toLowerCase() === 'true')
            return true;
        return false;
    }
    return false;
};
exports.boolOrNull = boolOrNull;
