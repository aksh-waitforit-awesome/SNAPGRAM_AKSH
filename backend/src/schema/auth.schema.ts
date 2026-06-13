import { z } from "zod"

export const RegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),

  email: z.string().trim().email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
})
export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
