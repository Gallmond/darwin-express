"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.easyJwt = exports.verifyPassword = exports.hashPassword = exports.passwordValid = void 0;
const easy_jwt_1 = __importDefault(require("easy-jwt"));
const node_crypto_1 = require("node:crypto");
const getSalt = () => {
    return (0, node_crypto_1.randomBytes)(16).toString('hex');
};
const passwordValid = (plaintextPassword) => {
    return plaintextPassword.length >= 16;
};
exports.passwordValid = passwordValid;
const hashPassword = (plaintextPassword, providedSalt) => {
    const salt = providedSalt ?? getSalt();
    const hashedPassword = (0, node_crypto_1.scryptSync)(plaintextPassword, salt, 64).toString('hex');
    return [hashedPassword, salt].join('.');
};
exports.hashPassword = hashPassword;
const verifyPassword = (plaintextPassword, storedHash) => {
    const [storedHashedPassword, salt] = storedHash.split('.');
    const [providedHashedPassword] = (0, exports.hashPassword)(plaintextPassword, salt).split('.');
    return (0, node_crypto_1.timingSafeEqual)(Buffer.from(storedHashedPassword, 'hex'), Buffer.from(providedHashedPassword, 'hex'));
};
exports.verifyPassword = verifyPassword;
exports.easyJwt = new easy_jwt_1.default({
    secret: process.env.JWT_SECRET ?? (0, node_crypto_1.randomBytes)(12).toString('hex'),
    audience: process.env.JWT_AUD ?? 'darwin-express',
    accessToken: { expiresIn: 60 * 60 * 24 },
    refreshToken: { expiresIn: 60 * 60 * 24 * 7 },
});
