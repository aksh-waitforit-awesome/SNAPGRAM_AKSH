export interface Profile {
  id: string
  username: string
  email: string
  isPrivate: boolean
  bio?: string
  avatarUrl?: string
  followStatus: FollowStatus
}
export type FollowStatus = "PENDING" | "ACCEPTED" | "REQUESTED" | null

export interface UserCounts {
  posts: number
  followers: number
  following: number
}

export interface ProfilePost {
  id: string
  mediaUrl: string
  caption: string
  createdAt: string // ISO Date String
}
export type UserProfileResponse = Profile & {
  _count: UserCounts
  canViewPosts: boolean
  posts: ProfilePost[]
  isOnline: boolean
}

export type searchProfileResponse = {
  success: boolean
  count: number
  users: Profile[]
}
export type togglePrivacyResponse = {
  message: string
  isPrivate: boolean
}
import API from "@/api/api"

import {
  type searchProfileResponse,
  type UserProfileResponse,
  type togglePrivacyResponse
} from "../schema/profile.schema"

export const updateProfileBio = async (bio: string) => {
  const { data } = await API.put("profile/update/bio", { bio })
  return data
}
export const updateProfileAvatar = async (avatarData: {
  avatarUrl: string
  avatarPath: string
}) => {
  const { data } = await API.put("profile/update/avatar", avatarData)
  return data
}
export async function searchUser(searchQuery: string) {
  const { data } = await API.get<searchProfileResponse>("/profile/search", {
    params: {
      username: searchQuery,
    },
  })
  console.log(data)
  return data
}
export const togglePrivacy = async () => {
  const { data } = await API.patch<togglePrivacyResponse>(
    "/profile/toggle/privacy",
  )
  return data
}
export const getUserById = async (id: string) => {
  const { data } = await API.get<UserProfileResponse>(`/profile/${id}`)
  return data
}

export const useGetUserById = (id: string) => {
  return useQuery({
    queryKey: ["GET_USER_BY_ID", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  })
}
export const useUpdateProfileBio = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: updateProfileBio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GET_USER_BY_ID", user?.id] })
    },
  })
}
export const useUpdateProfileAvatar = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: updateProfileAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GET_USER_BY_ID", user?.id] })
    },
  })
}

export const useSearchUser = (searchQuery: string) => {
  return useQuery({
    queryKey: ["search-users", searchQuery],
    queryFn: () => searchUser(searchQuery),
    enabled: !!searchQuery,
  })
}
import { useState } from "react"
import { useParams } from "react-router-dom"
import { useDropzone } from "react-dropzone"
import moment from "moment"
import { Camera, Loader2 } from "lucide-react"


import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"

import {
  useUpdateProfileAvatar,
  useUpdateProfileBio,
} from "@/react-query/QueryAndMutation"

import FollowButton from "@/components/FollowButton"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import PrivacyToggleButton from "@/components/PrivacyToggleButton"
import { useGetUserById } from "@/react-query/QueryAndMutation"

