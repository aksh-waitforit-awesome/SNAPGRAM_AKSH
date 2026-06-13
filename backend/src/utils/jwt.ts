import jwt from "jsonwebtoken"
import { z } from "zod"
import { JwtPayload, JwtPayloadSchema } from "../schema/jwt.schema"
import { UnauthorizedError } from "../errors"
export type TokenType = "access" | "refresh"
// Fallback secrets if environment variables aren't loaded
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "fallback_access_secret_123"
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret_456"

/**
 * Generates a short-lived Access Token (typically expires in 15 minutes)
 */
export function generateAccessToken(user: JwtPayload): string {
  const payload = {
    sub: user.sub,
    username: user.username,
  }
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "15m", // 15 minutes
  })
}
/* generate 7 day long token save in user cookie and user for refreshing access token  */
export function generateRefreshToken(user: JwtPayload): string {
  const payload = {
    sub: user.sub,
    username: user.username,
  }

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d", // 7 days
  })
}
export function verifyToken(token: string, type: TokenType): JwtPayload {
  const secret = type === "access" ? ACCESS_TOKEN_SECRET : REFRESH_TOKEN_SECRET

  try {
    // 1. Run signature validation
    const decoded = jwt.verify(token, secret)

    // 2. Run structural validation via Zod
    return JwtPayloadSchema.parse(decoded)
  } catch (error) {
    // ---- ERROR HANDLING CORE LOGIC ----

    // Case A: The token has passed its expiration time
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("TOKEN_EXPIRED")
    }

    // Case B: The signature is invalid (wrong secret, modified data, or completely fake)
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("TOKEN_INVALID")
    }

    // Case C: The token is valid and unexpired, but missing required fields or has wrong data types
    if (error instanceof z.ZodError) {
      throw new UnauthorizedError("TOKEN_MALFORMED")
    }

    // Case D: Any other edge cases (e.g., system issues)
    throw new UnauthorizedError("TOKEN_VERIFICATION_FAILED")
  }
}
