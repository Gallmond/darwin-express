import { FirestoreDataConverter, Timestamp } from 'firebase/firestore';
import type User from '../../user';
export interface MutableUserData {
    requestCount?: number;
    darwinRequestCount?: number;
    darwinWsdlUrl?: string;
    darwinAccessToken?: string;
    hashedPassword?: string;
}
export interface RevokedTokenData {
    token: string;
    createdAt: Date;
    keepUntil: Date;
}
export interface FirestoreRevokedTokenData {
    token: string;
    createdAt: Timestamp;
    keepUntil: Timestamp;
}
export declare const revokedTokenConverter: FirestoreDataConverter<RevokedTokenData>;
export declare abstract class DBClass {
    static make: () => DBClass;
    static singleton: () => DBClass;
    abstract createUser: (username: string, password: string) => Promise<User>;
    abstract getUser: (username: string) => Promise<User | null>;
    abstract updateUser: (username: string, fields: MutableUserData) => Promise<boolean>;
    abstract deleteUser: (username: string) => Promise<boolean>;
    abstract createRevokedToken: (token: string, daysToLive: number) => Promise<RevokedTokenData>;
    abstract getRevokedToken: (token: string) => Promise<RevokedTokenData | null>;
    abstract deleteRevokedToken: (token: string) => Promise<boolean>;
    abstract deleteAllTestUsers: () => Promise<string[]>;
    abstract deleteAllRevokedTokens: () => Promise<string[]>;
}
//# sourceMappingURL=types.d.ts.map