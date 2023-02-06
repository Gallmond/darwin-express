"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const auth_1 = __importDefault(require("./http/controllers/auth"));
const exceptions_1 = require("./http/controllers/exceptions");
const auth_2 = require("./http/middleware/auth");
// global middleware
app.use(express_1.default.json());
app.use(auth_2.processJwt);
app.get('/hello-world', (req, res) => {
    res.status(200).json({ message: 'hello world' });
});
app.get('/guarded', async (req, res, next) => {
    if (!req.auth) {
        next(new exceptions_1.HTTP401Unauthorized('Guarded route without token'));
        return;
    }
    res.status(200).json(req.auth.user);
});
app.use(auth_1.default);
// global error handler
const globalErrorHandler = (err, req, res, next) => {
    if (err instanceof exceptions_1.BaseError) {
        res.status(err.code).json(err.json).end();
        return;
    }
    console.error('encountered unhandled error', { err });
    next(err);
};
app.use(globalErrorHandler);
exports.default = app;
