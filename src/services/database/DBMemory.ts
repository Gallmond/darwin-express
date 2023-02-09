import User from '../../user'
import { hashPassword } from '../auth'
import { MILLISECONDS } from '../utils'
import { DBClass, MutableUserData, RevokedTokenData } from './types'

type UsersTable = {[key: string]: User}
type RevokedTokensTable = {[key: string]: RevokedTokenData}

class DBMemory extends DBClass{
    private static _users: UsersTable = {}
    private static _revokedTokens: RevokedTokensTable = {}

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

        this.users[ username ] = user
        
        return user
    }
    getUser = async (username: string): Promise<User | null> => {
        return this.users[ username ] ?? null
    }
    updateUser = async (username: string, fields: MutableUserData): Promise<boolean> => {
        if(!this.users[username]){
            throw new Error(`${username} does not exist`)
        }

        const {
            requestCount,
            darwinRequestCount,
            darwinWsdlUrl,
            darwinAccessToken,
            hashedPassword,
        } = this.users[username]

        this.users[username].requestCount = fields.requestCount ?? requestCount
        this.users[username].darwinRequestCount = fields.darwinRequestCount ?? darwinRequestCount
        this.users[username].darwinWsdlUrl = fields.darwinWsdlUrl ?? darwinWsdlUrl
        this.users[username].darwinAccessToken = fields.darwinAccessToken ?? darwinAccessToken
        this.users[username].hashedPassword = fields.hashedPassword ?? hashedPassword

        return true
    }
    deleteUser = async (username: string): Promise<boolean> => {
        delete this.users[username]

        return true
    }
    createRevokedToken = async (token: string, daysToLive: number): Promise<RevokedTokenData> => {
        const createdAt = new Date()
        const keepUntil = new Date(
            createdAt.valueOf() + (MILLISECONDS.DAY * daysToLive)
        )

        this.revokedTokens[ token ] = {
            token, keepUntil, createdAt
        }

        return this.revokedTokens[ token ]
    }
    getRevokedToken = async (token: string): Promise<RevokedTokenData | null> => {
        const revokedTokenData = this.revokedTokens[token] ?? null
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
        delete this.revokedTokens[ token ]

        return true
    }
    deleteAllTestUsers = async (): Promise<string[]> => {
        const deleted: string[] = []
        
        Object.keys(this.users).forEach(username => {
            deleted.push(username)
            
            delete this.users[username]
        })

        return deleted
    }
    deleteAllRevokedTokens = async (): Promise<string[]> => {
        const deleted: string[] = []
        
        Object.keys(this.revokedTokens).forEach(token => {
            deleted.push(token)
            
            delete this.revokedTokens[token]
        })

        return deleted
    }

}

export default DBMemory