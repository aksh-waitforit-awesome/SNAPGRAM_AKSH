import { Conversation } from "./../generated/prisma/client"
import { Request, Response } from "express"
import asyncHandler from "../utils/asyncWrapper"
import { prisma } from "../lib/prisma"
import { ForbiddenError, NotFoundError } from "../errors"
import { getCurrentUserId } from "../utils/getCurrentUserId"
import { sendMessageInputSchema, markMessageSchema } from "../schema/message.schema"
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = getCurrentUserId(req)
  const { content, conversationId } = sendMessageInputSchema.parse(req.body)
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  })
  const receiverId =
    conversation?.userOneId !== senderId
      ? conversation?.userOneId
      : conversation?.userTwoId
  if (!conversation) throw new NotFoundError("Conversation not found")
  if (![conversation.userOneId, conversation.userTwoId].includes(senderId))
    throw new ForbiddenError("you are not an part of this Conversation")
  const message = await prisma.message.create({
    data: { conversationId, senderId, content },
  })
  await prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      lastMessageId: message.id,
    },
  })
  const sendMessageWS = res.app.locals?.sendMessageWS
  sendMessageWS(receiverId, message)

  res.status(201).json(message)
})
export const markMessagesAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)
    const { conversationId } = markMessageSchema.parse(req.body)     
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        userOneId: true,
        userTwoId: true,
      },
    })
    if (!conversation) throw new NotFoundError("conversation not found")
    const senderId =
      conversation.userOneId === userId
        ? conversation.userTwoId
        : conversation.userOneId
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId }, // Don't mark your own messages as read
        status: { not: "READ" },
      },
      data: { status: "READ" },
    })
    const markMessageReadWS = res.app.locals?.markMessageReadWS
    markMessageReadWS(senderId, conversationId)
    res.status(200).json({ success: true })
  },
)
