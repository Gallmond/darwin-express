import User from '../src/user'
import { randomBytes } from 'crypto'
import {addRevokedToken, createNewUser, deleteAllRevokedTokens, deleteTestUsers, getRevokedToken, getUserByUsername, tokenIsRevoked} from '../src/services/firestore'
import { easyJwt } from '../src/services/auth'

const rand = () => randomBytes(16).toString('hex')

describe('firestore token utils', () => {

    afterAll(async () => {
        const [deletedTokens] = await Promise.all([
            deleteAllRevokedTokens(),
        ])

        console.log(`deleted ${deletedTokens.length} docs from revoked_tokens`, deletedTokens)
    })

    test('addRevokedToken & getRevokedToken', async () => {
        const {accessToken} = easyJwt.createTokens('foobar')

        const daysToLive = 2
        await addRevokedToken(accessToken, daysToLive)

        // check that the token was stored
        const revokedTokenData = await getRevokedToken( accessToken )
        expect(revokedTokenData).not.toBeUndefined()

        const revokedToken = revokedTokenData?.token as string
        expect(revokedToken).toBe(accessToken)

        // check that its keepUntil is createdAt + days to live
        const createdAtMs = revokedTokenData?.createdAt.valueOf() as number
        const keepUntilMs = revokedTokenData?.keepUntil.valueOf() as number

        const daysToLiveMs = 1000 * 60 * 60 * 24 * daysToLive

        expect(keepUntilMs).toBe(createdAtMs + daysToLiveMs)
    })

    test('tokenIsRevoked - withIn keepUntil', async () => {
        // add token for 3 days
        const {accessToken} = easyJwt.createTokens('foobar')
        await addRevokedToken(accessToken, 3)

        // check its revoked
        expect(await tokenIsRevoked( accessToken )).toBe(true)
    })

    test('tokenIsRevoked - after keepUntil', async () => {
        /**
         * This test is problematic to run as using jests setSystemTime breaks
         * firestore.
         * 
         * Instead lets set the keep time as a date in the past
         */
        const {accessToken} = easyJwt.createTokens('foobar')
        const daysToKeep = -3
        await addRevokedToken(accessToken, daysToKeep)

        // check it was deleted
        const existingTokenData = await getRevokedToken( accessToken )
        expect(existingTokenData).toBe(null)
    })
})

describe('firestore user utils', () => {

    afterAll(async () => {

        const [deletedUsers] = await Promise.all([
            deleteTestUsers()
        ])

        console.log(`deleted ${deletedUsers.length} users with 'test' in id `, deletedUsers)
    })


    test('createUser', async () => {
        const username = `${rand()}@test-a.com`
        const password = 'bobs password'

        const newUser = await createNewUser(username, password)
        
        expect(newUser).toBeInstanceOf(User)
        expect(newUser.username).toBe(username)
    })

    test('createUser failure - duplicate user', async () => {
        const username = `${rand()}@test-b.com`
        const password = 'bobs password'

        await createNewUser(username, password)

        expect(async () => {
            await createNewUser(username, password)
            expect(true).toBe(false)
        }).rejects.toThrow(`${username} already exists`)
        expect(true).toBe(true)
    })

    test('getUserByUsername', async () => {
        const username = `${rand()}@test-c.com`
        const password = 'bobs password'

        const newUser = await createNewUser(username, password)

        const retrievedUser = await getUserByUsername(username) as User
        expect(retrievedUser).toBeInstanceOf(User)
        expect(retrievedUser.username).toBe(newUser.username)
    })

})