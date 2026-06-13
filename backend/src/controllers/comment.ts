import { prisma } from "../lib/prisma"
import { Request, Response } from "express"
import asyncHandler from "../utils/asyncWrapper"
import { NotFoundError, ForbiddenError } from "../errors"
import { commentIdParamSchema, createCommentSchema } from "../schema/comment.schema"
import { postIdParamSchema } from "../schema/post.schema"
import { getCurrentUserId } from "../utils/getCurrentUserId"

export const createComment = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)
    const { content, postId, parentId } = createCommentSchema.parse(req.body)
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
      },
    })

    if (!post) throw new NotFoundError("Post not found")

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment) throw new NotFoundError("Parent comment not found")
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        postId,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })
    const formattedComment = {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      authorId: comment.authorId,
      author: comment.author,
      content: comment.content,
      isLikedByCurrentUser: false,
      likesCount: 0,
      repliesCount: 0,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }
    res.status(201).json({
      success: true,
      comment: formattedComment,
    })
  },
)
export const getPostComments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)
    const { postId } = postIdParamSchema.parse(req.params)

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!post) throw new NotFoundError("Post not found")

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
        likes: {
          where: {
            userId,
          },
          select: {
            userId: true,
          },
        },
      },
    })
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      parentId: comment.parentId,
      authorId: comment.authorId,
      author: comment.author,
      likesCount: comment._count.likes,
      repliesCount: comment._count.replies,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isLikedByCurrentUser: comment.likes.length > 0,
    }))
    res.status(200).json({
      success: true,
      comments: formattedComments,
    })
  },
)

export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)
    const { commentId } = commentIdParamSchema.parse(req.params)
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) throw new NotFoundError("Comment not found")

    if (comment.authorId !== userId)
      throw new ForbiddenError("You can only delete your own comments")

    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    })

    res.status(200).json({
      success: true,
      message: "Comment deleted",
    })
  },
)
// toggle comment like
export const toggleCommentLike = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)
    const { commentId } = commentIdParamSchema.parse(req.params)
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })
    if (!comment) throw new NotFoundError("Comment not found")

    const existingCommentLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    })
    if (existingCommentLike) {
      await prisma.commentLike.delete({
        where: { userId_commentId: { userId, commentId } },
      })
      return res
        .status(200)
        .json({ message: "Comment unliked", action: "unliked", commentId })
    }
    const newCommentLike = await prisma.commentLike.create({
      data: {
        userId,
        commentId,
      },
    })
    res
      .status(200)
      .json({ message: "Comment liked", action: "liked", commentId })
  },
)
export const getCommentReplies = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)
    const { commentId } = commentIdParamSchema.parse(req.params)

    const replies = await prisma.comment.findMany({
      where: {
        parentId: commentId,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        likes: {
          where: {
            userId,
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
    })

    res.json({
      success: true,
      replies: replies.map((reply) => ({
        ...reply,
        likesCount: reply._count.likes,
        repliesCount: reply._count.replies,
        isLikedByCurrentUser: reply.likes.length > 0,
      })),
    })
  },
)
