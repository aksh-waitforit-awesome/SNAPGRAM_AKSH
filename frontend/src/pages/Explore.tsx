import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavLink } from "react-router-dom"
import { useSearchUser } from "@/react-query/QueryAndMutation"
import FollowButton from "@/components/FollowButton"
const ExplorePage = () => {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Delay search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  const { data, isPending, isError } = useSearchUser(debouncedSearch)

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Explore</h1>

          <p className="text-sm text-muted-foreground">
            Search and discover users
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading */}
        {isPending && (
          <p className="text-sm text-muted-foreground">Searching users...</p>
        )}

        {/* Error */}
        {isError && (
          <p className="text-sm text-red-500">Failed to load users</p>
        )}

        {/* Empty State */}
        {!isPending && data?.users?.length === 0 && debouncedSearch && (
          <p className="text-sm text-muted-foreground">No users found</p>
        )}

        {/* Users */}
        <div className="space-y-3">
          {data?.users?.map((user: any) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-xl border p-4 hover:bg-zinc-900 transition-colors"
            >
              <NavLink
                to={`/profile/${user.id}`}
                className="flex items-center gap-3 flex-1"
              >
                <Avatar>
                  <AvatarImage src={user.avatarUrl} />

                  <AvatarFallback>
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="font-medium">{user.username}</h2>

                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </NavLink>

              <FollowButton
                userId={user.id}
                followStatus={user.followStatus}
                isPrivate={user.isPrivate}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExplorePage
