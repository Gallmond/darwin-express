import User from '../../user'
import { hashPassword } from '../auth'
import { MILLISECONDS } from '../utils'
import { DBClass, MutableUserData, RevokedTokenData } from './types'

// type UsersTable = {[key: string]: User}
// type RevokedTokensTable = {[key: string]: RevokedTokenData}

type UsersTable = Map<string, User>
type RevokedTokensTable = Map<string, RevokedTokenData>

class DBMemory extends DBClass{
    private static _users: UsersTable = new Map()
    private static _revokedTokens: RevokedTokensTable = new Map()

    private static instance: DBMemory | undefined

    static make = () => {
        return new DBMemory()
    }

    static singleton = () => {
        if(DBMemory.instance === undefined){
            DBMemory.instance = DBMemory.make()
        }

        return DBMemory.instance
    }

    get users(){
        return DBMemory._users
    }

    get revokedTokens(){
        return DBMemory._revokedTokens
    }

    createUser = async (username: string, plaintextPassword: string): Promise<User> => {
        const existingUser = await this.getUser( username )

        if(existingUser !== null){
            throw new Error(`${username} already exists`)
        }

        const user = new User(username, hashPassword(plaintextPassword))
        user.uid = username

        this.users.set(username, user)
        
        return user
    }
    getUser = async (username: string): Promise<User | null> => {
        return this.users.get(username) ?? null
    }
    updateUser = async (username: string, fields: MutableUserData): Promise<boolean> => {
        const thisUser = await this.getUser(username)
        
        if(thisUser === null){
            throw new Error(`${username} does not exist`)
        }

        const {
            requestCount,
            darwinRequestCount,
            darwinWsdlUrl,
            darwinAccessToken,
            hashedPassword,
        } = thisUser

        thisUser.requestCount = fields.requestCount ?? requestCount
        thisUser.darwinRequestCount = fields.darwinRequestCount ?? darwinRequestCount
        thisUser.darwinWsdlUrl = fields.darwinWsdlUrl ?? darwinWsdlUrl
        thisUser.darwinAccessToken = fields.darwinAccessToken ?? darwinAccessToken
        thisUser.hashedPassword = fields.hashedPassword ?? hashedPassword

        return true
    }
    deleteUser = async (username: string): Promise<boolean> => {
        this.users.delete(username)

        return true
    }
    createRevokedToken = async (token: string, daysToLive: number): Promise<RevokedTokenData> => {
        const createdAt = new Date()
        const keepUntil = new Date(
            createdAt.valueOf() + (MILLISECONDS.DAY * daysToLive)
        )

        const data = { token, keepUntil, createdAt }

        this.revokedTokens.set(token, data)

        return data
    }
    getRevokedToken = async (token: string): Promise<RevokedTokenData | null> => {
        const revokedTokenData = this.revokedTokens.get(token) ?? null
        if(revokedTokenData === null){
            return null
        }
        
        const now = new Date().valueOf()
        if(now > revokedTokenData.keepUntil.valueOf()){
            await this.deleteRevokedToken(token)
            return null
        }

        return{
            token: revokedTokenData.token,
            createdAt: revokedTokenData.createdAt,
            keepUntil: revokedTokenData.keepUntil,
        }
    }
    deleteRevokedToken = async (token: string): Promise<boolean> => {
        this.revokedTokens.delete(token)

        return true
    }
    deleteAllTestUsers = async (): Promise<string[]> => {
        const deleted: string[] = []
        
        Object.keys(this.users).forEach(username => {
            deleted.push(username)
            
            this.users.delete(username)
        })

        return deleted
    }
    deleteAllRevokedTokens = async (): Promise<string[]> => {
        const deleted: string[] = []
        
        Object.keys(this.revokedTokens).forEach(token => {
            deleted.push(token)
            
            this.revokedTokens.delete(token)
        })

        return deleted
    }

}

export default DBMemory