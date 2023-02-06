export declare class BaseError extends Error {
    message: string;
    name: string;
    code: number;
    constructor(message?: string, name?: string, code?: number);
    get json(): {
        name: string;
        message: string;
        code: number;
    };
}
export declare class HTTP422UnprocessableEntity extends BaseError {
    message: string;
    name: string;
    code: number;
    constructor(message?: string, name?: string, code?: number);
}
export declare class HTTP401Unauthorized extends BaseError {
    message: string;
    name: string;
    code: number;
    constructor(message?: string, name?: string, code?: number);
}
//# sourceMappingURL=exceptions.d.ts.map