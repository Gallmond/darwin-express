"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DBFirestore_1 = __importDefault(require("./DBFirestore"));
const DBMemory_1 = __importDefault(require("./DBMemory"));
const database = ['test', 'local'].includes(process.env.NODE_ENV ?? '')
    ? DBMemory_1.default
    : DBFirestore_1.default;
exports.default = database;
