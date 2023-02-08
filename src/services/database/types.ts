import type User from '../../user'

export interface MutableUserData{
    requestCount?: number
    darwinRequestCount?: number
    hashedPassword?: string
}

export interface RevokedTokenData{
    token: string,
    createdAt: Date,
    keepUntil: Date,
}

export abstract class DBClass{
    static make: () => DBClass
    static singleton: () => DBClass
    abstract createUser: (username: string, password: string) => Promise<User>
    abstract getUser: (username: string) => Promise<User | null>
    abstract updateUser: (username: string, fields: MutableUserData) => Promise<boolean>
    abstract deleteUser: (username: string) => Promise<boolean>
    abstract createRevokedToken: (token: string, daysToLive: number) => Promise<RevokedTokenData>
    abstract getRevokedToken: (token: string) => Promise<RevokedTokenData | null>
    abstract deleteRevokedToken: (token: string) => Promise<boolean>
    abstract deleteAllTestUsers: () => Promise<string[]>
    abstract deleteAllRevokedTokens: () => Promise<string[]>
}