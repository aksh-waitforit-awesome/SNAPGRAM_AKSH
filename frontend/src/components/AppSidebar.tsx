import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  Bell,
  BellDot,
  ChevronLeft,
  ChevronRight,
  GalleryHorizontalEnd,
  LogOut,
} from "lucide-react"

import API from "@/api/api"
import { navLinks } from "@/constant"
import { useAuthStore } from "@/store/useAuthStore"
import { useLogoutUser } from "@/react-query/QueryAndMutation"

import { Button } from "./ui/button"
import { useQuery } from "@tanstack/react-query"

interface GetUnreadCountRes {
  unreadCount: number
}

const getUnreadCount = async () => {
  const { data } = await API.get<GetUnreadCountRes>(
    "/notification/unread-count",
  )

  return data.unreadCount
}

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(true)

  const { mutateAsync: logout } = useLogoutUser()

  const user = useAuthStore((state) => state.user)

  const { data: unreadCount } = useQuery({
    queryKey: ["unread_notification_count"],
    queryFn: getUnreadCount,
  })

  const avatarUrl = user?.avatarUrl || "/default-avatar.png"

  return (
    <aside
      className={`
    hidden
    h-full
    shrink-0
    border-r
    border-zinc-800
    bg-zinc-950
    transition-all
    duration-300
    sm:flex
    flex-col
    ${collapsed ? "w-18" : "w-70"}
  `}
    >
      {/* Header */}
      <div className="h-16 border-b border-zinc-800 flex items-center px-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 w-full"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
            <GalleryHorizontalEnd size={20} />
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 text-left">
                <h2 className="font-semibold text-white">Snapgram</h2>
                <p className="text-xs text-zinc-500">Social Platform</p>
              </div>

              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <div className="space-y-2 px-2">
          {navLinks.map((link) => {
            const Icon = link.icon

            return (
              <NavLink
                key={link.text}
                to={link.to}
                title={link.text}
                className={({ isActive }) =>
                  `
                  relative
                  flex
                  items-center
                  rounded-xl
                  transition-all
                  duration-200
                  ${collapsed ? "justify-center h-12" : "gap-3 px-4 py-3"}
                  ${
                    isActive
                      ? "bg-violet-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }
                `
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="font-medium">{link.text}</span>}
              </NavLink>
            )
          })}

          {/* Notifications */}
          <NavLink
            to="/notification"
            title="Notifications"
            className={({ isActive }) =>
              `
              relative
              flex
              items-center
              rounded-xl
              transition-all
              duration-200
              ${collapsed ? "justify-center h-12" : "gap-3 px-4 py-3"}
              ${
                isActive
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }
            `
            }
          >
            <div className="relative">
              {unreadCount ? (
                <BellDot className="h-5 w-5" />
              ) : (
                <Bell className="h-5 w-5" />
              )}

              {!!unreadCount && (
                <span
                  className="
                    absolute
                    -top-2
                    -right-2
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    px-1
                    text-[10px]
                    font-bold
                    text-white
                  "
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>

            {!collapsed && <span className="font-medium">Notifications</span>}
          </NavLink>
        </div>
      </nav>

      {/* User Info & Logout Button */}
      <div className="border-t border-zinc-800 p-3 space-y-2">
        <NavLink
          to={`/profile/${user?.id}`}
          title="View Profile"
          className={`
            flex
            items-center
            rounded-xl
            hover:bg-zinc-900
            transition-colors
            ${collapsed ? "justify-center p-2" : "gap-3 p-2"}
          `}
        >
          <img
            src={avatarUrl}
            alt={user?.username}
            className="h-10 w-10 rounded-full object-cover shrink-0"
          />

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.username}
              </p>
              <p className="truncate text-xs text-zinc-500">{user?.email}</p>
            </div>
          )}
        </NavLink>

        <Button
          onClick={() => logout()}
          variant="ghost"
          title="Logout"
          className={`
            w-full
            text-red-400
            hover:text-red-300
            hover:bg-red-500/10
            transition-all
            duration-200
            rounded-xl
            ${collapsed ? "justify-center h-12 p-0" : "justify-start gap-2 px-4 py-3"}
          `}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  )
}

export default AppSidebar
