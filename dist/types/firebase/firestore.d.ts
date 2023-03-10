import User from '../user';
/**
 * delete all docs in the 'users' collection that contains 'test' in its id
 */
export declare const deleteTestUsers: () => Promise<string[]>;
/**
 * deletes a doc in the 'users' collection by its id
 */
export declare const deleteUser: (identifier: string) => Promise<boolean>;
/**
 * return User if it exists in the 'users' collection, or null
 */
export declare const getUserByUsername: (username: string) => Promise<User | null>;
/**
 * creates a new User class and stores it in firebase. The username is the id
 */
export declare const createNewUser: (username: string, plaintextPass: string) => Promise<User>;
//# sourceMappingURL=firestore.d.ts.map