import { type Post } from "@/schema/post.schema"
import moment from "moment"
import { Heart, HeartOff, MessageSquare } from "lucide-react"
import { useToggleLike } from "../react-query/QueryAndMutation"
import CommentDrawer from "@/components/CommentDrawer/CommentDrawer"
const PostCard = (post: Post) => {
  const { mutateAsync: toggleLike } = useToggleLike()

  return (
    <div className="overflow-hidden bg-black shadow">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <img
          className="h-10 w-10 rounded-full object-cover"
          src={post?.author?.avatarUrl || "/default-avatar.png"}
          alt={post?.author?.username}
        />

        <div>
          <h2 className="text-sm font-medium">{post?.author?.username}</h2>

          <p className="text-xs text-muted-foreground">
            {moment(post.createdAt).fromNow()}
          </p>
        </div>
      </div>

      {/* Image */}
      <div className="aspect-square w-full overflow-hidden">
        <img
          className="h-full w-full object-cover"
          src={post?.mediaUrl}
          alt="post"
        />
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        <p className="text-sm">{post.caption}</p>

        {/* Actions */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => toggleLike(post.id)}
            className="flex items-center gap-2 text-sm"
          >
            {post.isLiked ? (
              <Heart className="h-5 w-5 fill-current" />
            ) : (
              <HeartOff className="h-5 w-5" />
            )}

            <span>{post.likesCount}</span>
          </button>

          <CommentDrawer postId={post.id} />
        </div>
      </div>
    </div>
  )
}

export default PostCard
