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
import type { ProfilePost } from "@/schema/profile.schema"

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
            {data.posts.map((post: ProfilePost) => (
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
