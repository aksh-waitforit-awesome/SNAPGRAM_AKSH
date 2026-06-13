import z from "zod"
export const createPostInputSchema = z.object({
  caption: z.string(),
  mediaUrl: z.string(),
})
export const updatePostInputSchema = z.object({
    caption: z.string().optional(),
    mediaUrl: z.string().optional(),
})

export const postIdParamSchema = z.object({
  postId: z.string().cuid(),
})
