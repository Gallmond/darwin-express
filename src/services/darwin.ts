import {Darwin,SoapConnector} from 'darwin-ldb-node'
import { HTTP500DarwinException } from '../http/controllers/exceptions'
import User from '../user'
import { ArrivalsAndDeparturesResponse, CallingPointsHolder, OriginOrDestinationLocation, TrainService } from 'darwin-ldb-node/dist/types/darwin-ii/darwin-types'
import { boolOrNull } from './utils'

interface DestinationCollection{
    [key: string]: Destination
}

interface Destination{
    name: string
    station: string
    via?: string
    unreachable?: boolean
}

interface CPLocation{
    name: string
    station: string
    scheduledTime: string
    estimatedTime?: string
    actualTime?: string
    cancelled?: boolean
    length?: number
    split?: boolean
    alerts: string[]
}

interface Service{
    // basic service info
    id: string
    estimatedArrival?: string
    scheduledArrival?: string
    estimatedDeparture?: string
    scheduledDeparture?: string
    cancelled?: boolean
    platform?: string
    operator?: string
    operatorCode?: string

    // origin and destination
    scheduledFrom: DestinationCollection
    currentFrom: DestinationCollection
    scheduledTo: DestinationCollection
    currentTo: DestinationCollection

    callingAt: { [key: string]: CPLocation[] }
    calledAt: { [key: string]: CPLocation[] }
}

interface StationResponse{
    station: string
    generatedAt: string
    services: Service[]
}

const d = new Darwin()

const userConnector = (user: User) => {
    const wsdlUrl = user.darwinWsdlUrl ?? null
    const accessToken = user.darwinAccessToken ?? null

    if(
        typeof wsdlUrl !== 'string'
        || typeof accessToken !== 'string'
    ){
        throw new HTTP500DarwinException('Could not get darwin config')
    }

    return new SoapConnector(
        wsdlUrl, accessToken
    )
}

const darwinForService = async () => {
    const wsdlUrl = process.env.LDB_DARWIN_WSDL_URL ?? null
    const accessToken = process.env.LDB_DARWIN_ACCESS_TOKEN ?? null

    if(typeof wsdlUrl !== 'string' || typeof accessToken !== 'string'){
        throw new HTTP500DarwinException('Could not get darwin config')
    }

    d.connector = new SoapConnector(wsdlUrl, accessToken)
    await d.init()

    return d
}

const darwinForUser = async (user: User) => {
    d.connector = userConnector(user)
    await d.init()

    return d
}

const formatCallingPointLocations = (callingPointSet: CallingPointsHolder): { [key: string]: CPLocation[] } => {
    const stationKeys = Object.keys(callingPointSet)

    const collection = new Map()

    stationKeys.forEach(crs => {
        const points = callingPointSet[ crs ]

        const formattedPoints = points.map(point => {
            return {
                name: point.locationName, //: string
                station: crs, //: string
                scheduledTime: point.st, //: string
                estimatedTime: point.et ?? undefined, //?: string
                actualTime: point.at ?? undefined, //?: string
                cancelled: point.isCancelled ?? boolOrNull(point.isCancelled), //?: boolean
                length: point.length ?? undefined, //?: number
                split: boolOrNull(point.detachFront) ?? undefined, //?: boolean
                alerts: point.adhocAlerts ?? [], //: string[]
            }
        })

        collection.set(crs, formattedPoints)
    })

    return Object.fromEntries(collection)
}

const formatLocationCollection = (locationSet: {[key: string]: OriginOrDestinationLocation}): DestinationCollection => {
    const stationKeys = Object.keys(locationSet)
    const collection = new Map()

    stationKeys.forEach(crs => {
        const data = locationSet[ crs ]

        collection.set(crs, {
            name: data.locationName ?? '',
            station: data.crs,
            via: data.via ?? undefined,
            unreachable: data.unreachable ?? boolOrNull(data.unreachable)
        })
    })

    return Object.fromEntries(collection)
}

const formatService = (service: TrainService): Service => {
    return {
        id: service.serviceID ?? '???',
        estimatedArrival: service.eta ?? undefined,
        scheduledArrival: service.sta ?? undefined,
        estimatedDeparture: service.etd ?? undefined,
        scheduledDeparture: service.std ?? undefined,
        cancelled: boolOrNull(service.cancelled) ?? undefined,
        platform: service.platform ?? undefined,
        operator: service.operator ?? undefined,
        operatorCode: service.operator ?? undefined,
        scheduledFrom: formatLocationCollection(service.from.scheduled),
        currentFrom: formatLocationCollection(service.from.current),
        scheduledTo: formatLocationCollection(service.to.scheduled),
        currentTo: formatLocationCollection(service.from.current),
        callingAt: formatCallingPointLocations(service.callingPoints.to),
        calledAt: formatCallingPointLocations(service.callingPoints.from),
    }
}

const formatResponse = (data: ArrivalsAndDeparturesResponse): StationResponse => {
    return {
        station: data.crs,
        generatedAt: data.generatedAt as unknown as string,
        services: data.trainServices.map(formatService)
    }
}

const arrivalsAndDepartures = async (darwin: Darwin, crs: string, filterType?: 'to' | 'from', filterCrs?: string) => {

    const data = await darwin.arrivalsAndDepartures({
        crs,
        filterType,
        filterCrs,
    })

    return formatResponse( data )
}

const serviceDetails = async (darwin: Darwin, serviceId: string) => {
    const data = await darwin.serviceDetails(serviceId)
    //TODO reformat this
    return data
}

export {
    darwinForService,
    darwinForUser,
    arrivalsAndDepartures,
    serviceDetails,
}