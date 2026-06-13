import { useQuery } from "@tanstack/react-query"
import { getReplies } from "@/services/comment.services"
import CommentItem from "./CommentItem"

interface Props {
  commentId: string
  postId: string
}

export default function ReplyList({ commentId, postId }: Props) {
  const { data: replies } = useQuery({
    queryKey: ["replies", commentId],
    queryFn: () => getReplies(commentId),
  })

  if (!replies?.length) return null

  return (
    <div className="ml-10 mt-3 border-l border-zinc-800 pl-4 space-y-4">
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          queryKey={["replies", commentId]}
        />
      ))}
    </div>
  )
}
