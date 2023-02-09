"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBClass = exports.revokedTokenConverter = void 0;
const firestore_1 = require("firebase/firestore");
exports.revokedTokenConverter = {
    toFirestore(tokenData) {
        return {
            token: tokenData.token,
            createdAt: firestore_1.Timestamp.fromDate(tokenData.createdAt),
            keepUntil: firestore_1.Timestamp.fromDate(tokenData.keepUntil),
        };
    },
    fromFirestore(snapshot) {
        const { token, createdAt, keepUntil } = snapshot.data();
        return {
            token,
            createdAt: createdAt.toDate(),
            keepUntil: keepUntil.toDate(),
        };
    }
};
class DBClass {
    static make;
    static singleton;
}
exports.DBClass = DBClass;
