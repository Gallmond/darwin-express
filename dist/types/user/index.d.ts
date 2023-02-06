import { type FirestoreDataConverter } from 'firebase/firestore';
/**
 * tells fireStore how to:
 * - transform User instance and convert it into document data
 * - take document data and return User instance
 */
declare const userConverter: FirestoreDataConverter<User>;
declare class User {
    username: string;
    hashedPassword: string;
    createdAt: Date;
    updatedAt: Date;
    requestCount: number;
    darwinRequestCount: number;
    private firebaseId?;
    constructor(username: string, hashedPassword: string, createdAt?: Date, updatedAt?: Date, requestCount?: number, darwinRequestCount?: number, firebaseId?: string | undefined);
    get uid(): string;
    set uid(val: string);
    get json(): {
        firebaseId: string | undefined;
        username: string;
        hashedPassword: string;
        createdAt: Date;
        updatedAt: Date;
        requestCount: number;
        darwinRequestCount: number;
    };
}
export { userConverter };
export default User;
//# sourceMappingURL=index.d.ts.map