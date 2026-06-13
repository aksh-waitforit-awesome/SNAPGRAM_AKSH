import { useEffect, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavLink } from "react-router-dom"
import { useSearchUser } from "@/react-query/QueryAndMutation"
import FollowButton from "./FollowButton"
import DMButton from "./DMButton"
import type { Profile } from "@/schema/profile.schema"
const SearchUsers = () => {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)

    return () => clearTimeout(timer)
  }, [search])

  const { data, isPending } = useSearchUser(debouncedSearch)

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-500" />

        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            h-12
            rounded-2xl
            border-zinc-800
            bg-zinc-950
            pl-11
            text-sm
            text-white
            placeholder:text-zinc-500
            focus-visible:ring-1
            focus-visible:ring-zinc-700
          "
        />
      </div>

      {/* Dropdown */}
      {search && (
        <div
          className="
            absolute
            z-50
            mt-3
            w-full
            overflow-hidden
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950/95
            shadow-2xl
            backdrop-blur
          "
        >
          {/* Loading */}
          {isPending && (
            <div className="p-4 text-sm text-zinc-400">Searching users...</div>
          )}

          {/* Empty */}
          {!isPending && data?.users.length === 0 && (
            <div className="p-4 text-sm text-zinc-400">No users found</div>
          )}

          {/* Users */}
          <div className="max-h-87.5 overflow-y-auto">
            {data?.users?.map((user: Profile) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border-b border-zinc-900 w-full hover:bg-zinc-900 transition-colors"
              >
                <NavLink
                  to={`/profile/${user.id}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <Avatar className="h-11 w-11 border border-zinc-800">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="bg-zinc-800 text-white">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                    <h2 className="text-sm font-medium text-white">
                      {user.username}
                    </h2>

                    <p className="text-xs text-zinc-500">@{user.username}</p>
                  </div>
                </NavLink>
                <div className="flex gap-2 items-center">
                  <DMButton userId={user.id} />
                  <FollowButton
                    userId={user.id}
                    followStatus={user.followStatus}
                    isPrivate={user.isPrivate}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default SearchUsers
