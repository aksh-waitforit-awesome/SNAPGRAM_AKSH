import axios, {
  type InternalAxiosRequestConfig,
  type AxiosError,
  type AxiosRequestConfig,
} from "axios"
type RetryRequestConfig = AxiosRequestConfig & {
  _retry?: boolean
}
import { useAuthStore } from "@/store/useAuthStore"
const API_BASE_URL = "http://localhost:3000/api"
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})
API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)
export default API

type FailedQueueItem = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
let failedQueue: FailedQueueItem[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token!)
    }
  })
  failedQueue = []
}

API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // step 1 extract the original request
    const originalRequest = error.config as RetryRequestConfig
    // step 2 check if req fail with  401 status is not include in auth Route
    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/logout")
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      isAuthRoute
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            }
            return API(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        console.log("refreshing")
        const res = await axios.get(`${API_BASE_URL}/auth/refresh`, {
          withCredentials: true,
        })
        console.log("new refreshing token", res)
        if (res.status !== 200) throw new Error("Failed to refresh token")
        const accessToken = res.data.accessToken
        const user = res.data.user
        if (!accessToken || !user) throw new Error("Invalid refresh response")
        useAuthStore.getState().setAuth(accessToken, user)
        processQueue(null, res.data.accessToken)
        isRefreshing = false
        return API(originalRequest)
      } catch (err) {
        processQueue(new Error("Failed to refresh token"), null)
        isRefreshing = false
        return Promise.reject(err)
      }
    }
    // return error with rejected PrismaPromise
    return Promise.reject(error)
  },
)
