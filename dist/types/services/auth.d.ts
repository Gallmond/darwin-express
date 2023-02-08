import EasyJWT from 'easy-jwt';
export declare const passwordValid: (plaintextPassword: string) => boolean;
export declare const hashPassword: (plaintextPassword: string, providedSalt?: string) => string;
export declare const verifyPassword: (plaintextPassword: string, storedHash: string) => boolean;
declare const easyJwt: EasyJWT;
export { easyJwt };
//# sourceMappingURL=auth.d.ts.map