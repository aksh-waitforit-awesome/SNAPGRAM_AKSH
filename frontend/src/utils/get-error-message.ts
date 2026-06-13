import axios from "axios"
interface ApiErrorResponse {
  message: string
}
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.message || error.message || "Failed to register"
    )
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Unknown Error"
}
