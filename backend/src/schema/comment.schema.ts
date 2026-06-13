// schema/comment.schema.ts
import { z } from "zod"

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  postId: z.string().cuid(),
  parentId: z.string().cuid().optional().nullable(),
})

// ✅ Validate ALL external input — params are external input
export const commentIdParamSchema = z.object({
  commentId: z.string().cuid(),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
