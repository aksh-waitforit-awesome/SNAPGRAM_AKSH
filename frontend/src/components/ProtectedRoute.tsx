import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { type ReactNode } from "react"

type ProtectedRouteProps = {
  children?: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }
  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
