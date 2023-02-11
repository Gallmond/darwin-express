"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceDetails = exports.arrivalsAndDepartures = exports.darwinForUser = exports.darwinForService = void 0;
const darwin_ldb_node_1 = require("darwin-ldb-node");
const exceptions_1 = require("../http/controllers/exceptions");
const utils_1 = require("./utils");
const d = new darwin_ldb_node_1.Darwin();
const userConnector = (user) => {
    const wsdlUrl = user.darwinWsdlUrl ?? null;
    const accessToken = user.darwinAccessToken ?? null;
    if (typeof wsdlUrl !== 'string'
        || typeof accessToken !== 'string') {
        throw new exceptions_1.HTTP500DarwinException('Could not get darwin config');
    }
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
    d.connector = userConnector(user);
    await d.init();
    return d;
};
exports.darwinForUser = darwinForUser;
const formatCallingPointLocations = (callingPointSet) => {
    const stationKeys = Object.keys(callingPointSet);
    const collection = new Map();
    stationKeys.forEach(crs => {
        const points = callingPointSet[crs];
        const formattedPoints = points.map(point => {
            return {
                name: point.locationName,
                station: crs,
                scheduledTime: point.st,
                estimatedTime: point.et ?? undefined,
                actualTime: point.at ?? undefined,
                cancelled: point.isCancelled ?? (0, utils_1.boolOrNull)(point.isCancelled),
                length: point.length ?? undefined,
                split: (0, utils_1.boolOrNull)(point.detachFront) ?? undefined,
                alerts: point.adhocAlerts ?? [], //: string[]
            };
        });
        collection.set(crs, formattedPoints);
    });
    return Object.fromEntries(collection);
};
const formatLocationCollection = (locationSet) => {
    const stationKeys = Object.keys(locationSet);
    const collection = new Map();
    stationKeys.forEach(crs => {
        const data = locationSet[crs];
        collection.set(crs, {
            name: data.locationName ?? '',
            station: data.crs,
            via: data.via ?? undefined,
            unreachable: data.unreachable ?? (0, utils_1.boolOrNull)(data.unreachable)
        });
    });
    return Object.fromEntries(collection);
};
const formatService = (service) => {
    return {
        id: service.serviceID ?? '???',
        estimatedArrival: service.eta ?? undefined,
        scheduledArrival: service.sta ?? undefined,
        estimatedDeparture: service.etd ?? undefined,
        scheduledDeparture: service.std ?? undefined,
        cancelled: (0, utils_1.boolOrNull)(service.cancelled) ?? undefined,
        platform: service.platform ?? undefined,
        operator: service.operator ?? undefined,
        operatorCode: service.operator ?? undefined,
        scheduledFrom: formatLocationCollection(service.from.scheduled),
        currentFrom: formatLocationCollection(service.from.current),
        scheduledTo: formatLocationCollection(service.to.scheduled),
        currentTo: formatLocationCollection(service.from.current),
        callingAt: formatCallingPointLocations(service.callingPoints.to),
        calledAt: formatCallingPointLocations(service.callingPoints.from),
    };
};
const formatResponse = (data) => {
    return {
        station: data.crs,
        generatedAt: data.generatedAt,
        services: data.trainServices.map(formatService)
    };
};
const arrivalsAndDepartures = async (darwin, crs, filterType, filterCrs) => {
    const data = await darwin.arrivalsAndDepartures({
        crs,
        filterType,
        filterCrs,
    });
    return formatResponse(data);
};
exports.arrivalsAndDepartures = arrivalsAndDepartures;
const serviceDetails = async (darwin, serviceId) => {
    const data = await darwin.serviceDetails(serviceId);
    //TODO reformat this
    return data;
};
exports.serviceDetails = serviceDetails;
