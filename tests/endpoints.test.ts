import { randomBytes } from 'crypto'
import supertest from 'supertest'
import { HTTP401Unauthorized, HTTP422UnprocessableEntity } from '../src/http/controllers/exceptions'
import { easyJwt } from '../src/services/auth'
import CoolApplication from '../src/experiment'
import database from '../src/services/database'
import { readFileSync } from 'fs'

const expectType = (val: unknown, ...types: string[]) => {
    const hasType = isType(val, ...types)
    if(!hasType) console.error('val does not have type', {val, types})
    
    expect(hasType).toBe(true)
}

const isType = (val: unknown, ...types: string[]) => {
    for (const type of types) {
        if(typeof val === type) return true
    }
    
    return false
}

/**
 * We can mock the 'darwin-ldb-node' module here to return some data stubs instead
 * of making a real service request
 * 
 * First prepare the response data
 */
const stubDir = `${__dirname}/stubs`

// /NCL
const ncl = jest.fn().mockResolvedValue(
    JSON.parse(readFileSync(`${stubDir}/AllAtCrs.json`, {encoding: 'utf-8'})).response
)
// /NCL/from/KGX
const nclFromKgx = jest.fn().mockResolvedValue(
    JSON.parse(readFileSync(`${stubDir}/CrsFromCrs.json`, {encoding: 'utf-8'})).response
)
// /NCL/to/KGX
const nclToKgx = jest.fn().mockResolvedValue(
    JSON.parse(readFileSync(`${stubDir}/CrsToCrs.json`, {encoding: 'utf-8'})).response
)

const serviceDetailsMocks: Record<string, CallableFunction>  = {
    '713802NWCSTLE_': jest.fn().mockResolvedValue(
        JSON.parse(readFileSync(`${stubDir}/serviceDetails-713802NWCSTLE_.json`, {encoding: 'utf-8'}))
    )
}

/**
 * Mock the module itself and conditionally return the correct data stub depending
 * on the args
 */
jest.mock('darwin-ldb-node', () => {
    return {
        Darwin: jest.fn().mockImplementation(() => {
            return {
                serviceDetails: (...args: unknown[]) => {
                    const serviceID = (args[0] ?? '') as string

                    console.debug(Object.keys(serviceDetailsMocks))
                    const mockResponse = serviceDetailsMocks[ serviceID ]

                    if(mockResponse){
                        return mockResponse()
                    }

                    throw new Error(`No mocked response for ${serviceID}`)
                },
                arrivalsAndDepartures: (...args: unknown[]) => {
                    const options = (args[0] ?? {}) as Record<string, string>

                    // {crs: 'NCL', filterType: 'to', filterCrs: 'KGX'}
                    if(
                        typeof options === 'object'
                        && options.crs === 'NCL'
                        && options.filterCrs === 'KGX'
                        && options.filterType === 'to'
                    ){
                        return nclToKgx()
                    }

                    // {crs: 'NCL', filterType: 'from', filterCrs: 'KGX'}
                    if(
                        typeof options === 'object'
                        && options.crs === 'NCL'
                        && options.filterCrs === 'KGX'
                        && options.filterType === 'from'
                    ){
                        return nclFromKgx()
                    }

                    // {crs: 'NCL'}
                    if(
                        typeof options === 'object'
                        && options.crs === 'NCL'
                    ){
                        return ncl()
                    }

                    const msg = 'No stub prepared for request options'
                    console.error(msg, options)
                    throw new Error(msg)
                },
                init: jest.fn().mockResolvedValue(true)
            }
        }),
        SoapConnector: jest.fn().mockImplementation(() => {
            return {}
        })
    }
})



const DAY = 1000 * 60 * 60 * 24

const db = database.singleton()

const looksLikeJWT = (token: string) => {
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3)
}

const testUserCredentials = () => {
    const rand = randomBytes(16).toString('hex')
    const username = `${rand}@test.com`
    const password = username

    const {accessToken, refreshToken} = easyJwt.createTokens(username)

    return {username, password, accessToken, refreshToken}
}

const cool = CoolApplication.make()

const service = supertest(cool.expressApp)

