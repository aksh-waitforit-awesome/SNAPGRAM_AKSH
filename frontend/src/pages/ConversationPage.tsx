import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/store/useAuthStore"
import API from "@/api/api"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import IsOnline from "@/components/isOnline"
import { Check, CheckCheck, MoveLeftIcon } from "lucide-react"
import moment from "moment"
import toast from "react-hot-toast"

interface SendMessageParams {
  conversationId: string
  content: string
}

type MessageStatus = "SENT" | "DELIVERED" | "READ"

export interface Message {
  id: string
  senderId: string
  conversationId: string
  content: string
  isRead: boolean
  status: MessageStatus
  updatedAt: string
  createdAt: string
  isOptimistic?: boolean
}

interface ConversationResponse {
  receiver: {
    id: string
    avatarUrl: string | null
    username: string
  }
  conversationId: string
  messages: Message[]
  online: boolean
}

async function getConversationById(id: string) {
  const { data } = await API.get<ConversationResponse>(`/conversation/${id}`)
  return data
}

async function sendMessage(message: SendMessageParams) {
  const { data } = await API.post<Message>("/message/send", message)
  return data
}

async function markAsRead(conversationId: string) {
  await API.patch("/message/mark", { conversationId })
}

const ConversationPage = () => {
  const [content, setContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { conversationId } = useParams() as {
    conversationId: string
  }

  const sender = useAuthStore((state) => state.user)

  const { data, isLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversationById(conversationId),
    enabled: !!conversationId,
  })

  const mutation = useMutation({
    mutationFn: handleSendMessage,

    onMutate: async (newContent) => {
      await queryClient.cancelQueries({
        queryKey: ["conversation", conversationId],
      })

      const previousConversation =
        queryClient.getQueryData<ConversationResponse>([
          "conversation",
          conversationId,
        ])

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: sender?.id || "",
        conversationId,
        content: newContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
        status: "SENT",
        isOptimistic: true,
      }

      queryClient.setQueryData(
        ["conversation", conversationId],
        (old: ConversationResponse | undefined) => {
          if (!old) return old

          return {
            ...old,
            messages: [...old.messages, optimisticMessage],
          }
        },
      )

      return {
        previousConversation,
        optimisticId: optimisticMessage.id,
      }
    },

    onError: (_, __, context) => {
      if (context?.previousConversation) {
        queryClient.setQueryData(
          ["conversation", conversationId],
          context.previousConversation,
        )
      }

      toast.error("Failed to send message")
    },

    onSuccess: (realMessage, _, context) => {
      queryClient.setQueryData(
        ["conversation", conversationId],
        (old: ConversationResponse | undefined) => {
          if (!old) return old

          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.id === context?.optimisticId ? realMessage : msg,
            ),
          }
        },
      )

      setContent("")
    },
  })

  async function handleSendMessage(messageContent: string) {
    return sendMessage({
      conversationId,
      content: messageContent.trim(),
    })
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [data?.messages])

  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId)
    }
  }, [conversationId, data?.messages])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/messages")}
            className="text-2xl p-2"
          >
            <MoveLeftIcon />
          </button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={data?.receiver.avatarUrl || ""} />
            <AvatarFallback>
              {data?.receiver.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-medium text-white">
              {data?.receiver.username}
            </h2>

            {data?.receiver?.id && <IsOnline id={data?.receiver?.id} />}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {data?.messages.map((message) => {
            const isSender = message.senderId === sender?.id

            return (
              <div
                key={message.id}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div>
                  <div
                    className={`max-w-[280px] rounded-2xl px-4 py-2 sm:max-w-md ${
                      isSender
                        ? "rounded-br-md bg-purple-600 text-white"
                        : "rounded-bl-md bg-zinc-800 text-white"
                    } ${message.isOptimistic ? "opacity-50" : ""}`}
                  >
                    {message.content}
                  </div>

                  <div
                    className={`mt-1 flex items-center gap-1 text-xs text-zinc-400 ${
                      isSender ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>{formatTime(message.createdAt)}</span>

                    {isSender && (
                      <>
                        {message.status === "SENT" && <Check size={12} />}

                        {message.status === "DELIVERED" && (
                          <CheckCheck size={12} />
                        )}

                        {message.status === "READ" && (
                          <CheckCheck size={12} className="text-blue-500" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <footer className="border-t border-zinc-800 bg-zinc-900 p-3">
        <form
          className="mx-auto flex max-w-4xl items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()

            if (!content.trim()) return

            mutation.mutate(content)
          }}
        >
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
          />

          <Button
            type="submit"
            disabled={!content.trim() || mutation.isPending}
            className="rounded-full"
          >
            Send
          </Button>
        </form>
      </footer>
    </div>
  )
}

export default ConversationPage
