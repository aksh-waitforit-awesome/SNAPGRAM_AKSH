import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { loginUser, logoutUser, registerUser } from "../services/auth.services"
import { useNavigate } from "react-router-dom"
import { getErrorMessage } from "@/utils/get-error-message"
import { useAuthStore } from "@/store/useAuthStore"
import { createPost, getFeed, toggleLike } from "@/services/post.services"
import {
  updateProfileAvatar,
  updateProfileBio,
  searchUser,
  getUserById,
} from "@/services/profile.services"
import { type Posts, type Post } from "@/schema/post.schema"
import {
  acceptFollowRequest,
  getSuggestions,
  rejectFollowRequest,
} from "@/services/user.services"
import { followUser } from "@/services/user.services"
import { getNotification } from "@/services/notification.services"
import { toast } from "react-hot-toast"
import type { UserProfileResponse } from "@/schema/profile.schema"
export const useRegister = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      toast.success("Account Created")
      navigate("/auth/login")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: loginUser,
    onSuccess: ({ accessToken, user }) => {
      setAuth(accessToken, user)
      toast.success("login successful")
      navigate("/")
    },
    onError: (error) => {
      console.log("Login error:", error)
      const message = getErrorMessage(error)
      toast.error(message)
    },
  })
}
export const useLogoutUser = () => {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      clearAuth()
      navigate("/auth/login")
    },
  })
}

export const useGetUserById = (id: string) => {
  return useQuery({
    queryKey: ["GET_USER_BY_ID", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  })
}
export const useGetFeed = () => {
  return useQuery<Post[]>({ queryKey: ["Feed"], queryFn: getFeed })
}

export const useCreatePost = () => {
  return useMutation({
    mutationFn: createPost,
  })
}
export const useToggleLike = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleLike,

    onSuccess: (data) => {
      queryClient.setQueryData(["Feed"], (prevData: { posts: Posts }) => {
        console.log(prevData)
        if (!prevData) return prevData

        return {
          ...prevData,
          posts: prevData?.posts.map((post) => {
            if (post.id !== data.postId) {
              return post
            }

            return {
              ...post,

              isLiked: data.liked,

              likesCount: data.liked
                ? post.likesCount + 1
                : post.likesCount - 1,
            }
          }),
        }
      })
    },
  })
}

export const useUpdateProfileBio = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: updateProfileBio,
    onMutate: (newBio: string) => {
      const queryKey = ["GET_USER_BY_ID", user?.id]
      const previousProfile =
        queryClient.getQueryData<UserProfileResponse>(queryKey)
      queryClient.setQueryData<UserProfileResponse>(queryKey, (oldProfile) => {
        return oldProfile
          ? {
              ...oldProfile,
              bio: newBio,
            }
          : oldProfile
      })
      return { previousProfile }
    },
    onError: (_error, _newBio, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ["GET_USER_BY_ID", user?.id],
          context.previousProfile,
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["GET_USER_BY_ID", user?.id],
      })
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
export const useGetSuggestions = () => {
  return useQuery({
    queryKey: ["Suggestions"],
    queryFn: getSuggestions,
  })
}
export const useGetNotification = () => {
  return useQuery({
    queryKey: ["Notifications"],
    queryFn: getNotification,
  })
}

export const useFollowUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: followUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["search-users"])
      queryClient.invalidateQueries(["Suggestions"])
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

export const useAcceptFollowRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptFollowRequest,
    onSuccess: () => {
      queryClient.invalidateQueries([
        "Notifications",
        "unread_notification_count",
      ])
    },
  })
}

export const useRejectFollowRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rejectFollowRequest,
    onSuccess: () => {
      queryClient.invalidateQueries([
        "Notifications",
        "unread_notification_count",
      ])
    },
  })
}
