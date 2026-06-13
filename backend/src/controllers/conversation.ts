import { Request, Response } from "express"
import asyncHandler from "../utils/asyncWrapper"
import { prisma } from "../lib/prisma"
import { NotFoundError, BadRequestError } from "../errors"
import { getCurrentUserId } from "../utils/getCurrentUserId"
import {
  targetIdParamsSchema,
  conversationIdParamsSchema,
} from "../schema/conversation.schema"
import { redis } from "../lib/redis"
import { getOnlineCount } from "../lib/presence"
export const sortConversationUsers = (userA: string, userB: string) => {
  return [userA, userB].sort() as [string, string]
}
export const createOrGetConversation = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req)
  const { id: targetId } = targetIdParamsSchema.parse(req.params)
  if (userId === targetId)
    throw new BadRequestError("cannot create conversation with yourself")

  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true },
  })

  if (!targetUser) throw new NotFoundError("target user not found")

  const [userOneId, userTwoId] = sortConversationUsers(userId, targetId)

  const existingConversation = await prisma.conversation.findUnique({
    where: {
      userOneId_userTwoId: {
        userOneId,
        userTwoId,
      },
    },
  })

  if (existingConversation) {
    return res.status(200).json({
      created: false,
      conversationId: existingConversation.id,
    })
  }

  const conversation = await prisma.conversation.create({
    data: {
      userOneId,
      userTwoId,
    },
  })

  return res.status(201).json({
    created: true,
    conversationId: conversation.id,
  })
})

export const findConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      include: {
        messages: true,
        userOne: true,
        userTwo: true,
        lastMessage: true,
      },
    })
    const formattedConversations = conversations.map((c) => {
      const receiver = c.userOneId === userId ? c.userTwo : c.userOne

      return {
        id: c.id,
        receiver: {
          id: receiver.id,
          username: receiver.username,
          avatarUrl: receiver.avatarUrl,
        },
        unread: c.messages.filter((message) => message.status !== "READ")
          .length,
        lastMessage: c.lastMessage,
      }
    })
    res.status(200).json({ conversations: formattedConversations })
  },
)
export const getConversationById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)
    const { id: conversationId } = conversationIdParamsSchema.parse(req.params)
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        userOne: true,
        userTwo: true,
        messages: true,
      },
    })
    const receiver =
      userId !== conversation?.userOneId
        ? conversation?.userOne
        : conversation?.userTwo
    const key = `presence:${receiver?.id}`
    const count = await getOnlineCount(key)
    const online = count > 0
    res.status(200).json({
      receiver: {
        id: receiver?.id,
        username: receiver?.username,
        avatarUrl: receiver?.avatarUrl,
      },
      conversationId: conversation?.id,
      messages: conversation?.messages,
      online
    })
  },
)
