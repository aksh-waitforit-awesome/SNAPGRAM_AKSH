
import { Keys } from "./../generated/prisma/internal/prismaNamespace"
import {
  FollowRequestParamsSchema,
  FollowUserParams,
} from "./../schema/user.schema"
import { prisma } from "../lib/prisma"
import { Response, Request } from "express"
import asyncHandler from "../utils/asyncWrapper"
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/index"
import { publishNotification } from "../events/notificationPublisher"
import { getCurrentUserId } from "../utils/getCurrentUserId"
import { redis } from "../lib/redis"
export const suggestedUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = getCurrentUserId(req)
    const suggestions = await prisma.user.findMany({
      where: {
        id: {
          not: currentUserId,
        },

        followers: {
          none: {
            followerId: currentUserId,
          },
        },
      },

      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        isPrivate: true,
      },

      take: 5,
    })

    return res.status(200).json({
      success: true,
      suggestions,
    })
  },
)

export const followUser = asyncHandler(async (req: Request, res: Response) => {
  const followerId = getCurrentUserId(req)
  const { followingId } = FollowUserParams.parse(req.params)
  if (!followerId) {
    throw new UnauthorizedError("invalid jwt token")
  }
  const followingUser = await prisma.user.findUnique({
    where: { id: followingId },
  })

  if (!followingUser) {
    throw new NotFoundError("follow user not found")
  }
  const existingFollow = await prisma.follows.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  })
  if (existingFollow) {
    throw new BadRequestError(`you already follow ${followingUser.username}`)
  }
  const status = followingUser.isPrivate ? "PENDING" : "ACCEPTED"
  const newFollow = await prisma.follows.create({
    data: {
      followerId,
      followingId,
      status,
    },
  })
  const message = followingUser.isPrivate
    ? `${req.user?.username} requested to follow you`
    : `${req.user?.username} now is following you`
  const type = followingUser.isPrivate ? "FOLLOW_REQUEST" : "FOLLOW"
  const notification = await prisma.notification.create({
    data: {
      type: type,
      senderId: followerId,
      receiverId: followingId,
      message,
    },
  })

  await publishNotification({
    type: "NEW_NOTIFICATION",
    receiverId: followingId,
    message,
    notification,
  })
  return res.status(201).json({ message })
})

export const rejectFollowRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = getCurrentUserId(req)
    const { followerId } = FollowRequestParamsSchema.parse(req.params)
    await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: currentUserId!,
        },
      },
    })

    await prisma.notification.deleteMany({
      where: {
        senderId: followerId,
        receiverId: currentUserId,
        type: "FOLLOW_REQUEST",
      },
    })
    const notification = await prisma.notification.create({
      data: {
        type: "UNFOLLOW",
        message: `${req.user?.username} has rejected your request`,
        receiverId: followerId,
        senderId: currentUserId,
      },
    })
    await publishNotification({
      receiverId: followerId,
      message: notification.message,
      type: "NEW_NOTIFICATION",
      notification,
    })
    res.json({
      success: true,
      message: "Follow request rejected",
    })
  },
)

export const acceptFollowRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = getCurrentUserId(req)
    const { followerId } = FollowRequestParamsSchema.parse(req.params)

    const followRequest = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: currentUserId!,
        },
      },
    })

    if (!followRequest) {
      throw new NotFoundError("Follow request not found")
    }

    await prisma.follows.update({
      where: {
        followerId_followingId: {
          followerId,
          followingId: currentUserId!,
        },
      },
      data: {
        status: "ACCEPTED",
      },
    })

    await prisma.notification.deleteMany({
      where: {
        senderId: followerId,
        receiverId: currentUserId,
        type: "FOLLOW_REQUEST",
      },
    })

    const notification = await prisma.notification.create({
      data: {
        type: "FOLLOW",
        senderId: currentUserId!,
        receiverId: followerId,
        message: `${req.user?.username} accepted your follow request`,
      },
    })

    await publishNotification({
      type: "NEW_NOTIFICATION",
      message: notification?.message,
      receiverId: followerId,
      notification,
    })

    res.json({
      success: true,
      message: "Follow request accepted",
    })
  },
)


export const checkIsOnline = async (req: Request, res: Response) => {
  const { id } = req.params

  const count = Number(await redis.get(`presence:${id}`) ?? 0)

  res.status(200).json({
    count,
    isOnline: count > 0,
  })
}