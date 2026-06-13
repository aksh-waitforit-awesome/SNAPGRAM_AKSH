import { createClient } from "redis"
import { config } from "dotenv"
config()
const url = process.env.REDIS_URL
console.log("url", url)
export const redis = createClient({
  url,
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 5) return new Error("MAX RETRIES REACH")
      return retries * 500
    },
  },
})
export const publisher = redis.duplicate()
export const subscriber = redis.duplicate()
redis.on("error", (err) => {
  console.error("Redis Error:", err)
})

export async function connectRedis() {
  await redis.connect()
  await publisher.connect()
  await subscriber.connect()

  console.log("Redis Connected")
}
