import { z } from "zod"

export const CommentAuthorSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
})

export const CommentSchema = z.object({
  id: z.string().cuid(),
  content: z.string(),

  createdAt: z.string(),
  updatedAt: z.string(),

  authorId: z.string(),
  postId: z.string(),
  parentId: z.string().nullable(),

  author: CommentAuthorSchema,

  likesCount: z.number(),
  repliesCount: z.number(),
  isLikedByCurrentUser: z.boolean(),
})

export const GetPostCommentResSchema = z.object({
  success: z.boolean(),
  comments: z.array(CommentSchema),
})

export const GetCommentRepliesResSchema = z.object({
  success: z.boolean(),
  replies: z.array(CommentSchema),
})

export const CreateCommentReqSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment is too long"),

  postId: z.string().min(1),

  parentId: z.string().nullable().default(null),
})

export const CreateCommentResSchema = z.object({
  success: z.boolean(),
  comment: CommentSchema,
})

export const CommentToggleLikeResSchema = z.object({
  message: z.string(),
  action: z.enum(["liked", "unliked"]),
  commentId: z.string(),
})

export type Comment = z.infer<typeof CommentSchema>

export type CreateCommentReq = z.infer<typeof CreateCommentReqSchema>

export type GetPostCommentRes = z.infer<typeof GetPostCommentResSchema>

export type GetCommentRepliesRes = z.infer<typeof GetCommentRepliesResSchema>

export type CreateCommentRes = z.infer<typeof CreateCommentResSchema>

export type CommentToggleLikeRes = z.infer<typeof CommentToggleLikeResSchema>
