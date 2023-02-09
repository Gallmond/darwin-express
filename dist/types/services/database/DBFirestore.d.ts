import { Firestore } from 'firebase/firestore';
import User from '../../user';
import { DBClass, MutableUserData, RevokedTokenData } from './types';
declare class DBFirestore extends DBClass {
    private firestore;
    private static instance;
    constructor(firestore: Firestore);
    static make: () => DBFirestore;
    static singleton: () => DBFirestore;
    createUser: (username: string, plaintextPassword: string) => Promise<User>;
    getUser: (username: string) => Promise<User | null>;
    updateUser: (username: string, fields: MutableUserData) => Promise<boolean>;
    deleteUser: (username: string) => Promise<boolean>;
    createRevokedToken: (token: string, daysToLive?: number) => Promise<RevokedTokenData>;
    getRevokedToken: (token: string) => Promise<RevokedTokenData | null>;
    deleteRevokedToken: (token: string) => Promise<boolean>;
    deleteAllTestUsers: () => Promise<string[]>;
    deleteAllRevokedTokens: () => Promise<string[]>;
    private tokenDoc;
    private userDoc;
    private tokenCollection;
    private userCollection;
}
export default DBFirestore;
//# sourceMappingURL=DBFirestore.d.ts.map