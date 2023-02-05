"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = exports.generateJWT = exports.generateRefreshTokenForJWT = exports.verifyPassword = exports.hashPassword = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const node_crypto_1 = __importStar(require("node:crypto"));
const jsonwebtoken_1 = require("jsonwebtoken");
dotenv_1.default.config();
const hashPassword = (plaintextPassword) => {
    const salt = node_crypto_1.default.randomBytes(16).toString('hex');
    const hash = node_crypto_1.default.scryptSync(plaintextPassword, salt, 64).toString('hex');
    return `${hash}.${salt}`;
};
exports.hashPassword = hashPassword;
const verifyPassword = (plaintextPassword, storedHash) => {
    const [hash, salt] = storedHash.split('.');
    const hashBuffer = Buffer.from(hash, 'hex');
    const suppliedBuffer = node_crypto_1.default.scryptSync(plaintextPassword, salt, 64);
    return node_crypto_1.default.timingSafeEqual(hashBuffer, suppliedBuffer);
};
exports.verifyPassword = verifyPassword;
const generateRefreshTokenForJWT = (jwt) => {
};
exports.generateRefreshTokenForJWT = generateRefreshTokenForJWT;
/**
 * Returns a JWT that expires in one hour
 *
 * @param uid
 * @param customPayload
 * @returns
 */
const generateJWT = (uid, customPayload = {}) => {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtAud = process.env.JWT_AUD;
    if (!jwtSecret)
        throw new Error('missing JWT_SECRET');
    if (!jwtAud)
        throw new Error('missing JWT_AUD');
    const oneHourInSeconds = 60 * 60;
    return (0, jsonwebtoken_1.sign)(customPayload, jwtSecret, {
        expiresIn: oneHourInSeconds,
        audience: jwtAud,
        subject: uid,
        jwtid: (0, node_crypto_1.randomBytes)(16).toString('hex'),
    });
};
exports.generateJWT = generateJWT;
const verifyJWT = (jwt) => {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtAud = process.env.JWT_AUD;
    if (!jwtSecret)
        throw new Error('missing JWT_SECRET');
    if (!jwtAud)
        throw new Error('missing JWT_AUD');
    return (0, jsonwebtoken_1.verify)(jwt, jwtSecret, {
        audience: jwtAud
    });
};
exports.verifyJWT = verifyJWT;
