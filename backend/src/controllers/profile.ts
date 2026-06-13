import { profileIdParamsSchema } from "./../schema/profile.schema"
import asyncHandler from "../utils/asyncWrapper"
import { prisma } from "../lib/prisma"
import { NotFoundError, UnauthorizedError } from "../errors"
import { supabase } from "../lib/supabase"
import { Request, Response } from "express"
import { isUserOnline } from "../lib/presence"
import { getCurrentUserId } from "../utils/getCurrentUserId"
import {
  searchUserQuerySchema,
  updateProfileAvatarInputSchema,
  updateProfileBioInputSchema,
} from "../schema/profile.schema"

export const updateProfileBio = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)
    const { bio } = updateProfileBioInputSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundError("user not found")
    user.bio = bio ? bio : user.bio
    const updateUser = await prisma.user.update({
      where: { id: userId },
      data: user,
    })
    res.status(200).json({ message: "profile bio updated", bio })
  },
)

export const updateProfileAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)
    const { avatarUrl, avatarPath } = updateProfileAvatarInputSchema.parse(
      req.body,
    )

    // get old avatar first
    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        avatarPath: true,
      },
    })

    // update user
    const user = await prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        avatarUrl,
        avatarPath,
      },
    })

    // delete old image
    if (existingUser?.avatarPath) {
      await supabase.storage.from("avatars").remove([existingUser.avatarPath])
    }

    res.status(200).json({
      success: true,
      avatarUrl: user.avatarUrl,
    })
  },
)
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)
    const { username } = searchUserQuerySchema.parse(req.query)
    const currentUser = req.user?.sub
    if (!username?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username query is required",
      })
    }
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: "insensitive",
        },
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        isPrivate: true,
        followers: {
          where: {
            followerId: currentUser,
          },
          select: {
            status: true,
          },
        },
      },
      take: 10,
    })
    const formattedUser = users.map((user) => {
      const { followers, ...rest } = user
      return { ...rest, followStatus: followers[0]?.status ?? null }
    })
    return res.status(200).json({
      success: true,
      count: users.length,
      users: formattedUser,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: "Failed to search users",
    })
  }
}

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { profileId } = profileIdParamsSchema.parse(req.params)
    const currentUserId = getCurrentUserId(req)

    const user = await prisma.user.findUnique({
      where: {
        id: profileId,
      },

      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        isPrivate: true,

        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },

        followers: currentUserId
          ? {
              where: {
                followerId: currentUserId,
              },

              select: {
                status: true,
              },
            }
          : false,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    const followStatus =
      Array.isArray(user.followers) && user.followers.length > 0
        ? user.followers[0].status
        : null

    let canViewPosts = false

    // public profile
    if (!user.isPrivate) {
      canViewPosts = true
    }

    // own profile
    if (currentUserId === user.id) {
      canViewPosts = true
    }

    // accepted follower
    if (user.isPrivate && followStatus === "ACCEPTED") {
      canViewPosts = true
    }

    const posts = canViewPosts
      ? await prisma.post.findMany({
          where: {
            authorId: user.id,
          },

          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            mediaUrl: true,
            caption: true,
            createdAt: true,
          },
        })
      : []
    const isOnline = await isUserOnline(user.id)
    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: currentUserId === user.id ? user.email : undefined,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isPrivate: user.isPrivate,

      followStatus,

      _count: user._count,

      canViewPosts,

      posts,
      isOnline,
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      message: "Failed to fetch profile",
    })
  }
}

export const togglePrivacy = asyncHandler(
  async (req: Request, res: Response) => {
    let isPrivate
    const userId = getCurrentUserId(req)
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPrivate: true },
    })
    if (!user) throw new UnauthorizedError("invalid token")
    isPrivate = !user?.isPrivate
    const updateUser = await prisma.user.update({
      where: { id: userId },
      data: { ...user, isPrivate },
      select: {
        isPrivate: true,
      },
    })
    const message = updateUser?.isPrivate
      ? "you account is private now"
      : "your account is public now"
    res.status(200).json({ message, isPrivate: updateUser.isPrivate })
  },
)
