import { Darwin } from 'darwin-ldb-node';
import User from '../user';
declare const darwinForService: () => Promise<Darwin>;
declare const darwinForUser: (user: User) => Promise<Darwin>;
export { darwinForService, darwinForUser };
//# sourceMappingURL=darwin.d.ts.map