describe('/register', () => {

    let logSpy: jest.SpyInstance | undefined

    beforeAll(async () => {
        // hide console.error output
        logSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {
            // do nothing
        })
    })

    afterAll(async () => {
        // delete test users
        const deleted = await db.deleteAllTestUsers()
        console.log(`deleted ${deleted.length} test users`, deleted)

        // enable console
        logSpy && logSpy.mockClear()
    })

    test('invalid username password input error', async () => {
        const response = await service.post('/register')
            .set('content-type', 'application/json')
            .send({})

        const expectedErr = new HTTP422UnprocessableEntity('Invalid username or password')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(expectedErr.code)
        expect(response.body).toEqual(expectedJson)
    })

    test('username taken error', async () => {
        const {username, password} = testUserCredentials()
        await db.createUser(username, password)

        const response = await service.post('/register')
            .set('content-type', 'application/json')
            .send({username, password})

        const expectedErr = new HTTP422UnprocessableEntity('Username must be unique')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(expectedErr.code)
        expect(response.body).toEqual(expectedJson)
    })

    test('new user can register', async () => {
        const {username, password} = testUserCredentials()

        const postBody = { username, password }

        const response = await service.post('/register')
            .set('content-type', 'application/json')
            .send(postBody)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('accessToken')
        expect(response.body).toHaveProperty('expiresIn')
        expect(response.body).toHaveProperty('refreshToken')

        looksLikeJWT(response.body.accessToken)
        looksLikeJWT(response.body.refreshToken)
    })
})

describe('/guarded', () => { 
    test('guarded route denied - no token', async () => {
        const response = await service
            .get('/guarded')
            .send()
            
        const expectedErr = new HTTP401Unauthorized('Guarded route without token')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(401)
        expect(response.body).toEqual(expectedJson)
    })
    
    test('guarded route denied - no user', async () => {
        const { accessToken } = easyJwt.createTokens('foobar')

        const response = await service
            .get('/guarded')
            .set('authorization', `Bearer ${accessToken}`)
            .send()

        const expectedErr = new HTTP401Unauthorized('jwt subject not found')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(401)
        expect(response.body).toEqual(expectedJson)
    })

    test('guarded route denied - malformed token', async () => {
        const {username, password} = testUserCredentials()
        await db.createUser(username, password)

        const response = await service
            .get('/guarded')
            .set('authorization', 'Bearer foobar')    
            .send()
            
        const expectedErr = new HTTP401Unauthorized('jwt malformed')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(401)
        expect(response.body).toEqual(expectedJson)
    })

    test('jwt grants access to a guarded route', async () => {
        const {username, password, accessToken} = testUserCredentials()
        await db.createUser(username, password)

        const response = await service
            .get('/guarded')
            .set('authorization', `Bearer ${accessToken}`)    
            .send()

        expect(response.status).toBe(200)
        expect(response.body.username).toEqual(username)
    })
})

describe('/auth', () =>  {

    let logSpy: jest.SpyInstance | undefined

    beforeAll(async () => {
        // hide console.error output
        logSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {
            // do nothing
        })
    })

    afterAll(async () => {
        // delete test users
        const deleted = await db.deleteAllTestUsers()
        console.log(`deleted ${deleted.length} test users`, deleted)

        // enable console
        logSpy && logSpy.mockClear()
    })

    test('auth success with existing user', async () => {

        const {username, password} = testUserCredentials()
        await db.createUser(username, password)

        const authResponse = await service
            .post('/auth')
            .set('content-type', 'application/json')    
            .send({username, password})
            
        expect(authResponse.status).toBe(200)
        expect(authResponse.body).toHaveProperty('accessToken')
        expect(authResponse.body).toHaveProperty('expiresIn')
        expect(authResponse.body).toHaveProperty('refreshToken')

        const guardedResponse = await service
            .get('/guarded')
            .set('authorization', `Bearer ${authResponse.body.accessToken}`)
            .send()

        expect(guardedResponse.status).toBe(200)
        expect(guardedResponse.body.username).toBe(username)
    })

    test('auth failure with no such user', async () => {
        const response = await service
            .post('/auth')
            .set('content-type', 'application/json')    
            .send({username: 'foo', password: 'bar'})
            
        const expectedErr = new HTTP401Unauthorized('no such user')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(401)
        expect(response.body).toEqual(expectedJson)
    })

    test('auth failure with invalid credentials', async () => {
        const {username, password} = testUserCredentials()
        await db.createUser(username, password)

        const response = await service
            .post('/auth')
            .set('content-type', 'application/json')    
            .send({username, password: 'foobar'})
            
        const expectedErr = new HTTP401Unauthorized('invalid credentials')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(401)
        expect(response.body).toEqual(expectedJson)
    })
    
})

