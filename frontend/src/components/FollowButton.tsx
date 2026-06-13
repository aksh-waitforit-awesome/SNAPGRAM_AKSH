import { useFollowUser } from "@/react-query/QueryAndMutation"
import { type FollowStatus } from "@/schema/profile.schema"
type FollowButtonProps = {
  userId: string
  followStatus: FollowStatus
  isPrivate: boolean
}

const FollowButton = ({
  userId,
  followStatus,
  isPrivate,
}: FollowButtonProps) => {
  const { mutate: followUser, isPending } = useFollowUser()

  const handleFollow = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    followUser(userId)
  }

  if (followStatus === "ACCEPTED") {
    return (
      <span
        className="
          rounded-full
          border
          border-zinc-700
          px-3
          py-2
          text-xs
          font-medium
          text-zinc-300
        "
      >
        Following
      </span>
    )
  }

  if (followStatus === "PENDING") {
    return (
      <span
        className="
          rounded-full
          border
          border-yellow-700/50
          bg-yellow-500/10
          px-3
          py-2
          text-xs
          font-medium
          text-yellow-400
        "
      >
        Requested
      </span>
    )
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isPending}
      className="
        rounded-full
        bg-white
        px-4
        py-1.5
        text-xs
        font-semibold
        text-black
        transition-opacity
        hover:opacity-90
        disabled:opacity-50
      "
    >
      {isPending ? "Loading..." : isPrivate ? "Request" : "Follow"}
    </button>
  )
}

export default FollowButton
