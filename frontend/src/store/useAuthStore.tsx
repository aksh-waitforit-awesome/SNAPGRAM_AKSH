import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface User {
  username: string
  email: string
  id: string
  bio?: string
  avatarUrl?: string
}
interface AuthData {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
}
interface AuthAction {
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  setAccessToken: (accessToken: string) => void
  setUser: (user: User) => void
}
export type AuthState = AuthData & AuthAction

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        console.log("SET AUTH CALLED")
        set({
          accessToken: token,
          user,
          isAuthenticated: true,
        })
      },

      clearAuth: () =>
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        }),

      setAccessToken: (accessToken) =>
        set({
          accessToken,
        }),

      setUser: (user) =>
        set({
          user,
        }),
    }),
    {
      name: "auth-storage",

      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
