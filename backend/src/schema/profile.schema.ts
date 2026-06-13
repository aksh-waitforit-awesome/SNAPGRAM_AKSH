import z from "zod"
export const updateProfileBioInputSchema = z.object({
  bio: z.string(),
})
export const updateProfileAvatarInputSchema = z.object({
  avatarUrl: z.string(),
  avatarPath: z.string(),
})
export const searchUserQuerySchema = z.object({
  username: z.string().nullable(),
})
export const profileIdParamsSchema = z.object({
  profileId: z.string().cuid(),
})
