"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daysBetweenDates = exports.MILLISECONDS = void 0;
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
