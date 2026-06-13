import z from "zod"
export const createOrGetConversationResSchema = z.object({
  created: z.boolean(),
  conversationId: z.string().cuid(),
})
export type createOrGetConversationResType = z.infer<
  typeof createOrGetConversationResSchema
>
