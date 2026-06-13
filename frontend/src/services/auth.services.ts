import API from "../api/api"
import {
  type LoginFormData,
  type RegisterFormData,
} from "../schema/auth.schema"
import { type User } from "@/store/useAuthStore"
export interface RegisterResponse {
  message: string
  user: Omit<User, "bio" | "avatarUrl">
}

export interface LoginResponse {
  message: string
  accessToken: string
  user: User
}
export const registerUser = async (userData: RegisterFormData) => {
  const { data } = await API.post<RegisterResponse>("/auth/register", userData)
  return data
}
export const loginUser = async (userData: LoginFormData) => {
  const { data } = await API.post<LoginResponse>("/auth/login", userData)
  return data
}
export const logoutUser = async () => {
  return API.post("/auth/logout")
}
