import API from "@/api/api"
import { type Posts, type Post } from "@/schema/post.schema"

export const getFeed = async () => {
  const { data } = await API.get<Posts>("/posts")
  console.log("GET /posts =>", data)

  return data
}
interface createPostPayload {
  caption: string
  mediaUrl: string
}
interface createPostResponse {
  message: string
  post: Post
}
export const createPost = async (postData: createPostPayload) => {
  const { data } = await API.post<createPostResponse>("posts", postData)
  return data
}
export const toggleLike = async (postId: string) => {
  const { data } = await API.post(`posts/liked/${postId}`)
  return data
}
