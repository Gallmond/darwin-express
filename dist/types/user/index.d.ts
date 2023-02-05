import { type FirestoreDataConverter } from 'firebase/firestore';
declare const userConverter: FirestoreDataConverter<User>;
declare class User {
    username: string;
    hashedPassword: string;
    createdAt: Date;
    updatedAt: Date;
    requestCount: number;
    darwinRequestCount: number;
    _uid: string | undefined;
    constructor(username: string, hashedPassword: string, createdAt?: Date, updatedAt?: Date, requestCount?: number, darwinRequestCount?: number);
    static make(username: string, hashedPassword: string): User;
    get uid(): string;
    set uid(val: string);
}
export { userConverter };
export default User;
//# sourceMappingURL=index.d.ts.map