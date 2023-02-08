import type { Express } from 'express';
declare class CoolApplication {
    expressApp: Express;
    constructor(expressApp: Express);
    static make(): CoolApplication;
    listen(): void;
}
export default CoolApplication;
//# sourceMappingURL=experiment.d.ts.map