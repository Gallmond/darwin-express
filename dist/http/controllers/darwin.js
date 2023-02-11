"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const darwin_1 = require("../../services/darwin");
const database_1 = __importDefault(require("../../services/database"));
const exceptions_1 = require("./exceptions");
const db = database_1.default.singleton();
const darwinController = (0, express_1.default)();
const incrementRequests = async (user) => {
    const updated = await db.updateUser(user.username, {
        requestCount: user.requestCount + 1,
        darwinRequestCount: user.darwinRequestCount + 1,
    });
    if (!updated) {
        throw new exceptions_1.HTTP500DarwinException('Failed to update request count');
    }
};
const pathParams = (req, ...names) => {
    const parts = {};
    names.forEach(name => {
        parts[name] = typeof req.params[name] === 'string'
            ? req.params[name]
            : null;
    });
    return parts;
};
const validateParams = (req, next) => {
    const { crs, type, filterCrs } = pathParams(req, 'crs', 'type', 'filterCrs');
    // crs must be a string
    if (crs === null) {
        next(new exceptions_1.HTTP422UnprocessableEntity('missing crs'));
        return false;
    }
    // if type is set it must be 'to' or 'from'
    if (type !== null && type !== 'to' && type !== 'from') {
        next(new exceptions_1.HTTP422UnprocessableEntity('type must be "to" or "from" if it is used'));
        return false;
    }
    // if type is set, filterCrs must also be set
    if (type !== null && filterCrs === null) {
        next(new exceptions_1.HTTP422UnprocessableEntity('filterCrs must be set if type is set'));
        return false;
    }
    const options = {
        crs,
    };
    if (type)
        options.type = type;
    if (filterCrs)
        options.filterCrs = filterCrs;
    return options;
};
darwinController.get('/arrivalsAndDepartures/:crs?/:type?/:filterCrs?', async (req, res, next) => {
    if (req.auth === undefined) {
        next(new exceptions_1.HTTP401Unauthorized('Not authorised'));
        return;
    }
    const options = validateParams(req, next);
    if (!options)
        return;
    const darwin = await (0, darwin_1.darwinForUser)(req.auth.user);
    const { crs, filterCrs, type } = options;
    const [data,] = await Promise.all([
        await (0, darwin_1.arrivalsAndDepartures)(darwin, crs, type, filterCrs),
        incrementRequests(req.auth.user)
    ]);
    res.json(data).send();
});
darwinController.get('/service/:serviceId', async (req, res, next) => {
    if (req.auth === undefined) {
        next(new exceptions_1.HTTP401Unauthorized('Not authorised'));
        return;
    }
    const { serviceId } = pathParams(req, 'serviceId');
    if (!serviceId) {
        next(new exceptions_1.HTTP422UnprocessableEntity('missing serviceId'));
        return;
    }
    const darwin = await (0, darwin_1.darwinForUser)(req.auth.user);
    const [data,] = await Promise.all([
        await (0, darwin_1.serviceDetails)(darwin, serviceId),
        incrementRequests(req.auth.user)
    ]);
    //TODO format this
    res.json(data).send();
});
exports.default = darwinController;
