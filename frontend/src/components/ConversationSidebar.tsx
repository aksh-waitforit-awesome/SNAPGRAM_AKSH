import API from "@/api/api"
import { useQuery } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageCircle } from "lucide-react"
import moment from "moment"
import { useNavigate } from "react-router-dom"

export interface Conversation {
  id: string
  receiver: {
    id: string
    username: string
    avatarUrl: string | null
  }
  unread: number
  lastMessage?: {
    id: string
    conversationId: string
    senderId: string
    content: string
    isRead: string
    createdAt: string
    updatedAt: string
  }
}

export interface GetConversationsRes {
  conversations: Conversation[]
}

async function getConversations() {
  const { data } = await API.get<GetConversationsRes>("/conversation")

  return data.conversations
}

const ConversationSidebar = () => {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["get_users_conversations"],
    queryFn: getConversations,
  })
  const navigate = useNavigate()
  if (isLoading) {
    return (
      <div className="h-full bg-zinc-950 p-4">
        <p className="text-zinc-400">Loading conversations...</p>
      </div>
    )
  }

  if (!conversations?.length) {
    return (
      <div className="h-full bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <MessageCircle className="size-10 text-zinc-600" />
        <h2 className="text-zinc-300 font-medium">No conversations yet</h2>
        <p className="text-sm text-zinc-500">Start messaging someone</p>
      </div>
    )
  }

  return (
    <div className="h-full bg-zinc-950 border-r border-zinc-800">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="font-semibold text-lg text-white">Messages</h2>
      </div>

      <ScrollArea className="h-[calc(100%-73px)]">
        <div className="p-2 space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => navigate(`/messages/${conversation.id}`)}
              className="
                w-full
                flex
                items-center
                gap-3
                rounded-xl
                bg-zinc-900
                border
                border-zinc-800
                p-3
                transition-all
                hover:bg-zinc-800
                hover:border-zinc-700
              "
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={conversation.receiver.avatarUrl || ""} />
                <AvatarFallback className="bg-zinc-700 text-white">
                  {conversation.receiver.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white truncate">
                    {conversation.receiver.username}
                  </h3>

                  {conversation.lastMessage && (
                    <span className="text-xs text-zinc-500">
                      {moment(conversation.lastMessage.createdAt).fromNow()}
                    </span>
                  )}
                </div>

                <p className="text-sm text-zinc-400 text-break ">
                  {conversation.lastMessage?.content.slice(0, 50) ||
                    "Start a conversation"}
                </p>
              </div>

              {conversation.unread > 0 && (
                <Badge
                  className="
                    min-w-6
                    h-6
                    rounded-full
                    flex
                    items-center
                    justify-center
                    bg-blue-600
                    hover:bg-blue-600
                    text-white
                  "
                >
                  {conversation.unread}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default ConversationSidebar
