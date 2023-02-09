"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../../user"));
const auth_1 = require("../auth");
const utils_1 = require("../utils");
const types_1 = require("./types");
class DBMemory extends types_1.DBClass {
    static _users = new Map();
    static _revokedTokens = new Map();
    static instance;
    static make = () => {
        return new DBMemory();
    };
    static singleton = () => {
        if (DBMemory.instance === undefined) {
            DBMemory.instance = DBMemory.make();
        }
        return DBMemory.instance;
    };
    get users() {
        return DBMemory._users;
    }
    get revokedTokens() {
        return DBMemory._revokedTokens;
    }
    createUser = async (username, plaintextPassword) => {
        const existingUser = await this.getUser(username);
        if (existingUser !== null) {
            throw new Error(`${username} already exists`);
        }
        const user = new user_1.default(username, (0, auth_1.hashPassword)(plaintextPassword));
        user.uid = username;
        this.users.set(username, user);
        return user;
    };
    getUser = async (username) => {
        return this.users.get(username) ?? null;
    };
    updateUser = async (username, fields) => {
        const thisUser = await this.getUser(username);
        if (thisUser === null) {
            throw new Error(`${username} does not exist`);
        }
        const { requestCount, darwinRequestCount, darwinWsdlUrl, darwinAccessToken, hashedPassword, } = thisUser;
        thisUser.requestCount = fields.requestCount ?? requestCount;
        thisUser.darwinRequestCount = fields.darwinRequestCount ?? darwinRequestCount;
        thisUser.darwinWsdlUrl = fields.darwinWsdlUrl ?? darwinWsdlUrl;
        thisUser.darwinAccessToken = fields.darwinAccessToken ?? darwinAccessToken;
        thisUser.hashedPassword = fields.hashedPassword ?? hashedPassword;
        return true;
    };
    deleteUser = async (username) => {
        this.users.delete(username);
        return true;
    };
    createRevokedToken = async (token, daysToLive) => {
        const createdAt = new Date();
        const keepUntil = new Date(createdAt.valueOf() + (utils_1.MILLISECONDS.DAY * daysToLive));
        const data = { token, keepUntil, createdAt };
        this.revokedTokens.set(token, data);
        return data;
    };
    getRevokedToken = async (token) => {
        const revokedTokenData = this.revokedTokens.get(token) ?? null;
        if (revokedTokenData === null) {
            return null;
        }
        const now = new Date().valueOf();
        if (now > revokedTokenData.keepUntil.valueOf()) {
            await this.deleteRevokedToken(token);
            return null;
        }
        return {
            token: revokedTokenData.token,
            createdAt: revokedTokenData.createdAt,
            keepUntil: revokedTokenData.keepUntil,
        };
    };
    deleteRevokedToken = async (token) => {
        this.revokedTokens.delete(token);
        return true;
    };
    deleteAllTestUsers = async () => {
        const deleted = [];
        Object.keys(this.users).forEach(username => {
            deleted.push(username);
            this.users.delete(username);
        });
        return deleted;
    };
    deleteAllRevokedTokens = async () => {
        const deleted = [];
        Object.keys(this.revokedTokens).forEach(token => {
            deleted.push(token);
            this.revokedTokens.delete(token);
        });
        return deleted;
    };
}
exports.default = DBMemory;
