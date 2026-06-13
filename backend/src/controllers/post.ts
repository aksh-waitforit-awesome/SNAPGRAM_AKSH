import { Like, Notification } from "./../generated/prisma/client"
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../errors"
import { publishNotification } from "../events/notificationPublisher"
import { prisma } from "../lib/prisma"
import asyncHandler from "../utils/asyncWrapper"
import { Request, Response } from "express"
import { getCurrentUserId } from "../utils/getCurrentUserId"
import {
  createPostInputSchema,
  postIdParamSchema,
  updatePostInputSchema,
} from "../schema/post.schema"

// ---------------- CREATE POST -------------- //

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req)
  if (!userId) throw new UnauthorizedError("invalid token")
  const { caption, mediaUrl } = createPostInputSchema.parse(req.body)
  const post = await prisma.post.create({
    data: {
      caption,
      mediaUrl,
      mediaType: "IMAGE",
      authorId: userId,
    },
  })
  res.status(201).json({ message: "Post created successfully", post })
})
// ----------------- GET USER FEED ------------------
export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req)
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      mediaUrl: true,
      mediaType: true,
      caption: true,
      createdAt: true,
      authorId: true,
      author: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
      // Total likes/comments count
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },

      // Check if current user liked this post
      likes: {
        where: {
          userId,
        },
        select: {
          userId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  const formattedPosts = posts.map((post) => ({
    id: post.id,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    caption: post.caption,
    createdAt: post.createdAt,
    authorId: post.authorId,

    author: post.author,

    likesCount: post._count.likes,
    commentsCount: post._count.comments,

    // true if user already liked post
    isLiked: post.likes.length > 0,
  }))

  res.status(200).json({
    posts: formattedPosts,
  })
})
// ----------------- GET POST BY ID ------------------- //
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = postIdParamSchema.parse(req.params)
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new NotFoundError("Post not found")

  res.status(200).json({ post })
})
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req)
  const { postId } = postIdParamSchema.parse(req.params)

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new NotFoundError("Post not found")

  if (post.authorId !== userId)
    throw new ConflictError("You are not authorized to delete this post")

  await prisma.post.delete({ where: { id: postId } })
  res.status(200).json({ message: "Post deleted successfully" })
})

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req)
  const { postId } = postIdParamSchema.parse(req.params)

  const { caption, mediaUrl } = updatePostInputSchema.parse(req.body)
  if (!caption || mediaUrl)
    throw new BadRequestError("no field provided for updating post")
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new NotFoundError("Post not found")
  if (post.authorId !== userId)
    throw new ConflictError("You are not authorized to update this post")

  post.caption = caption ?? post.caption
  post.mediaUrl = mediaUrl ?? post.mediaUrl
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: post,
  })
  res
    .status(200)
    .json({ message: "Post updated successfully", post: updatedPost })
})

export const toggleLike = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req)
  const username = req.user?.username
  const { postId } = postIdParamSchema.parse(req.params)
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
    },
  })

  if (!post) throw new BadRequestError("Post not found")

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  })

  // Unlike
  if (existingLike) {
    await prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    const likesCount = await prisma.like.count({
      where: { postId },
    })

    return res.status(200).json({
      success: true,
      postId,
      liked: false,
      likesCount,
      message: "Post unliked",
    })
  }

  // Like + Notification

  const notification = await prisma.$transaction(async (tx) => {
    await tx.like.create({
      data: {
        userId,
        postId,
      },
    })

    // Don't notify yourself
    if (post.authorId === userId) return null
    // Remove previous like notifications from same user
    await tx.notification.deleteMany({
      where: {
        type: "LIKE",
        senderId: userId,
        receiverId: post.authorId,
        postId,
      },
    })

    return await tx.notification.create({
      data: {
        type: "LIKE",
        message: `${username} liked your post`,
        senderId: userId,
        receiverId: post.authorId,
        postId,
      },
    })
  })

  const likesCount = await prisma.like.count({
    where: { postId },
  })

  if (notification) {
    await publishNotification({
      type: "NEW_NOTIFICATION",
      receiverId: post.authorId,
      notification,
      message: notification.message,
    })
  }

  return res.status(200).json({
    success: true,
    postId,
    liked: true,
    likesCount,
    message: "Post liked",
  })
})
