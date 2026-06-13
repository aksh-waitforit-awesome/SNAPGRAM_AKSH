import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGetNotification } from "@/react-query/QueryAndMutation"
import { Loader2, UserPlus, Heart, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useAcceptFollowRequest,
  useRejectFollowRequest,
} from "@/react-query/QueryAndMutation"
import API from "@/api/api"
import { useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

// 1. Added TypeScript Interfaces
interface Sender {
  id: string
  username: string
  avatarUrl?: string
}

interface NotificationItem {
  id: string
  type: "FOLLOW" | "FOLLOW_REQUEST" | "LIKE" | "COMMENT"
  message: string
  isRead: boolean
  createdAt: string
  senderId: string
  sender: Sender
}

interface NotificationsData {
  unreadCount: number
  notifications: NotificationItem[]
}

interface MarkAsReadRes {
  success: boolean
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "FOLLOW":
    case "FOLLOW_REQUEST":
      return <UserPlus className="size-4 text-blue-500" />
    case "LIKE":
      return <Heart className="size-4 text-red-500 fill-red-500" />
    case "COMMENT":
      return <MessageCircle className="size-4 text-green-500" />
    default:
      return null
  }
}

const markAsRead = async () => {
  const { data } = await API.patch<MarkAsReadRes>("/notification/marked")
  return data.success
}

const formatTime = (date: string) => {
  const now = new Date().getTime()
  const created = new Date(date).getTime()
  const diff = Math.floor((now - created) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`

  return `${Math.floor(diff / 86400)}d ago`
}

const Notification = () => {
  const queryClient = useQueryClient()

  // Assuming useGetNotification returns typed data: NotificationsData
  const { data, isPending } = useGetNotification()

  const { mutateAsync: acceptFollowRequest, isPending: acceptingRequest } =
    useAcceptFollowRequest()
  const { mutateAsync: rejectFollowRequest, isPending: rejectingRequest } =
    useRejectFollowRequest()

  const { mutateAsync: markAsReadMutation } = useMutation({
    mutationFn: markAsRead,
    onSuccess: (success) => {
      if (success) {
        // 2. Added type safety to the cache update
        queryClient.setQueryData<NotificationsData>(
          ["Notifications"],
          (prevData) => {
            if (!prevData) return prevData
            return {
              ...prevData,
              unreadCount: 0,
              notifications: prevData.notifications.map((n) => ({
                ...n,
                isRead: true,
              })),
            }
          },
        )
        queryClient.setQueryData(["unread_notification_count"], 0)
      }
    },
  })

  // 3. Optimized useEffect to only mark as read if there are actually unread notifications
  useEffect(() => {
    if (data && data.unreadCount > 0) {
      markAsReadMutation()
    }
  }, [data?.unreadCount, markAsReadMutation])

  if (isPending) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Stay updated with your activity
          </p>
        </div>

        {data?.unreadCount && data.unreadCount > 0 ? (
          <div className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
            {data.unreadCount} unread
          </div>
        ) : null}
      </div>

      {/* Empty State */}
      {data?.notifications?.length === 0 ? (
        <Card className="flex h-40 items-center justify-center border-dashed">
          <p className="text-muted-foreground">No notifications yet ✨</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.notifications?.map((notification: NotificationItem) => (
            <Card
              key={notification.id}
              className={`
                group relative overflow-hidden p-4 transition-all
                hover:bg-zinc-800 hover:shadow-md 
                ${
                  !notification.isRead
                    ? "border-l-4 border-l-purple-500 bg-zinc-950"
                    : "bg-gray-900"
                }
              `}
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <Avatar className="size-12 border">
                  <AvatarImage src={notification.sender.avatarUrl} />
                  <AvatarFallback>
                    {notification.sender.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <span className="font-medium text-zinc-200">
                      {notification.sender.username}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-300">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>

                {/* Follow Request Actions */}
                {notification.type === "FOLLOW_REQUEST" && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => acceptFollowRequest(notification.senderId)}
                      disabled={acceptingRequest || rejectingRequest}
                      className="hover:bg-purple-500"
                      size="sm"
                    >
                      {acceptingRequest ? "...loading" : "Accept"}
                    </Button>

                    <Button
                      onClick={() => rejectFollowRequest(notification.senderId)}
                      disabled={acceptingRequest || rejectingRequest}
                      className="hover:bg-red-400 hover:text-white"
                      size="sm"
                      variant="secondary"
                    >
                      {rejectingRequest ? "...loading" : "Decline"}
                    </Button>
                  </div>
                )}

                {/* Unread Dot */}
                {!notification.isRead && (
                  <div className="mt-2 size-2 rounded-full bg-blue-500" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notification
