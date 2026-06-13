import { useAuthStore } from "@/store/useAuthStore"
import { useContext, createContext, useRef, useState, useEffect } from "react"
import { type Conversation } from "@/components/ConversationSidebar"
import {
  type ConversationResponse,
  type Message,
  type MessageStatus,
} from "@/pages/ConversationPage"
import { useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Outlet } from "react-router-dom"
import usePresenceStore from "@/store/usePresenceStore"

type StatusType = "disconnected" | "connecting" | "connected"

interface SocketContextType {
  socket: WebSocket | null
  status: StatusType
}
interface AUTH_SUCCESS_MESSAGE {
  type: "AUTH_SUCCESS"
}
interface AUTH_ERROR_MESSAGE {
  type: "AUTH_ERROR"
}
interface ONLINE_MESSAGE {
  type: "ONLINE"
  id: string
}
interface OFFLINE_MESSAGE {
  type: "OFFLINE"
  id: string
}
interface SYNC_PRESENCE_MESSAGE {
  type: "SYNC_PRESENCE"
  payload: {
    isOnline: boolean
    receiverId: string
  }
}
interface DM_MESSAGE {
  type: "MESSAGE"
  conversationId: string
  message: string
  payload: Message
}
interface MESSAGE_DELIVERED_MESSAGE {
  type: "MESSAGE_DELIVERED"
  conversationId: string
  messageId: string
  status: MessageStatus
  updatedMessage: Message
}
interface MESSAGE_READ_MESSAGE {
  type: "MESSAGE_READ"
  conversationId: string
  senderId: string
}
interface NOTIFICATION {
  id: string
  type: "FOLLOW" | "FOLLOW_REQUEST" | "LIKE" | "COMMENT"
  message: string
  isRead: boolean
  createdAt: string
  senderId: string
  receiverId: string
  postId?: string
}
interface NEW_NOTIFICATION_MESSAGE {
  type: "NEW_NOTIFICATION"
  receiverId: string
  message: string
  notification: NOTIFICATION
}
type WSMessage =
  | AUTH_SUCCESS_MESSAGE
  | AUTH_ERROR_MESSAGE
  | ONLINE_MESSAGE
  | OFFLINE_MESSAGE
  | SYNC_PRESENCE_MESSAGE
  | DM_MESSAGE
  | MESSAGE_DELIVERED_MESSAGE
  | MESSAGE_READ_MESSAGE
  | NEW_NOTIFICATION_MESSAGE
const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider() {
  const socketRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<StatusType>("disconnected")
  const { setOffline, setOnline } = usePresenceStore()
  const accessToken = useAuthStore((state) => state.accessToken)
  function handleNewNotification(message: string, notification: NOTIFICATION) {
    if (
      notification.type === "FOLLOW" ||
      notification.type === "FOLLOW_REQUEST" ||
      notification.type === "LIKE"
    ) {
      toast.success(message)
      queryClient.invalidateQueries([
        "Notifications",
        "unread_notification_count",
      ])
    }
  }
  useEffect(() => {
    // No token => disconnect
    if (!accessToken) {
      socketRef.current?.close()
      socketRef.current = null

      setStatus("disconnected")
      return
    }

    console.log("attempting to connect to WS")

    const socket = new WebSocket("ws://localhost:3000/ws")

    socketRef.current = socket

    setStatus("connecting")

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "AUTH",
          token: accessToken,
        }),
      )
    }

    socket.onmessage = (event: MessageEvent) => {
      try {
        const data: WSMessage = JSON.parse(event.data)

        if (data.type === "AUTH_SUCCESS") {
          setStatus("connected")
          console.log("Real-time connection active")
        }

        if (data.type === "AUTH_ERROR") {
          console.log("Session invalid")
          socket.close()
          setStatus("disconnected")
        }

        if (data.type === "NEW_NOTIFICATION") {
          handleNewNotification(data.message, data.notification)
        }
        if (data.type === "ONLINE") {
          setOnline(data.id)
        }

        if (data.type === "OFFLINE") {
          setOffline(data.id)
        }

        if (data.type === "SYNC_PRESENCE") {
          const { isOnline, receiverId } = data.payload
          isOnline ? setOnline(receiverId) : setOffline(receiverId)
        }

        if (data.type === "MESSAGE") {
          console.log("yes we at least enter this statement")
          // 1. Force to string so it perfectly matches useParams() in your component
          const conversationId = String(data.conversationId)
          const newMessage = data.payload
          socket.send(
            JSON.stringify({
              type: "MESSAGE_DELIVERED",
              messageId: newMessage.id,
              senderId: newMessage.senderId,
            }),
          )

          queryClient.setQueryData(
            ["conversation", conversationId],
            (prevData: ConversationResponse) => {
              console.log("prevData", prevData)
              // 2. Safety Check: If the user hasn't opened this chat yet,
              // prevData is undefined. Don't try to update it.
              if (!prevData || !prevData.messages) {
                return prevData
              }

              // 3. Prevent Duplicates (crucial for the sender's screen)
              const messageExists = prevData.messages.some(
                (msg: Message) => msg.id === newMessage.id,
              )
              console.log("messageExist")
              if (messageExists) {
                return prevData
              }
              // 4. Return new object to trigger React re-render
              console.log("triggering re render")
              return {
                ...prevData,
                messages: [...prevData.messages, newMessage],
              }
            },
          )
        }
        if (data.type === "MESSAGE_DELIVERED") {
          const messageId = data?.messageId
          const conversationId = data?.conversationId
          const updatedMessage = data?.updatedMessage
          queryClient.setQueryData(
            ["conversation", conversationId],
            (prevData: ConversationResponse) => {
              if (!prevData || !prevData?.messages) {
                return prevData
              }
              return {
                ...prevData,
                messages: prevData?.messages.map((msg: Message) => {
                  if (msg.id === messageId) {
                    return updatedMessage
                  }
                  return msg
                }),
              }
            },
          )
        }
        if (data.type === "MESSAGE_READ") {
          const conversationId = data?.conversationId
          const senderId = data?.senderId

          queryClient.setQueryData(
            ["conversation", conversationId],
            (prevData: ConversationResponse) => {
              // 1. Safety check
              if (!prevData || !prevData.messages) {
                return prevData
              }

              return {
                ...prevData,
                // 2. FIX: Plural 'messages', not 'message'
                messages: prevData.messages.map((message: Message) => {
                  if (
                    message.senderId === senderId &&
                    message.status !== "READ"
                  ) {
                    // 3. FIX: Properly return a new object with the updated status
                    return {
                      ...message,
                      status: "READ",
                    }
                  }

                  return message
                }),
              }
            },
          )
          queryClient.setQueryData(
            ["get_users_conversations"],
            (conversations: Conversation[]) => {
              if (!conversations || conversations.length === 0) {
                return { conversations }
              }
              return {
                conversations: conversations?.map((con) =>
                  con.id !== conversationId ? con : { ...con, unread: 0 },
                ),
              }
            },
          )
        }
      } catch (err) {
        console.log("failed to parse ws message", err)
      }
    }

    socket.onclose = () => {
      console.log("socket disconnected")

      setStatus("disconnected")
    }

    socket.onerror = (err) => {
      console.log("socket error", err)
    }

    // Cleanup
    return () => {
      socket.close()
    }
  }, [accessToken])
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "HEARTBEAT",
          }),
        )
      }
    }, 10000)

    return () => {
      clearInterval(heartbeat)
    }
  }, [])
  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        status,
      }}
    >
      {<Outlet />}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)

  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider")
  }

  return context
}
