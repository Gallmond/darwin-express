"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
class CoolApplication {
    expressApp;
    constructor(expressApp) {
        this.expressApp = expressApp;
        // promotion
    }
    static make() {
        return new CoolApplication(app_1.default);
    }
    listen() {
        this.expressApp.listen();
    }
}
exports.default = CoolApplication;
