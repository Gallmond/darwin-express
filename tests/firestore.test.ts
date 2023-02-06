import User from '../src/user'
import { randomBytes } from 'crypto'
import {createNewUser, deleteTestUsers, getUserByUsername} from '../src/services/firestore'

const rand = () => randomBytes(16).toString('hex')

describe('firestore utils', () => {

    const usersToDelete: string[] = []

    afterAll(async () => {
        const deleted = await deleteTestUsers()
        console.log(`deleted ${deleted.length} of ${usersToDelete.length} test users`, deleted)
        expect(deleted.length).toBe(usersToDelete.length)
        // if this failed there might be surplus data in the emulator store. 
    })

    test('createUser', async () => {
        const username = `${rand()}@test-a.com`
        const password = 'bobs password'

        const newUser = await createNewUser(username, password)
        
        expect(newUser).toBeInstanceOf(User)
        expect(newUser.username).toBe(username)

        usersToDelete.push(username)
    })

    test('createUser failure (duplicate user)', async () => {
        const username = `${rand()}@test-b.com`
        const password = 'bobs password'

        await createNewUser(username, password)

        expect(async () => {
            await createNewUser(username, password)
        }).rejects.toThrow(`${username} already exists`)

        usersToDelete.push(username)
    })

    test('getUserByUsername', async () => {
        const username = `${rand()}@test-c.com`
        const password = 'bobs password'

        const newUser = await createNewUser(username, password)

        const retrievedUser = await getUserByUsername(username) as User
        expect(retrievedUser).toBeInstanceOf(User)
        expect(retrievedUser.username).toBe(newUser.username)

        usersToDelete.push(username)
    })

})