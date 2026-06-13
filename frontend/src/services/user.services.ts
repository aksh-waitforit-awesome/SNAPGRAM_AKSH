import API from "@/api/api"

interface Suggestions {
  id: string
  username: string
  avatar?: string | null
  bio?: string | null
}
interface getSuggestionsResponse {
  message: string
  suggestions: Suggestions[]
}
export const getSuggestions = async () => {
  const { data } = await API.get<getSuggestionsResponse>("/users/suggestions")
  return data
}

export const followUser = async (id: string) => {
  const { data } = await API.post(`/users/${id}/follow`)
  return data
}
export const acceptFollowRequest = async (followerId: string) => {
  const { data } = await API.patch(
    `/users/follow-requests/${followerId}/accept`,
  )
  return data
}
export const rejectFollowRequest = async (followerId: string) => {
  const { data } = await API.patch(
    `/users/follow-requests/${followerId}/reject`,
  )
  return data
}
