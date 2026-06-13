import AppSidebar from "@/components/AppSidebar"
import AppFootbar from "@/components/AppFootbar"
import { Outlet } from "react-router-dom"
import AppNavbar from "@/components/AppNavbar"
import { useLocation } from "react-router-dom"
const MessageLayout = () => {
  const location = useLocation()
  const isConversation = location.pathname.startsWith("/messages/")
  return (
    <main className="h-dvh bg-zinc-950 text-white flex flex-col">
      {!isConversation && <AppNavbar />}
      <div className="flex flex-1 min-h-0">
        {/* Desktop App Sidebar */}
        <div className="hidden sm:block">
          <AppSidebar />
        </div>

        <section className="flex-1 overflow-hidden">
          <Outlet />
        </section>
      </div>

      {!isConversation && (
        <div className="sm:hidden">
          <AppFootbar />
        </div>
      )}
    </main>
  )
}

export default MessageLayout
