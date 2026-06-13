import { z } from "zod"

export const JwtPayloadSchema = z.object({
  // 'sub' stands for Subject, which holds your Prisma User CUID
  sub: z.string().cuid({ message: "Invalid user ID format in token" }),
  username: z.string().min(3).max(30),
})

// Infer the TypeScript type directly from the Zod schema
export type JwtPayload = z.infer<typeof JwtPayloadSchema>
