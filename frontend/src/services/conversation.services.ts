import {
  type createOrGetConversationResType,
  createOrGetConversationResSchema,
} from "./../schema/conversation.schema"
import API from "@/api/api"
export const createOrGetConversation = async (userId: string) => {
  const { data } = await API.post<createOrGetConversationResType>(
    `/conversation/${userId}`,
  )
  const parsed = createOrGetConversationResSchema.parse(data)
  return parsed.conversationId
}
