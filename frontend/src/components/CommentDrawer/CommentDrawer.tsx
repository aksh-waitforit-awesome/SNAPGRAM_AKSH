import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { MessageSquare } from "lucide-react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getPostComments, createComment } from "@/services/comment.services"

import type { Comment } from "@/schema/comment.schema"

import CommentItem from "./CommentItem"
import CommentInput from "./CommentInput"

interface Props {
  postId: string
}

export default function CommentDrawer({ postId }: Props) {
  const queryClient = useQueryClient()

  const { data: comments = [], isPending } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getPostComments(postId),
  })

  const createMutation = useMutation({
    mutationFn: createComment,

    onSuccess: (newComment) => {
      queryClient.setQueryData<Comment[]>(["comments", postId], (old = []) => [
        newComment,
        ...old,
      ])
    },
  })

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="flex gap-2">
          <MessageSquare />
          {comments.length}
        </button>
      </DrawerTrigger>

      <DrawerContent className="h-[80vh] bg-zinc-950">
        <DrawerHeader>
          <DrawerTitle>Comments</DrawerTitle>
        </DrawerHeader>

        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {isPending ? (
              <p>Loading...</p>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={postId}
                    queryKey={["comments", postId]}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 p-4">
            <CommentInput
              onSubmit={(content) =>
                createMutation.mutateAsync({
                  content,
                  postId,
                  parentId: null,
                })
              }
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
