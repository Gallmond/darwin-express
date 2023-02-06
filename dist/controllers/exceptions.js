"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP401Unauthorized = exports.HTTP422UnprocessableEntity = exports.BaseError = void 0;
class BaseError extends Error {
    message;
    name;
    code;
    constructor(message = 'Something went wrong', name = 'BaseError', code = 500) {
        super(message);
        this.message = message;
        this.name = name;
        this.code = code;
    }
    get json() {
        return {
            name: this.name,
            message: this.message,
            code: this.code
        };
    }
}
exports.BaseError = BaseError;
class HTTP422UnprocessableEntity extends BaseError {
    message;
    name;
    code;
    constructor(message = 'Invalid Request', name = 'HTTP422UnprocessableEntity', code = 422) {
        super(message);
        this.message = message;
        this.name = name;
        this.code = code;
    }
}
exports.HTTP422UnprocessableEntity = HTTP422UnprocessableEntity;
class HTTP401Unauthorized extends BaseError {
    message;
    name;
    code;
    constructor(message = 'Not authorized', name = 'HTTP401Unauthorized', code = 401) {
        super(message);
        this.message = message;
        this.name = name;
        this.code = code;
    }
}
exports.HTTP401Unauthorized = HTTP401Unauthorized;
