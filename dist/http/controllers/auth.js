"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const exceptions_1 = require("./exceptions");
const auth_1 = require("../../services/auth");
const auth_2 = require("../../services/auth");
const utils_1 = require("../../services/utils");
const database_1 = __importDefault(require("../../services/database"));
const db = database_1.default.singleton();
const authController = (0, express_1.default)();
const validLoginParams = (req) => {
    return req.body && req.body.username && req.body.password;
};
authController.post('/revoke', async (req, res, next) => {
    const { token } = req.body;
    if (!token) {
        next(new exceptions_1.HTTP422UnprocessableEntity('missing token'));
        return;
    }
    // only keep as long as it is valid
    const tokenData = auth_1.easyJwt.decode(token);
    if (tokenData === null ||
        typeof tokenData.payload === 'string') {
        next(new exceptions_1.HTTP422UnprocessableEntity('token could not be decoded'));
        return;
    }
    const { payload: { exp } } = tokenData;
    /**
     * if token has expiry only keep it for as many days until that expiry
     * default 7 days
     */
    const daysToKeep = exp
        ? (0, utils_1.daysBetweenDates)(new Date(), new Date(exp * 1000))
        : 7;
    await db.createRevokedToken(token, daysToKeep);
    res.status(200).send();
});
authController.post('/refresh', async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        next(new exceptions_1.HTTP422UnprocessableEntity('missing refreshToken'));
        return;
    }
    let accessToken;
    try {
        accessToken = await auth_1.easyJwt.refreshJwt(refreshToken);
    }
    catch (error) {
        next(new exceptions_1.HTTP401Unauthorized(error instanceof Error ? error.message : 'refresh token invalid'));
        return;
    }
    const revokedTokenData = await db.getRevokedToken(refreshToken);
    if (revokedTokenData) {
        next(new exceptions_1.HTTP401Unauthorized('refresh token revoked'));
        return;
    }
    res.status(200).json({ accessToken });
});
authController.post('/register', async (req, res, next) => {
    if (!validLoginParams(req)) {
        next(new exceptions_1.HTTP422UnprocessableEntity('Invalid username or password'));
        return;
    }
    const { username, password } = req.body;
    // if this user exists return 422
    const existingUser = await db.getUser(username);
    if (existingUser !== null) {
        next(new exceptions_1.HTTP422UnprocessableEntity('Username must be unique'));
        return;
    }
    const newUser = await db.createUser(username, password);
    const { accessToken, expiresIn, refreshToken } = auth_1.easyJwt.createTokens(newUser.uid);
    res.status(201).json({ accessToken, expiresIn, refreshToken });
});
authController.post('/auth', async (req, res, next) => {
    if (!validLoginParams(req)) {
        next(new exceptions_1.HTTP422UnprocessableEntity('Invalid username or password'));
        return;
    }
    const { username, password } = req.body;
    // get user
    const existingUser = await db.getUser(username);
    // error if not exist
    if (existingUser === null) {
        next(new exceptions_1.HTTP401Unauthorized('no such user'));
        return;
    }
    // error if pass invalid
    if (!(0, auth_2.verifyPassword)(password, existingUser.hashedPassword)) {
        next(new exceptions_1.HTTP401Unauthorized('invalid credentials'));
        return;
    }
    // get tokens
    const { accessToken, expiresIn, refreshToken } = auth_1.easyJwt.createTokens(existingUser.uid);
    res.status(200).json({ accessToken, expiresIn, refreshToken });
});
exports.default = authController;
