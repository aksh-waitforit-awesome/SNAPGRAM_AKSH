import z from "zod"
export const conversationIdParamsSchema = z.object({
  id: z.string(),
})
export const targetIdParamsSchema = z.object({
  id: z.string(),
})
