import { z } from "zod"

export const createPostSchema = z.object({
  caption: z
    .string()
    .min(1, "Caption is required")
    .max(300, "Caption too long"),

  mediaUrl: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Max size is 5 MB",
    })
    .refine((file) => file.type.startsWith("image/"), {
      message: "Only image files are allowed",
    }),
})

export const PostSchema = z.object({
  id: z.string(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  caption: z.string(),
  createdAt: z.string().datetime(),
  authorId: z.string(),

  author: z.object({
    username: z.string(),
    avatarUrl: z.string().url(),
  }),

  likesCount: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
  isLiked: z.boolean(),
})
export const togglePrivacyRes = z.object({
  message: z.string(),
  isPrivate: z.boolean(),
})
export const PostsSchema = z.object({
  posts: z.array(PostSchema),
})
export type Post = z.infer<typeof PostSchema>
export type Posts = z.infer<typeof PostsSchema>
export type CreatePostType = z.infer<typeof createPostSchema>
export type togglePrivacyResType = z.infer<typeof togglePrivacyRes>
