"use strict";
class BaseError extends Error {
    name = 'BaseError';
    constructor(msg, options) {
        super(msg, options);
        this.message = msg;
    }
}
