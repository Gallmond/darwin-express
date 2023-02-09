"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.darwinForUser = exports.darwinForService = void 0;
const darwin_ldb_node_1 = require("darwin-ldb-node");
const exceptions_1 = require("../http/controllers/exceptions");
const d = new darwin_ldb_node_1.Darwin();
const userConnector = (user) => {
    const wsdlUrl = user.darwinWsdlUrl ?? null;
    const accessToken = user.darwinAccessToken ?? null;
    if (typeof wsdlUrl !== 'string'
        || typeof accessToken !== 'string') {
        throw new exceptions_1.HTTP500DarwinException('Could not get darwin config');
    }
    console.debug('creating soapConnector for user');
    return new darwin_ldb_node_1.SoapConnector(wsdlUrl, accessToken);
};
const darwinForService = async () => {
    const wsdlUrl = process.env.LDB_DARWIN_WSDL_URL ?? null;
    const accessToken = process.env.LDB_DARWIN_ACCESS_TOKEN ?? null;
    if (typeof wsdlUrl !== 'string' || typeof accessToken !== 'string') {
        throw new exceptions_1.HTTP500DarwinException('Could not get darwin config');
    }
    d.connector = new darwin_ldb_node_1.SoapConnector(wsdlUrl, accessToken);
    await d.init();
    return d;
};
exports.darwinForService = darwinForService;
const darwinForUser = async (user) => {
    console.debug('calling userconnector');
    d.connector = userConnector(user);
    console.debug('trying to init');
    await d.init();
    console.debug('init complete');
    return d;
};
exports.darwinForUser = darwinForUser;
