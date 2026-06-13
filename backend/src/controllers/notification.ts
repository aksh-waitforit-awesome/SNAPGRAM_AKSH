import { Request, Response } from "express"
import { prisma } from "../lib/prisma"
import { StatusCodes } from "http-status-codes"
import asyncHandler from "../utils/asyncWrapper"
import { getCurrentUserId } from "../utils/getCurrentUserId"
export const getAllNotifications = async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req)

  const notifications = await prisma.notification.findMany({
    where: {
      receiverId: userId,
    },

    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  })

  const unreadCount = await prisma.notification.count({
    where: {
      receiverId: userId,
      isRead: false,
    },
  })

  res.status(StatusCodes.OK).json({
    success: true,
    unreadCount,
    total: notifications.length,
    notifications,
  })
}
export const getUnreadNotifications = async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req)

  const notifications = await prisma.notification.findMany({
    where: {
      receiverId: userId,
      isRead: false,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const unreadCount = await prisma.notification.count({
    where: {
      receiverId: userId,
      isRead: false,
    },
  })

  res.status(StatusCodes.OK).json({
    success: true,
    count: unreadCount,
    notifications,
  })
}
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
) => {
  const userId = getCurrentUserId(req)

  await prisma.notification.updateMany({
    where: {
      receiverId: userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })

  res.status(200).json({
    success: true,
    message: "Notifications marked as read",
  })
}
export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = getCurrentUserId(req)

    const unreadCount = await prisma.notification.count({
      where: {
        receiverId: currentUserId,
        isRead: false,
      },
    })
    res.status(200).json({ unreadCount })
  },
)
export async function markNotificationAsRead(req: Request, res: Response) {
  const receiverId = getCurrentUserId(req)
  await prisma.notification.updateMany({
    where: {
      receiverId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })
  res.status(200).json({ success: true })
}
