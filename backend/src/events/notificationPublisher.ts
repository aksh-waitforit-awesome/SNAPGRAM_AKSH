import { publisher } from "../lib/redis"
import { Notification } from "../generated/prisma/client"
export interface NotificationEvent {
  type: "NEW_NOTIFICATION"
  receiverId: string
  message: string
  notification: Notification
}
export async function publishNotification(event: NotificationEvent) {
  await publisher.publish("notifications", JSON.stringify(event))
}
