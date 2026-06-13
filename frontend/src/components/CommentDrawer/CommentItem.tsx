import moment from "moment"
import { useState } from "react"

import { Heart, HeartOff, Trash2 } from "lucide-react"

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query"

import {
  createComment,
  deleteComment,
  toggleCommentLike,
} from "@/services/comment.services"

import type { Comment } from "@/schema/comment.schema"

import CommentInput from "./CommentInput"
import ReplyList from "./ReplyList"

import { useAuthStore } from "@/store/useAuthStore"

interface Props {
  comment: Comment
  postId: string
  queryKey: QueryKey
}

export default function CommentItem({ comment, postId, queryKey }: Props) {
  const user = useAuthStore((s) => s.user)

  const queryClient = useQueryClient()

  const [showReplyInput, setShowReplyInput] = useState(false)

  const [showReplies, setShowReplies] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: deleteComment,

    onSuccess: (_, commentId) => {
      queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
        old.filter((comment) => comment.id !== commentId),
      )
    },
  })

  const likeMutation = useMutation({
    mutationFn: toggleCommentLike,

    onMutate: async (commentId) => {
      await queryClient.cancelQueries({
        queryKey,
      })

      const previous = queryClient.getQueryData<Comment[]>(queryKey)

      queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
        old.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                isLikedByCurrentUser: !comment.isLikedByCurrentUser,
                likesCount:
                  comment.likesCount + (comment.isLikedByCurrentUser ? -1 : 1),
              }
            : comment,
        ),
      )

      return { previous }
    },

    onError: (_, __, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
    },
  })

  const replyMutation = useMutation({
    mutationFn: createComment,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["replies", comment.id],
      })

      queryClient.invalidateQueries({
        queryKey: ["comments", postId],
      })
    },
  })

  return (
    <div>
      <div className="flex justify-between">
        <div className="flex gap-2">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-zinc-700" />
          )}

          <div>
            <p className="text-sm text-white">
              {comment.author.username}

              <span className="ml-2 text-xs text-zinc-400">
                {moment(comment.createdAt).fromNow()}
              </span>
            </p>

            <p className="text-white">{comment.content}</p>

            <div className="mt-2 flex gap-4 text-sm">
              <button
                className="text-zinc-400"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                Reply
              </button>

              {comment.repliesCount > 0 && (
                <button
                  className="text-zinc-400"
                  onClick={() => setShowReplies(!showReplies)}
                >
                  {showReplies
                    ? "Hide replies"
                    : `View replies (${comment.repliesCount})`}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ">
          <button
            onClick={() => likeMutation.mutate(comment.id)}
            className="flex  justify-center items-center gap-1 text-red-500"
          >
            {comment.isLikedByCurrentUser ? (
              <Heart className="fill-current text-red-500 hover:text-red-700" />
            ) : (
              <HeartOff className="text-red-500  hover:text-red-700" />
            )}

            <span className="text-sm font-medium mt-2">
              {comment.likesCount}
            </span>
          </button>

          {comment.author.id === user?.id && (
            <button onClick={() => deleteMutation.mutate(comment.id)}>
              <Trash2 className="text-red-500 hover:text-red-700" />
            </button>
          )}
        </div>
      </div>

      {showReplyInput && (
        <div className="ml-10 mt-3">
          <CommentInput
            placeholder="Write a reply..."
            onSubmit={(content) =>
              replyMutation.mutateAsync({
                content,
                postId,
                parentId: comment.id,
              })
            }
          />
        </div>
      )}

      {showReplies && <ReplyList postId={postId} commentId={comment.id} />}
    </div>
  )
}
