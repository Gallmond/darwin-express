import User from '../user';
export declare const deleteTestUsers: () => Promise<string[]>;
export declare const deleteUser: (identifier: string) => Promise<boolean>;
export declare const getUserByUsername: (username: string) => Promise<User | null>;
export declare const createNewUser: (username: string, plaintextPass: string) => Promise<User>;
//# sourceMappingURL=firestore.d.ts.map