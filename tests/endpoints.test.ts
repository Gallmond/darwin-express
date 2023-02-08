import { randomBytes } from 'crypto'
import supertest from 'supertest'
import { HTTP401Unauthorized, HTTP422UnprocessableEntity } from '../src/http/controllers/exceptions'
import { easyJwt } from '../src/services/auth'
import CoolApplication from '../src/experiment'
import database from '../src/services/database'

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

        const expectedErr = new HTTP401Unauthorized('token revoked')
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

describe('/arrivalsAndDepartures/{csr}/to|from/{csr}', () => {
    test.todo('get expected response')
    test.todo('invalid params get 422')
})

describe('/serviceDetails/{serviceId}', () => {
    test.todo('get expected response')
    test.todo('invalid params get 422')
})
