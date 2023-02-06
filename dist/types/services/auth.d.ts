import EasyJWT from 'easy-jwt';
export declare const passwordValid: (plaintextPassword: string) => boolean;
export declare const hashPassword: (plaintextPassword: string, providedSalt?: string) => string;
export declare const verifyPassword: (plaintextPassword: string, storedHash: string) => boolean;
export declare const easyJwt: EasyJWT;
//# sourceMappingURL=auth.d.ts.map