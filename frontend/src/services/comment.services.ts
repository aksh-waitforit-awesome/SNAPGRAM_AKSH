import API from "@/api/api"

import {
  CreateCommentReqSchema,
  CreateCommentResSchema,
  GetCommentRepliesResSchema,
  GetPostCommentResSchema,
  CommentToggleLikeResSchema,
  type Comment,
  type CreateCommentReq,
  type CommentToggleLikeRes,
} from "@/schema/comment.schema"

export async function getPostComments(postId: string): Promise<Comment[]> {
  const { data } = await API.get(`/comment/post/${postId}`)

  const parsed = GetPostCommentResSchema.parse(data)

  return parsed.comments
}

export async function getReplies(commentId: string): Promise<Comment[]> {
  const { data } = await API.get(`/comment/replies/${commentId}`)

  const parsed = GetCommentRepliesResSchema.parse(data)

  return parsed.replies
}

export async function deleteComment(commentId: string): Promise<void> {
  await API.delete(`/comment/${commentId}`)
}

export async function toggleCommentLike(
  commentId: string,
): Promise<CommentToggleLikeRes> {
  const { data } = await API.put(`/comment/like/${commentId}`)

  return CommentToggleLikeResSchema.parse(data)
}

export async function createComment(input: CreateCommentReq): Promise<Comment> {
  
  const payload = CreateCommentReqSchema.parse(input)
  
  const { data } = await API.post("/comment", payload)
  console.log("received data", data)
  const parsed = CreateCommentResSchema.parse(data)
  console.log("parse data", parsed)
  return parsed.comment
}
