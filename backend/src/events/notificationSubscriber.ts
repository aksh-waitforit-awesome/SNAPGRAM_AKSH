import { subscriber } from "../lib/redis"

export async function startNotificationSubscriber(pushNotification: Function) {
  await subscriber.subscribe("notifications", async (message) => {
    const event = JSON.parse(message)
    const payload = {
      type: event.type,
      message: event.message,
      notification: event.notification,
    }
    pushNotification({
      receiverId: event.receiverId,
      payload,
    })
  })
}
