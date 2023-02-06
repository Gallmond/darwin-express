import type User from '../../user'

declare global {
  namespace Express {
    export interface Request {
      auth?: {user: User}
    }
  }
}