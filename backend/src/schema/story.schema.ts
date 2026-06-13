import z from "zod"
export const createStoryInputSchema = z.object({
  mediaUrl: z.string(),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  mediaPath: z.string(),
  caption: z.string().optional(),
})