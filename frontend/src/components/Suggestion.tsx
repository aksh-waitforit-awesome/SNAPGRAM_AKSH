import { useGetSuggestions } from "@/react-query/QueryAndMutation"
import { Card } from "./ui/card"
import { Skeleton } from "./ui/skeleton"

import FollowButton from "./FollowButton"
import { NavLink } from "react-router-dom"

const Suggestion = () => {
  const { data, isPending } = useGetSuggestions()

  if (isPending) {
    return (
      <Card className="p-4 space-y-4">
        <Skeleton className="h-6 w-40" />

        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>

            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </Card>
    )
  }

  return (
    <Card className="bg-transparent border-none shadow-none space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Suggested for you</h2>

        <p className="text-sm text-muted-foreground">
          Discover people to follow
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data?.suggestions?.map((user: any) => (
          <div
            key={user.id}
            className="
            rounded-2xl
            border
            border-neutral-800
            bg-[#111111]
            p-3
            flex
            flex-col
            items-center
            text-center
            gap-2
            
          "
          >
            <NavLink
              className="flex flex-col items-center   hover:bg-zinc-900"
              to={`/profile/${user.id}`}
            >
              <img
                src={
                  user.avatarUrl ||
                  "https://ui-avatars.com/api/?name=" + user.username
                }
                alt={user.username}
                className="h-16 w-16 rounded-full object-cover"
              />

              <div>
                <p className="text-sm font-medium line-clamp-1">
                  {user.username}
                </p>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {user.bio || "Suggested for you"}
                </p>
              </div>
            </NavLink>

            <FollowButton
              userId={user.id}
              followStatus={null}
              isPrivate={user.isPrivate}
            />
          </div>
        ))}
      </div>
    </Card>
  )
}

export default Suggestion
