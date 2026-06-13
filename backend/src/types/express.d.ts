// types/express.d.ts

import { JwtPayload } from "../schema/jwt.schema"

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export {}
