import { useAuthStore } from "@/store/useAuthStore"
import { GalleryHorizontalEnd, LogOut } from "lucide-react"

import { useLogoutUser } from "@/react-query/QueryAndMutation"
import { useSocket } from "@/context/socket"
import { NavLink } from "react-router-dom"

const AppNavbar = () => {
  const  user  = useAuthStore((state)=>state.user)

  const { status } = useSocket()

  const { mutateAsync: logout } = useLogoutUser()

  const avatarUrl = user?.avatarUrl || "/default-avatar.png"

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl sm:hidden">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-violet-600 p-2 text-white shadow-lg shadow-violet-600/30">
          <GalleryHorizontalEnd size={22} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Snapgram</h2>

          <p className="text-xs text-gray-400">{status}</p>
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{user?.username}</p>

          <p className="text-xs text-gray-400">@{user?.username}</p>
        </div>
        <NavLink
          to={`/profile/${user?.id}`}
          className="ring-2 ring-violet-500/30 rounded-full hover:ring-violet-500 transition"
        >
          <img
            src={avatarUrl}
            alt="avatar"
            className="h-10 w-10 rounded-full border-2 border-violet-500 object-cover"
          />
        </NavLink>

        <button
          onClick={() => logout()}
          className="rounded-xl border border-red-500/30 p-2 text-red-400 transition hover:bg-red-500 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

export default AppNavbar
