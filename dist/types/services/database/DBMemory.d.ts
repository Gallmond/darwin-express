import User from '../../user';
import { DBClass, MutableUserData, RevokedTokenData } from './types';
type UsersTable = {
    [key: string]: User;
};
type RevokedTokensTable = {
    [key: string]: RevokedTokenData;
};
declare class DBMemory extends DBClass {
    private static _users;
    private static _revokedTokens;
    private static instance;
    static make: () => DBMemory;
    static singleton: () => DBMemory;
    get users(): UsersTable;
    get revokedTokens(): RevokedTokensTable;
    createUser: (username: string, plaintextPassword: string) => Promise<User>;
    getUser: (username: string) => Promise<User | null>;
    updateUser: (username: string, fields: MutableUserData) => Promise<boolean>;
    deleteUser: (username: string) => Promise<boolean>;
    createRevokedToken: (token: string, daysToLive: number) => Promise<RevokedTokenData>;
    getRevokedToken: (token: string) => Promise<RevokedTokenData | null>;
    deleteRevokedToken: (token: string) => Promise<boolean>;
    deleteAllTestUsers: () => Promise<string[]>;
    deleteAllRevokedTokens: () => Promise<string[]>;
}
export default DBMemory;
//# sourceMappingURL=DBMemory.d.ts.map