import z from "zod"
export const FollowRequestParamsSchema = z.object({
  followerId: z.string().cuid(),
})
export const FollowUserParams = z.object({
  followingId: z.string().cuid(),
})
