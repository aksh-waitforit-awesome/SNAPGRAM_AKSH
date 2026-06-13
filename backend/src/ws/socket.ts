import { Notification } from "../generated/prisma/client"
import { Server as HttpServer } from "http"
import { prisma } from "../lib/prisma"
import WebSocket, { RawData, WebSocketServer } from "ws"
import { JwtPayload } from "../schema/jwt.schema"
import jwt from "jsonwebtoken"
import { redis } from "../lib/redis"
import crypto from "crypto"
interface CustomWebSocket extends WebSocket {
  isAlive?: boolean
  isAuthorized?: boolean
  user?: JwtPayload | null
  socketId: string | null
}
type AuthMessage = {
  type: "AUTH"
  token: string
}

type DeliveredMessage = {
  type: "MESSAGE_DELIVERED"
  senderId: string
  messageId: string
}

type HeartBeatMessage = {
  type: "HEARTBEAT"
}

type SyncPresenceMessage = {
  type: "SYNC_PRESENCE"
  payload: {
    receiverId: string
    senderId: string
  }
}

type WSMessage =
  | AuthMessage
  | DeliveredMessage
  | HeartBeatMessage
  | SyncPresenceMessage

interface pushNotificationArgs {
  receiverId: string
  payload: {
    type: string
    message: string
    notification: Notification
  }
}
function broadCastToAll(wss: WebSocketServer, payload: any) {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
    }
  })
}
// storing user sockets
const userSockets = new Map<string, Set<CustomWebSocket>>()
// Helpers
function sendJSON(socket: CustomWebSocket, data: unknown) {
  if (socket.readyState === WebSocket.OPEN && socket.isAuthorized) {
    socket.send(JSON.stringify(data))
  }
}
// Socket Server
export function attachServer(server: HttpServer) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  })
  // Handling ghost connection clean up
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      const socket = client as CustomWebSocket
      if (socket.isAlive === false) return socket.terminate()
      socket.isAlive = false
      socket.ping()
    })
  }, 3000)
  wss.on("connection", (ws: CustomWebSocket) => {
    console.log("connecting")
    ws.isAlive = true
    ws.isAuthorized = false
    ws.user = null
    ws.socketId = null
    ws.on("pong", () => {
      ws.isAlive = true
    })
    const authTimeout = setTimeout(() => {
      if (!ws.isAuthorized) {
        sendJSON(ws, { error: "authentication timed out" })
        ws.terminate()
      }
    }, 5000)
    ws.on("message", async (data: RawData) => {
      try {
        const raw: unknown = JSON.parse(data.toString())
        if (!raw || typeof raw !== "object") {
          throw new Error("Invalid message")
        }
        const message = raw as WSMessage

        if (message?.type === "AUTH") {
          if (ws.isAuthorized) return
          jwt.verify(
            message?.token || "",
            process.env.ACCESS_TOKEN_SECRET as string,
            async (err, decoded) => {
              // Return if authentication fail
              if (err || !decoded) {
                sendJSON(ws, { type: "AUTH_ERROR", error: "invalid token" })
                return ws.close()
              }
              // decode data
              const decode = decoded as JwtPayload
              // extract user unique id
              const uid = decode.sub
              // make the socket authorize
              ws.isAuthorized = true
              // unique id for socket
              const socketId = crypto.randomUUID()
              // save user in socket
              ws.user = decode
              // save socketId in socket
              ws.socketId = socketId
              // check there is key in userSockets map with userId
              if (!userSockets.has(uid)) {
                // if not create an key with empty
                userSockets.set(uid, new Set())
              }
              // add socket instance in set map with userId key in user socket  map
              userSockets.get(uid)?.add(ws)
              // clear time out
              clearTimeout(authTimeout)
              const count = await redis.sCard(`presence:${uid}`)
              // save the session in redis
              await redis.sAdd(`presence:${uid}`, ws.socketId)
              await redis.set(`presence:${uid}:${ws.socketId}`, "1", {
                EX: 30,
              })

              sendJSON(ws, {
                type: "AUTH_SUCCESS",
              })

              broadCastToAll(wss, { type: "ONLINE", id: uid })
              console.log("connected and authenticated", decode.username)
            },
          )
        }
        if (message?.type === "MESSAGE_DELIVERED") {
          const senderId = message?.senderId
          const messageId = message?.messageId
          const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: { status: "DELIVERED" },
          })
          const data = {
            type: "MESSAGE_DELIVERED",
            conversationId: updatedMessage.conversationId,
            messageId: updatedMessage.id,
            status: updatedMessage.status,
            updatedMessage,
          }
          const senderSockets = userSockets.get(senderId)
          senderSockets?.forEach((socket) => sendJSON(socket, data))
        }
        if (message.type === "HEARTBEAT") {
          console.log("heartbeat")
          if (!ws.user || !ws.socketId) return
          await redis.expire(`presence:${ws.user.sub}:${ws.socketId}`, 30)
          return
        }
        if (message.type === "SYNC_PRESENCE") {
          const { receiverId, senderId } = message.payload
          const count = await redis.sCard(`presence:${receiverId}`)
          const isOnline = count > 0
          const senderSockets = userSockets.get(senderId)
          senderSockets?.forEach((ws) =>
            sendJSON(ws, {
              type: "SYNC_PRESENCE",
              payload: { count, isOnline, receiverId },
            }),
          )
        }
      } catch (err) {
        sendJSON(ws, {
          error: "Invalid JSON format",
        })
      }
    })
    ws.on("close", async () => {
      console.log("closing")

      const userId = ws.user?.sub
      const socketId = ws.socketId

      if (!userId || !socketId) {
        console.log("terminated")
        return
      }

      userSockets.get(userId)?.delete(ws)

      if (userSockets.get(userId)?.size === 0) {
        userSockets.delete(userId)
      }

      const key = `presence:${userId}`

      await redis.sRem(key, socketId)

      const count = await redis.sCard(key)

      if (count === 0) {
        await redis.del(key)
        broadCastToAll(wss, { type: "OFFLINE", id: userId })
      }

      console.log("terminated")
    })
    ws.on("error", console.error)
  })
  wss.on("close", () => clearInterval(interval))
  function pushNotification({ receiverId, payload }: pushNotificationArgs) {
    const receiver = userSockets.get(receiverId)
    if (!receiver) return
    receiver.forEach((rec) => sendJSON(rec, payload))
  }
  function sendMessageWS(receiverId: string, msg: any) {
    const receiver = userSockets.get(receiverId)
    const payload = {
      payload: msg,
      type: "MESSAGE",
      message: "someone send you message",
      conversationId: msg.conversationId,
    }
    receiver?.forEach((rec) => sendJSON(rec, payload))
  }
  function markMessageReadWS(senderId: string, conversationId: string) {
    const senderSockets = userSockets.get(senderId)
    const payload = {
      type: "MESSAGE_READ",
      conversationId,
      senderId,
    }
    senderSockets?.forEach((socket) => sendJSON(socket, payload))
  }
  return { pushNotification, sendMessageWS, markMessageReadWS }
}
