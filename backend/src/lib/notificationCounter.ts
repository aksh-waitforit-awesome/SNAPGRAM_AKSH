import { redis } from "./redis"

export async function incrementUnread(
  userId: string
) {
  return redis.incr(
    `notifications:unread:${userId}`
  )
}

export async function getUnreadCount(
  userId: string
) {
  const count = await redis.get(
    `notifications:unread:${userId}`
  )

  return Number(count || 0)
}

export async function resetUnreadCount(
  userId: string
) {
  await redis.set(
    `notifications:unread:${userId}`,
    0
  )
}