import { Outlet, Navigate } from "react-router-dom"
import { GalleryHorizontalEnd } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"

const AuthLayout = () => {
  const { isAuthenticated, accessToken } = useAuthStore()

  // Redirect authenticated users
  if (isAuthenticated && accessToken) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-black text-white">
      {/* Left Side */}
      <div className="flex flex-col px-4 sm:px-6 md:px-10 py-6">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center lg:justify-start">
          <div className="bg-violet-600 rounded-xl p-2 text-white">
            <GalleryHorizontalEnd size={28} />
          </div>

          <h2 className="text-2xl font-bold">Snapgram</h2>
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center">
          <Outlet />
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex items-center justify-end">
        <img
          src="/side-img.svg"
          alt="side-image"
          className="w-full max-w-xl h-auto object-contain"
        />
      </div>
    </div>
  )
}

export default AuthLayout
