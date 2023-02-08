import { Firestore } from 'firebase/firestore';
import User from '../user';
interface RevokedTokenData {
    token: string;
    createdAt: Date;
    keepUntil: Date;
}
declare class FirestoreFunctions {
    private firestore;
    private static _instance;
    constructor(firestore: Firestore);
    static get singleton(): FirestoreFunctions;
    static make(): FirestoreFunctions;
    deleteAllRevokedTokens: () => Promise<string[]>;
    deleteUser: (identifier: string) => Promise<boolean>;
    deleteTestUsers: () => Promise<string[]>;
    tokenIsRevoked: (token: string) => Promise<boolean>;
    getRevokedToken: (token: string) => Promise<RevokedTokenData | null>;
    addRevokedToken: (token: string, daysToLive?: number) => Promise<void>;
    createNewUser: (username: string, plaintextPass: string) => Promise<User>;
    getUserByUsername: (username: string) => Promise<User | null>;
}
export = FirestoreFunctions;
//# sourceMappingURL=firestore.d.ts.map