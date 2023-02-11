import router, { NextFunction, Request } from 'express'
import { arrivalsAndDepartures, darwinForUser, serviceDetails } from '../../services/darwin'
import database from '../../services/database'
import User from '../../user'
import { HTTP401Unauthorized, HTTP422UnprocessableEntity, HTTP500DarwinException } from './exceptions'

const db = database.singleton()

const darwinController = router()

const incrementRequests = async (user: User) => {
    const updated = await db.updateUser(user.username, {
        requestCount: user.requestCount + 1,
        darwinRequestCount: user.darwinRequestCount + 1,
    })

    if(!updated){
        throw new HTTP500DarwinException('Failed to update request count')
    }
}

type DarwinOptions = {
    crs: string,
    type?: 'to' | 'from',
    filterCrs?: string 
}

const pathParams = (req: Request, ...names: string[]) => {
    const parts: Record<string, string | null> = {}

    names.forEach(name => {
        parts[ name ] = typeof req.params[ name ] === 'string'
            ? req.params[ name ]
            : null
    })

    return parts
}

const validateParams = (req: Request, next: NextFunction): DarwinOptions | false => {

    const {crs, type, filterCrs} = pathParams(req, 'crs', 'type', 'filterCrs')

    // crs must be a string
    if(crs === null){
        next(new HTTP422UnprocessableEntity('missing crs'))
        return false
    }

    // if type is set it must be 'to' or 'from'
    if( type !== null && type !== 'to' && type !== 'from' ){
        next(new HTTP422UnprocessableEntity('type must be "to" or "from" if it is used'))
        return false
    }

    // if type is set, filterCrs must also be set
    if(type !== null && filterCrs === null){
        next(new HTTP422UnprocessableEntity('filterCrs must be set if type is set'))
        return false
    }

    const options: DarwinOptions = {
        crs,
    }
    if(type) options.type = type
    if(filterCrs) options.filterCrs = filterCrs

    return options
}

darwinController.get('/arrivalsAndDepartures/:crs?/:type?/:filterCrs?', async (req, res, next) => {
    if(req.auth === undefined){
        next(new HTTP401Unauthorized('Not authorised'))
        return
    }

    const options = validateParams(req, next)
    if(!options) return

    const darwin = await darwinForUser(req.auth.user)

    const {crs, filterCrs, type} = options

    const [data, ] = await Promise.all([
        await arrivalsAndDepartures(darwin, crs, type, filterCrs),
        incrementRequests(req.auth.user)
    ])

    res.json(data).send()
})

darwinController.get('/service/:serviceId', async (req, res, next) => {
    if(req.auth === undefined){
        next(new HTTP401Unauthorized('Not authorised'))
        return
    }

    const {serviceId} = pathParams(req, 'serviceId')
    if(!serviceId){
        next(new HTTP422UnprocessableEntity('missing serviceId'))
        return
    }

    const darwin = await darwinForUser(req.auth.user)
    const [data, ] = await Promise.all([
        await serviceDetails(darwin, serviceId),
        incrementRequests(req.auth.user)
    ])

    //TODO format this
    res.json(data).send()
})









export default darwinController