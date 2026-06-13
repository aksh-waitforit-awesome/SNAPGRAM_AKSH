import { footbarNavlinks } from "@/constant"
import { NavLink, useLocation } from "react-router-dom"

const AppFootbar = () => {
  const location = useLocation()

  return (
    <div className="h-16 fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur-xl sm:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {footbarNavlinks.map((link) => {
          const isActive = location.pathname === link.to

          const Icon = link.icon

          return (
            <NavLink
              key={link.text}
              to={link.to}
              className={`flex flex-1 flex-col items-center justify-center rounded-xl py-2 transition-all duration-200 ${
                isActive
                  ? "bg-violet-500/20 text-violet-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />

              <span className="mt-1 text-xs font-medium">{link.text}</span>
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}

export default AppFootbar
