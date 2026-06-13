import { config } from "dotenv"
import os from "os"
config()
import http, { Server } from "http"
import express from "express"
import cookieParser from "cookie-parser"
import { prisma } from "./lib/prisma"
import { connectRedis, redis } from "./lib/redis"
import authRoutes from "./routes/auth"
import profileRoutes from "./routes/profile"
import postRoutes from "./routes/post"
import userRoutes from "./routes/users"
import commentRoutes from "./routes/comment"
import messageRoutes from "./routes/message"
import notificationRoutes from "./routes/notification"
import conversationRoutes from "./routes/conversation"
import storyRoutes from "./routes/story"
import notFound from "./middleware/notFound"
import errorHandler from "./middleware/errorHandler"
import cors from "cors"
import { attachServer } from "./ws/socket"
import { startNotificationSubscriber } from "./events/notificationSubscriber"
import { startStoryCleanupCron } from "./cron"

const app = express()
const server = http.createServer(app)
app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }),
)
app.use("/api/auth", authRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/profile", profileRoutes)
app.use("/api/users", userRoutes)
app.use("/api/comment", commentRoutes)
app.use("/api/notification", notificationRoutes)
app.use("/api/conversation", conversationRoutes)
app.use("/api/message", messageRoutes)
app.use("/api/story", storyRoutes)
app.use(notFound)
app.use(errorHandler)
const { pushNotification, sendMessageWS, markMessageReadWS } =
  attachServer(server)
app.locals.sendMessageWS = sendMessageWS
app.locals.markMessageReadWS = markMessageReadWS
app.locals.pushNotification = pushNotification
const port = process.env.PORT || 3000
startStoryCleanupCron()
server.listen(port, async () => {
  await connectRedis()
  await startNotificationSubscriber(pushNotification)

  console.log(`\n🚀 Server is running!`)
  console.log(`➜ Local:   http://localhost:${port}`)
  console.log(`➜ Websocket (Local):   ws://localhost:${port}/ws`)
})
