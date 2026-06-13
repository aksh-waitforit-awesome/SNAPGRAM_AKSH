import { Request } from "express"
import { UnauthorizedError } from "../errors"
export function getCurrentUserId(req: Request): string {
  if (!req.user?.sub) {
    throw new UnauthorizedError("invalid jwt token")
  }

  return req.user.sub
}