describe('/refresh', () => {
    test('missing refreshToken', async () => {

        const response = await service
            .post('/refresh')
            .set('content-type', 'application/json')
            .send({})

        const expectedErr = new HTTP422UnprocessableEntity('missing refreshToken')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(expectedErr.code)
        expect(response.body).toEqual(expectedJson)
    })
    test('invalid refreshToken', async () => {
        const { refreshToken } = easyJwt.createTokens('foobar')

        const response = await service
            .post('/refresh')
            .set('content-type', 'application/json')
            .send({refreshToken: refreshToken + 'a'})

        const expectedErr = new HTTP401Unauthorized('invalid signature')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(expectedErr.code)
        expect(response.body).toEqual(expectedJson)
    })

    test('expired refreshToken', async () => {
        /**
         * after generating a token (which expires in a week) set the system time
         * to be 8 days from now
         */
        const { refreshToken } = easyJwt.createTokens('foobar')

        const now = new Date().valueOf()
        const eightDaysInMilliseconds = 1000 * 60 * 60 * 24 * 8
        const future = new Date(now + eightDaysInMilliseconds) 
        jest.useFakeTimers().setSystemTime(future)        

        const response = await service
            .post('/refresh')
            .set('content-type', 'application/json')
            .send({refreshToken})

        const expectedErr = new HTTP401Unauthorized('jwt expired')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(expectedErr.code)
        expect(response.body).toEqual(expectedJson)

        jest.useRealTimers()
    })

    test('valid refresh token returns new access token', async () => {

        // generate tokens as usual
        const { refreshToken } = easyJwt.createTokens('foobar')

        // advance time
        const now = new Date().valueOf()
        const fourDays = DAY * 4
        jest.useFakeTimers().setSystemTime(new Date(now + fourDays))

        // use refresh token
        const response = await service
            .post('/refresh')
            .set('content-type', 'application/json')
            .send({refreshToken})

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('accessToken')

        const { accessToken } = response.body
        
        const payload = await easyJwt.verifyJwt( accessToken )
        expect(payload.iat).not.toBeUndefined()

        const iat = (payload.iat as number) * 1000
        const exp = (payload.exp as number) * 1000

        // expect issue time to be in the future and the exp to be a day later
        expect(iat > now).toBe(true)
        expect(exp).toBe(iat + DAY)

        jest.useRealTimers()
    })
})

