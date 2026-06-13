import {redis} from "./redis"
export async function isUserOnline(userId:string) {
    return ((await redis.exists(`presence:${userId}`)) === 1)
}
export async function getOnlineCount(
  userId: string,
) {
  const count = await redis.get(
    `presence:${userId}`,
  )

  return Number(count || 0)
}