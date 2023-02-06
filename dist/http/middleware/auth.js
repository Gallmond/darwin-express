"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processJwt = void 0;
const auth_1 = require("../../services/auth");
const firestore_1 = require("../../services/firestore");
const exceptions_1 = require("../controllers/exceptions");
const getBearerToken = (req) => {
    const header = req.get('authorization');
    if (!header)
        return null;
    const [type, token] = header.split(' ');
    if (type.toLowerCase() !== 'bearer')
        return null;
    return token;
};
const processJwt = async (req, res, next) => {
    const token = getBearerToken(req);
    if (token) {
        let payload;
        try {
            payload = auth_1.easyJwt.verifyJwt(token);
        }
        catch (err) {
            next(new exceptions_1.HTTP401Unauthorized(err instanceof Error ? err.message : 'unknown jwt error'));
            return;
        }
        if (!payload.sub) {
            next(new exceptions_1.HTTP401Unauthorized('jwt missing subject'));
            return;
        }
        const user = await (0, firestore_1.getUserByUsername)(payload.sub);
        if (!user) {
            next(new exceptions_1.HTTP401Unauthorized('jwt subject not found'));
            return;
        }
        req.auth = { user };
    }
    next();
};
exports.processJwt = processJwt;
