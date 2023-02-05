"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userConverter = void 0;
const firestore_1 = require("firebase/firestore");
const userConverter = {
    toFirestore(user) {
        return {
            username: user.username,
            hashedPassword: user.hashedPassword,
            createdAt: firestore_1.Timestamp.fromDate(user.createdAt),
            updatedAt: firestore_1.Timestamp.fromDate(user.updatedAt),
            requestCount: user.requestCount,
            darwinRequestCount: user.darwinRequestCount,
        };
    },
    fromFirestore(snapshot) {
        const { username, hashedPassword, createdAt, updatedAt, requestCount, darwinRequestCount, } = snapshot.data();
        const user = new User(username, hashedPassword, new Date(createdAt), new Date(updatedAt), requestCount, darwinRequestCount);
        user.uid = snapshot.id;
        return user;
    }
};
exports.userConverter = userConverter;
class User {
    username;
    hashedPassword;
    createdAt;
    updatedAt;
    requestCount;
    darwinRequestCount;
    _uid;
    constructor(username, hashedPassword, createdAt = new Date(), updatedAt = new Date(), requestCount = 0, darwinRequestCount = 0) {
        this.username = username;
        this.hashedPassword = hashedPassword;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.requestCount = requestCount;
        this.darwinRequestCount = darwinRequestCount;
    }
    static make(username, hashedPassword) {
        const now = new Date();
        return new User(username, hashedPassword, now, now, 0, 0);
    }
    get uid() {
        if (!this._uid)
            throw new Error('uid accessed before initialisation');
        return this._uid;
    }
    set uid(val) {
        if (this._uid)
            throw new Error('uid already set');
        this._uid = val;
    }
}
exports.default = User;
