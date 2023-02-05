"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userConverter = void 0;
const firestore_1 = require("firebase/firestore");
/**
 * tells fireStore how to:
 * - transform User instance and convert it into document data
 * - take document data and return User instance
 */
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
        const data = snapshot.data();
        const user = new User(data.username, data.hashedPassword, new Date(data.createdAt), new Date(data.updatedAt), data.requestCount, data.darwinRequestCount);
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
    firebaseId;
    constructor(username, hashedPassword, createdAt = new Date(), updatedAt = new Date(), requestCount = 0, darwinRequestCount = 0, firebaseId) {
        this.username = username;
        this.hashedPassword = hashedPassword;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.requestCount = requestCount;
        this.darwinRequestCount = darwinRequestCount;
        this.firebaseId = firebaseId;
    }
    get uid() {
        if (!this.firebaseId)
            throw new Error('uid accessed before initialisation');
        return this.firebaseId;
    }
    set uid(val) {
        if (this.firebaseId)
            throw new Error('uid already set');
        this.firebaseId = val;
    }
}
exports.default = User;
