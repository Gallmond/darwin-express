"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.hashPassword = exports.passwordValid = void 0;
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