const Profile = () => {
  const { id = "" } = useParams()
  const { user } = useAuthStore()

  const { data, isPending, isError } = useGetUserById(id)

  const isOwnProfile = id === user?.id

  const [bio, setBio] = useState("")
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const { mutateAsync: updateProfileAvatar } = useUpdateProfileAvatar()

  const { mutateAsync: updateProfileBio } = useUpdateProfileBio()

  const onDrop = async (acceptedFiles: File[]) => {
    if (!isOwnProfile) return

    try {
      const file = acceptedFiles[0]
      if (!file) return

      setIsUploadingAvatar(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file)

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      await updateProfileAvatar({
        avatarUrl: publicUrl,
        avatarPath: fileName,
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    disabled: !isOwnProfile,
    accept: {
      "image/*": [],
    },
  })

  const handleUpdateBio = async () => {
    if (!bio.trim()) return

    await updateProfileBio(bio)
    setIsEditingBio(false)
  }

  if (isPending) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-8">
          <Skeleton className="h-32 w-32 rounded-full" />

          <div className="space-y-4 flex-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <p className="text-red-500">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-10 border-b border-zinc-800 pb-10">
        {/* Avatar */}
        <div
          {...(isOwnProfile ? getRootProps() : {})}
          className="relative w-fit mx-auto md:mx-0"
        >
          {isOwnProfile && <input {...getInputProps()} />}

          <Avatar className="h-36 w-36 border-4 border-zinc-800">
            <AvatarImage src={data.avatarUrl || ""} />

            <AvatarFallback className="text-4xl uppercase">
              {data.username?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {isOwnProfile && (
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center">
              {isUploadingAvatar ? (
                <Loader2 className="animate-spin text-white" />
              ) : (
                <Camera className="text-white" />
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-bold">{data.username}</h1>

            {isOwnProfile ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setBio(data.bio || "")
                  setIsEditingBio(true)
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <FollowButton
                userId={data.id}
                followStatus={data.followStatus}
                isPrivate={data.isPrivate}
              />
            )}
            {data.isOnline ? (
              <span className="text-green-300 text-sm rounded-md px-2  bg-green-800/[0.5]">
                online
              </span>
            ) : (
              <span className="text-red-300 text-sm rounded-md px-2  bg-red-800/[0.5]">
                offline
              </span>
            )}
          </div>
          {isOwnProfile && (
            <PrivacyToggleButton isPrivate={data?.isPrivate} id={data?.id} />
          )}
          <div className="flex gap-8">
            <div>
              <span className="font-bold">{data._count?.posts || 0}</span> posts
            </div>

            <div>
              <span className="font-bold">{data._count?.followers || 0}</span>{" "}
              followers
            </div>

            <div>
              <span className="font-bold">{data._count?.following || 0}</span>{" "}
              following
            </div>
          </div>

          {isOwnProfile && <p className="text-zinc-400">{data.email}</p>}

          {/* Bio */}
          {isOwnProfile && isEditingBio ? (
            <div className="flex gap-2">
              <Input value={bio} onChange={(e) => setBio(e.target.value)} />

              <Button
                className="bg-white text-black hover:bg-purple-700 hover:text-white"
                onClick={handleUpdateBio}
              >
                Save
              </Button>

              <Button
                variant="outline"
                className="bg-black hover:bg-red-400 hover:text-white"
                onClick={() => setIsEditingBio(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <p className="max-w-xl text-zinc-300">{data.bio || "No bio yet"}</p>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="mt-10">
        <h2 className="mb-6 text-xl font-semibold">Posts</h2>

        {data.posts?.length === 0 ? (
          <Card className="h-52 flex items-center justify-center">
            <p className="text-zinc-500">No posts yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.posts.map((post: any) => (
              <Card key={post.id} className="overflow-hidden group">
                <div className="relative">
                  <img
                    src={post.mediaUrl}
                    alt=""
                    className="
                      w-full
                      aspect-square
                      object-cover
                      transition-transform
                      duration-300
                      group-hover:scale-105
                    "
                  />

                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                    {moment(post.createdAt).fromNow()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile

import { Button } from "@/components/ui/button"
import { Loader2, Lock, Globe } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { togglePrivacy } from "@/services/profile.services"
import toast from "react-hot-toast"
interface PrivacyToggleButtonProps {
  isPrivate: boolean
  id: string
}

const PrivacyToggleButton = ({ isPrivate, id }: PrivacyToggleButtonProps) => {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: () => togglePrivacy(),
    onSuccess: (data) => {
      queryClient.setQueryData(["GET_USER_BY_ID", id], (prevData: any) => {
        return {
          ...prevData,
          isPrivate: data.isPrivate,
        }
      })
    },
    onError: () => {
      toast.error("Some thing went wrong try again")
    },
  })

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => mutate()}
      className="gap-2 bg-indigo-500 "
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPrivate ? (
        <Lock className="h-4 w-4" />
      ) : (
        <Globe className="h-4 w-4" />
      )}

      {isPrivate ? "Private Account" : "Public Account"}
    </Button>
  )
}

export default PrivacyToggleButton

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

import { useEffect, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavLink } from "react-router-dom"
import { useSearchUser } from "@/react-query/QueryAndMutation"
import FollowButton from "./FollowButton"
import DMButton from "./DMButton"
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
            {data?.users?.map((user: any) => (
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
import { useState } from "react"
import { useParams } from "react-router-dom"
import { useDropzone } from "react-dropzone"
import moment from "moment"
import { Camera, Loader2 } from "lucide-react"


import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"

import {
  useUpdateProfileAvatar,
  useUpdateProfileBio,
} from "@/react-query/QueryAndMutation"

import FollowButton from "@/components/FollowButton"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import PrivacyToggleButton from "@/components/PrivacyToggleButton"
import { useGetUserById } from "@/react-query/QueryAndMutation"

const Profile = () => {
  const { id = "" } = useParams()
  const { user } = useAuthStore()

  const { data, isPending, isError } = useGetUserById(id)

  const isOwnProfile = id === user?.id

  const [bio, setBio] = useState("")
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const { mutateAsync: updateProfileAvatar } = useUpdateProfileAvatar()

  const { mutateAsync: updateProfileBio } = useUpdateProfileBio()

  const onDrop = async (acceptedFiles: File[]) => {
    if (!isOwnProfile) return

    try {
      const file = acceptedFiles[0]
      if (!file) return

      setIsUploadingAvatar(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file)

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      await updateProfileAvatar({
        avatarUrl: publicUrl,
        avatarPath: fileName,
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    disabled: !isOwnProfile,
    accept: {
      "image/*": [],
    },
  })

  const handleUpdateBio = async () => {
    if (!bio.trim()) return

    await updateProfileBio(bio)
    setIsEditingBio(false)
  }

  if (isPending) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-8">
          <Skeleton className="h-32 w-32 rounded-full" />

          <div className="space-y-4 flex-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <p className="text-red-500">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-10 border-b border-zinc-800 pb-10">
        {/* Avatar */}
        <div
          {...(isOwnProfile ? getRootProps() : {})}
          className="relative w-fit mx-auto md:mx-0"
        >
          {isOwnProfile && <input {...getInputProps()} />}

          <Avatar className="h-36 w-36 border-4 border-zinc-800">
            <AvatarImage src={data.avatarUrl || ""} />

            <AvatarFallback className="text-4xl uppercase">
              {data.username?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {isOwnProfile && (
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center">
              {isUploadingAvatar ? (
                <Loader2 className="animate-spin text-white" />
              ) : (
                <Camera className="text-white" />
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-bold">{data.username}</h1>

            {isOwnProfile ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setBio(data.bio || "")
                  setIsEditingBio(true)
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <FollowButton
                userId={data.id}
                followStatus={data.followStatus}
                isPrivate={data.isPrivate}
              />
            )}
            {data.isOnline ? (
              <span className="text-green-300 text-sm rounded-md px-2  bg-green-800/[0.5]">
                online
              </span>
            ) : (
              <span className="text-red-300 text-sm rounded-md px-2  bg-red-800/[0.5]">
                offline
              </span>
            )}
          </div>
          {isOwnProfile && (
            <PrivacyToggleButton isPrivate={data?.isPrivate} id={data?.id} />
          )}
          <div className="flex gap-8">
            <div>
              <span className="font-bold">{data._count?.posts || 0}</span> posts
            </div>

            <div>
              <span className="font-bold">{data._count?.followers || 0}</span>{" "}
              followers
            </div>

            <div>
              <span className="font-bold">{data._count?.following || 0}</span>{" "}
              following
            </div>
          </div>

          {isOwnProfile && <p className="text-zinc-400">{data.email}</p>}

          {/* Bio */}
          {isOwnProfile && isEditingBio ? (
            <div className="flex gap-2">
              <Input value={bio} onChange={(e) => setBio(e.target.value)} />

              <Button
                className="bg-white text-black hover:bg-purple-700 hover:text-white"
                onClick={handleUpdateBio}
              >
                Save
              </Button>

              <Button
                variant="outline"
                className="bg-black hover:bg-red-400 hover:text-white"
                onClick={() => setIsEditingBio(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <p className="max-w-xl text-zinc-300">{data.bio || "No bio yet"}</p>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="mt-10">
        <h2 className="mb-6 text-xl font-semibold">Posts</h2>

        {data.posts?.length === 0 ? (
          <Card className="h-52 flex items-center justify-center">
            <p className="text-zinc-500">No posts yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.posts.map((post: any) => (
              <Card key={post.id} className="overflow-hidden group">
                <div className="relative">
                  <img
                    src={post.mediaUrl}
                    alt=""
                    className="
                      w-full
                      aspect-square
                      object-cover
                      transition-transform
                      duration-300
                      group-hover:scale-105
                    "
                  />

                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                    {moment(post.createdAt).fromNow()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
