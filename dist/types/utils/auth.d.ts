import { type JwtPayload } from 'jsonwebtoken';
type PasswordHash = string;
export declare const hashPassword: (plaintextPassword: string) => PasswordHash;
export declare const verifyPassword: (plaintextPassword: string, storedHash: PasswordHash) => boolean;
export type JWT = string;
export declare const generateRefreshTokenForJWT: (jwt: JWT) => void;
/**
 * Returns a JWT that expires in one hour
 *
 * @param uid
 * @param customPayload
 * @returns
 */
export declare const generateJWT: (uid: string, customPayload?: Record<string, unknown>) => JWT;
export declare const verifyJWT: (jwt: JWT) => JwtPayload;
export {};
//# sourceMappingURL=auth.d.ts.map