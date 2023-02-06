"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firestore_1 = require("../firebase/firestore");
const exceptions_1 = require("./exceptions");
const easy_jwt_1 = __importDefault(require("easy-jwt"));
const crypto_1 = require("crypto");
const auth_1 = require("../auth");
const authController = (0, express_1.default)();
const easyJwt = new easy_jwt_1.default({
    secret: process.env.JWT_SECRET ?? (0, crypto_1.randomBytes)(12).toString('hex'),
    audience: process.env.JWT_AUD ?? 'darwin-express',
    accessToken: { expiresIn: 60 * 60 * 24 },
    refreshToken: { expiresIn: 60 * 60 * 24 * 7 },
});
const validLoginParams = (req) => {
    return req.body && req.body.username && req.body.password;
};
authController.post('/register', async (req, res, next) => {
    if (!validLoginParams(req)) {
        next(new exceptions_1.HTTP422UnprocessableEntity('Invalid username or password'));
        return;
    }
    const { username, password } = req.body;
    // if this user exists return 422
    const existingUser = await (0, firestore_1.getUserByUsername)(username);
    if (existingUser !== null) {
        next(new exceptions_1.HTTP422UnprocessableEntity('Username must be unique'));
        return;
    }
    // create user
    const newUser = await (0, firestore_1.createNewUser)(username, password);
    // generate a JWT
    const { accessToken, expiresIn, refreshToken } = easyJwt.createTokens(newUser.uid);
    res.status(201).json({ accessToken, expiresIn, refreshToken });
});
authController.post('/auth', async (req, res, next) => {
    if (!validLoginParams(req)) {
        next(new exceptions_1.HTTP422UnprocessableEntity('Invalid username or password'));
        return;
    }
    const { username, password } = req.body;
    // get user
    const existingUser = await (0, firestore_1.getUserByUsername)(username);
    // error if not exist
    if (existingUser === null) {
        next(new exceptions_1.HTTP401Unauthorized('no such user'));
        return;
    }
    // error if pass invalid
    if (!(0, auth_1.verifyPassword)(password, existingUser.hashedPassword)) {
        next(new exceptions_1.HTTP401Unauthorized('invalid credentials'));
        return;
    }
    // get tokens
    const { accessToken, expiresIn, refreshToken } = easyJwt.createTokens(existingUser.uid);
    res.status(201).json({ accessToken, expiresIn, refreshToken });
});
exports.default = authController;
