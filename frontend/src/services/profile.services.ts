import API from "@/api/api"

import {
  type searchProfileResponse,
  type UserProfileResponse,
  type togglePrivacyResponse,
  type UpdateBioResponse,
} from "../schema/profile.schema"

export const updateProfileBio = async (
  bio: string,
): Promise<UpdateBioResponse> => {
  const { data } = await API.put<UpdateBioResponse>("profile/update/bio", {
    bio,
  })
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
  console.log()
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