describe('/revoke', () => {

    test('missing token', async () => {
        const revokeResponse = await service
            .post('/revoke')
            .set('content-type', 'application/json')
            .send({})

        const expectedErr = new HTTP422UnprocessableEntity('missing token')
        const expectedJson = expectedErr.json

        expect(revokeResponse.status).toBe(expectedErr.code)
        expect(revokeResponse.body).toEqual(expectedJson)
    })

    test('malformed token', async () => {
        const token = easyJwt.createTokens('foo', {fizz: 'buzz'})

        const revokeResponse = await service
            .post('/revoke')
            .set('content-type', 'application/json')
            .send({token: token + 'a'})

        const expectedErr = new HTTP422UnprocessableEntity('token could not be decoded')
        const expectedJson = expectedErr.json

        expect(revokeResponse.status).toBe(expectedErr.code)
        expect(revokeResponse.body).toEqual(expectedJson)

    })

    test('valid access token can be revoked', async () => {
        // make a user with a token
        const {username, password } = testUserCredentials()

        // create the user
        const registerResponse = await service
            .post('/register')
            .set('content-type', 'application/json')
            .send({username, password})
        expect(registerResponse.status).toBe(201)

        // get the token
        const { accessToken } = registerResponse.body
        expect(easyJwt.decode(accessToken)?.payload.sub).toBe(username)

        // revoke the token
        const revokeResponse = await service
            .post('/revoke')
            .set('content-type', 'application/json')
            .send({token: accessToken})
        expect(revokeResponse.status).toBe(200)

        // try to use it on guarded route
        const guardedResponse = await service
            .get('/guarded')
            .set('authorization', `Bearer ${accessToken}`)
            .send()

        // this fails in the custom token verification method
        const expectedErr = new HTTP401Unauthorized('access_token is invalid')
        const expectedJson = expectedErr.json

        expect(guardedResponse.status).toBe(expectedErr.code)
        expect(guardedResponse.body).toEqual(expectedJson)
    })

    test('valid refresh token can be revoked', async () => {
        // make a user with a token
        const {username, password } = testUserCredentials()

        // create the user
        const registerResponse = await service
            .post('/register')
            .set('content-type', 'application/json')
            .send({username, password})
        expect(registerResponse.status).toBe(201)

        // get the token
        const { refreshToken } = registerResponse.body

        // revoke the token
        const revokeResponse = await service
            .post('/revoke')
            .set('content-type', 'application/json')
            .send({token: refreshToken})
        expect(revokeResponse.status).toBe(200)

        // try to use it on refresh route
        const refreshResponse = await service
            .post('/refresh')
            .send({refreshToken})

        const expectedErr = new HTTP401Unauthorized('refresh token revoked')
        const expectedJson = expectedErr.json

        expect(refreshResponse.status).toBe(expectedErr.code)
        expect(refreshResponse.body).toEqual(expectedJson)
    })
})

