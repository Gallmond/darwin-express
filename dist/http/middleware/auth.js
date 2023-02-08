"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processJwt = void 0;
const auth_1 = require("../../services/auth");
const exceptions_1 = require("../controllers/exceptions");
const database_1 = __importDefault(require("../../services/database"));
const db = database_1.default.singleton();
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
            payload = await auth_1.easyJwt.verifyJwt(token);
        }
        catch (err) {
            next(new exceptions_1.HTTP401Unauthorized(err instanceof Error ? err.message : 'unknown jwt error'));
            return;
        }
        if (!payload.sub) {
            next(new exceptions_1.HTTP401Unauthorized('jwt missing subject'));
            return;
        }
        const revokedTokenData = await db.getRevokedToken(token);
        if (revokedTokenData) {
            next(new exceptions_1.HTTP401Unauthorized('token revoked'));
            return;
        }
        const user = await db.getUser(payload.sub);
        if (!user) {
            next(new exceptions_1.HTTP401Unauthorized('jwt subject not found'));
            return;
        }
        req.auth = { user };
    }
    next();
};
exports.processJwt = processJwt;
