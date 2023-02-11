import { Darwin } from 'darwin-ldb-node';
import User from '../user';
interface DestinationCollection {
    [key: string]: Destination;
}
interface Destination {
    name: string;
    station: string;
    via?: string;
    unreachable?: boolean;
}
interface CPLocation {
    name: string;
    station: string;
    scheduledTime: string;
    estimatedTime?: string;
    actualTime?: string;
    cancelled?: boolean;
    length?: number;
    split?: boolean;
    alerts: string[];
}
interface Service {
    id: string;
    estimatedArrival?: string;
    scheduledArrival?: string;
    estimatedDeparture?: string;
    scheduledDeparture?: string;
    cancelled?: boolean;
    platform?: string;
    operator?: string;
    operatorCode?: string;
    scheduledFrom: DestinationCollection;
    currentFrom: DestinationCollection;
    scheduledTo: DestinationCollection;
    currentTo: DestinationCollection;
    callingAt: {
        [key: string]: CPLocation[];
    };
    calledAt: {
        [key: string]: CPLocation[];
    };
}
interface StationResponse {
    station: string;
    generatedAt: string;
    services: Service[];
}
declare const darwinForService: () => Promise<Darwin>;
declare const darwinForUser: (user: User) => Promise<Darwin>;
declare const arrivalsAndDepartures: (darwin: Darwin, crs: string, filterType?: 'to' | 'from', filterCrs?: string) => Promise<StationResponse>;
declare const serviceDetails: (darwin: Darwin, serviceId: string) => Promise<import("darwin-ldb-node/dist/types/darwin-ii/darwin-types").ServiceDetailsResponse>;
export { darwinForService, darwinForUser, arrivalsAndDepartures, serviceDetails, };
//# sourceMappingURL=darwin.d.ts.map