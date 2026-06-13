import z from "zod"
export const sendMessageInputSchema = z.object({
    content:z.string(),
    conversationId:z.string().cuid()
})
export const markMessageSchema = z.object({
    conversationId:z.string()
})