describe('/arrivalsAndDepartures', () => {

    const checkOriginDestFormat = (obj: Record<string, Record<string, unknown>>) => {
        const stationCodes = Object.keys(obj)
        stationCodes.forEach(crs => {
            const data = obj[crs]  
            expect(typeof data.name).toBe('string')
            expect(typeof data.station).toBe('string')
            expect(isType(data.unreachable, 'undefined', 'boolean')).toBe(true)
            expect(isType(data.via,'undefined', 'string')).toBe(true)
        })
    }

    const checkCallingPointFormat = (obj: Record<string, Record<string, unknown>[]>) => {
        const stationCodes = Object.keys(obj)
        stationCodes.forEach((crs: string) => {
            const points = obj[ crs ]
            points.forEach(point => {
                expect(typeof point.name).toBe('string')
                expect(typeof point.station).toBe('string')
                expectType(point.scheduledTime, 'string', 'undefined')
                expectType(point.estimatedTime, 'string', 'undefined')
                expectType(point.actualTime, 'string', 'undefined')
                expectType(point.cancelled, 'boolean', 'undefined')
                expectType(point.length, 'number', 'undefined')
                expectType(point.split, 'boolean', 'undefined')
                expect(Array.isArray(point.alerts)).toBe(true)
            })
        })
    }

    test('401 unauthorised', async ()=> {

        const response = await service
            .get('/arrivalsAndDepartures')
            .send()

        const expectedErr = new HTTP401Unauthorized('Not authorised')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(expectedErr.code)
        expect(response.body).toEqual(expectedJson)
    })
    
    test('422 missing crs', async () => {
        const {username, password, accessToken} = testUserCredentials()
        await db.createUser(username, password)

        const response = await service
            .get('/arrivalsAndDepartures')
            .set('authorization', `Bearer ${accessToken}`)
            .send()

        const expectedErr = new HTTP422UnprocessableEntity('missing crs')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(expectedErr.code)
        expect(response.body).toEqual(expectedJson)
    })

    test('422 incorrect type', async () => {
        const {username, password, accessToken} = testUserCredentials()
        await db.createUser(username, password)

        const response = await service
            .get('/arrivalsAndDepartures/NCL/foobar')
            .set('authorization', `Bearer ${accessToken}`)
            .send()

        const expectedErr = new HTTP422UnprocessableEntity('type must be "to" or "from" if it is used')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(expectedErr.code)
        expect(response.body).toEqual(expectedJson)
    })

    test('422 missing filterCrs', async () => {
        const {username, password, accessToken} = testUserCredentials()
        await db.createUser(username, password)

        const response = await service
            .get('/arrivalsAndDepartures/NCL/to/')
            .set('authorization', `Bearer ${accessToken}`)
            .send()

        const expectedErr = new HTTP422UnprocessableEntity('filterCrs must be set if type is set')
        const expectedJson = expectedErr.json

        expect(response.status).toBe(expectedErr.code)
        expect(response.body).toEqual(expectedJson)
    })

    test('/NCL', async () => {
        const {username, password, accessToken} = testUserCredentials()
        await db.createUser(username, password)
        await db.updateUser(username, {
            darwinWsdlUrl: 'https://fakedomain.com',
            darwinAccessToken: 'some-access-token'
        })

        // assert that the request counts are zero
        const preRequestUser = await db.getUser(username)
        expect(preRequestUser?.darwinRequestCount).toBe(0)
        expect(preRequestUser?.requestCount).toBe(0)

        const response = await service
            .get('/arrivalsAndDepartures/NCL')
            .set('authorization', `Bearer ${accessToken}`)
            .send()

        const {status, body} = response
        expect(status).toBe(200)
        expect(typeof body).toBe('object')

        expectType(body.station, 'string')
        expectType(body.generatedAt, 'string')
        expect(Array.isArray(body.services)).toBe(true)

        body.services.forEach((service: Record<string, unknown>) => {
            expect(typeof service.id).toBe('string')
            expectType(service.estimatedArrival, 'string', 'undefined')
            expectType(service.scheduledArrival, 'string', 'undefined')
            expectType(service.estimatedDeparture, 'string', 'undefined')
            expectType(service.scheduledDeparture, 'string', 'undefined')
            expect(typeof service.cancelled).toBe('boolean')
            expectType(service.platform, 'string', 'undefined')
            expect(typeof service.operator).toBe('string')
            expect(typeof service.operatorCode).toBe('string')
            expect(typeof service.scheduledFrom).toBe('object')
            expect(typeof service.currentFrom).toBe('object')
            expect(typeof service.scheduledTo).toBe('object')
            expect(typeof service.currentTo).toBe('object')
            expect(typeof service.callingAt).toBe('object')
            expect(typeof service.calledAt).toBe('object')
    
            type NestedRecord = Record<string, Record<string, unknown>>
            type NestedRecordArray = Record<string, Record<string, unknown>[]>

            checkOriginDestFormat(service.scheduledFrom as NestedRecord)
            checkOriginDestFormat(service.currentFrom as NestedRecord)
            checkOriginDestFormat(service.scheduledTo as NestedRecord)
            checkOriginDestFormat(service.currentTo as NestedRecord)
    
            checkCallingPointFormat(service.callingAt as NestedRecordArray)
            checkCallingPointFormat(service.calledAt as NestedRecordArray)
        })

        // check that the request count is incremented
        const postRequestUser = await db.getUser(username)
        expect(postRequestUser?.darwinRequestCount).toBe(1)
        expect(postRequestUser?.requestCount).toBe(1)
    })

    test('/NCL/to/KGX', async () => {

        const {username, password, accessToken} = testUserCredentials()
        await db.createUser(username, password)
        await db.updateUser(username, {
            darwinWsdlUrl: 'https://fakedomain.com',
            darwinAccessToken: 'some-access-token'
        })

        const response = await service
            .get('/arrivalsAndDepartures/NCL/to/KGX')
            .set('authorization', `Bearer ${accessToken}`)
            .send()

        const {status, body} = response
        expect(status).toBe(200)
        expect(typeof body).toBe('object')

        expectType(body.station, 'string')
        expectType(body.generatedAt, 'string')
        expect(Array.isArray(body.services)).toBe(true)

        body.services.forEach((service: Record<string, unknown>) => {
            expect(typeof service.id).toBe('string')
            expectType(service.estimatedArrival, 'string', 'undefined')
            expectType(service.scheduledArrival, 'string', 'undefined')
            expectType(service.estimatedDeparture, 'string', 'undefined')
            expectType(service.scheduledDeparture, 'string', 'undefined')
            expect(typeof service.cancelled).toBe('boolean')
            expectType(service.platform, 'string', 'undefined')
            expect(typeof service.operator).toBe('string')
            expect(typeof service.operatorCode).toBe('string')
            expect(typeof service.scheduledFrom).toBe('object')
            expect(typeof service.currentFrom).toBe('object')
            expect(typeof service.scheduledTo).toBe('object')
            expect(typeof service.currentTo).toBe('object')
            expect(typeof service.callingAt).toBe('object')
            expect(typeof service.calledAt).toBe('object')
    
            type NestedRecord = Record<string, Record<string, unknown>>
            type NestedRecordArray = Record<string, Record<string, unknown>[]>

            checkOriginDestFormat(service.scheduledFrom as NestedRecord)
            checkOriginDestFormat(service.currentFrom as NestedRecord)
            checkOriginDestFormat(service.scheduledTo as NestedRecord)
            checkOriginDestFormat(service.currentTo as NestedRecord)
    
            checkCallingPointFormat(service.callingAt as NestedRecordArray)
            checkCallingPointFormat(service.calledAt as NestedRecordArray)
        })

    })

    test('/NCL/from/KGX', async () => {
        const {username, password, accessToken} = testUserCredentials()
        await db.createUser(username, password)
        await db.updateUser(username, {
            darwinWsdlUrl: 'https://fakedomain.com',
            darwinAccessToken: 'some-access-token'
        })

        const response = await service
            .get('/arrivalsAndDepartures/NCL/from/KGX')
            .set('authorization', `Bearer ${accessToken}`)
            .send()

        const {status, body} = response
        expect(status).toBe(200)
        expect(typeof body).toBe('object')

        expectType(body.station, 'string')
        expectType(body.generatedAt, 'string')
        expect(Array.isArray(body.services)).toBe(true)

        body.services.forEach((service: Record<string, unknown>) => {
            expect(typeof service.id).toBe('string')
            expectType(service.estimatedArrival, 'string', 'undefined')
            expectType(service.scheduledArrival, 'string', 'undefined')
            expectType(service.estimatedDeparture, 'string', 'undefined')
            expectType(service.scheduledDeparture, 'string', 'undefined')
            expect(typeof service.cancelled).toBe('boolean')
            expectType(service.platform, 'string', 'undefined')
            expect(typeof service.operator).toBe('string')
            expect(typeof service.operatorCode).toBe('string')
            expect(typeof service.scheduledFrom).toBe('object')
            expect(typeof service.currentFrom).toBe('object')
            expect(typeof service.scheduledTo).toBe('object')
            expect(typeof service.currentTo).toBe('object')
            expect(typeof service.callingAt).toBe('object')
            expect(typeof service.calledAt).toBe('object')
    
            type NestedRecord = Record<string, Record<string, unknown>>
            type NestedRecordArray = Record<string, Record<string, unknown>[]>

            checkOriginDestFormat(service.scheduledFrom as NestedRecord)
            checkOriginDestFormat(service.currentFrom as NestedRecord)
            checkOriginDestFormat(service.scheduledTo as NestedRecord)
            checkOriginDestFormat(service.currentTo as NestedRecord)
    
            checkCallingPointFormat(service.callingAt as NestedRecordArray)
            checkCallingPointFormat(service.calledAt as NestedRecordArray)
        })
    })
})

describe('/service', () => {
    
    test('/service - 404 no serviceID', async () => {
        const {username, password, accessToken} = testUserCredentials()
        await db.createUser(username, password)
        await db.updateUser(username, {
            darwinWsdlUrl: 'https://fakedomain.com',
            darwinAccessToken: 'some-access-token'
        })

        const response = await service
            .get('/service')
            .set('authorization', `Bearer ${accessToken}`)
            .send()

        const {status} = response

        expect(status).toBe(404)
    })
    
    test('/service/{serviceID}', async () => {
        const {username, password, accessToken} = testUserCredentials()
        await db.createUser(username, password)
        await db.updateUser(username, {
            darwinWsdlUrl: 'https://fakedomain.com',
            darwinAccessToken: 'some-access-token'
        })

        const serviceID = '713802NWCSTLE_'

        const response = await service
            .get(`/service/${serviceID}`)
            .set('authorization', `Bearer ${accessToken}`)
            .send()

        const {status, body} = response

        console.debug({status, body})
    })
    
})
