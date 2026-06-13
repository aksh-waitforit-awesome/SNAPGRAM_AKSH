import jwt, { JwtPayload } from "jsonwebtoken"
import { UnauthorizedError } from "../errors"
import { Request, Response, NextFunction } from "express"
import { config } from "dotenv"
import { verifyToken } from "../utils/jwt"

config()
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Invalid Token")
  }
  const token = authHeader.split(" ")[1]
  try {
    const payload = verifyToken(token, "access")
    req.user = payload
    next()
  } catch (error) {
    throw new UnauthorizedError("Token invalid or expired")
  }
}
export default authMiddleware
