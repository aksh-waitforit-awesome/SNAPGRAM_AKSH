import { Outlet } from "react-router-dom"

import AppSidebar from "@/components/AppSidebar"
import AppFootbar from "@/components/AppFootbar"
import AppNavbar from "@/components/AppNavbar"
import Suggestion from "@/components/Suggestion"

const MainLayout = () => {
  return (
    // 1. Force the main container to exactly fit the screen height and hide page-level scrolling
    <main className="h-screen w-full bg-[#09090B] text-white overflow-hidden flex flex-col">
      <div className="flex flex-1 min-h-0 w-full relative">
        {/* Pinned Desktop Sidebar */}
        <AppSidebar />

        {/* Scrollable Main Content Frame */}
        <div className="flex flex-1 min-w-0 max-w-full">
          {/* 2. Added h-full and overflow-y-auto so ONLY this section scrolls */}
          <div className="flex flex-1 flex-col min-w-0 max-w-full h-full overflow-y-auto">
            <AppNavbar />

            <div className="flex-1 pb-24 w-full max-w-full">
              <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-8 sm:py-8">
                <Outlet />
              </div>
            </div>
          </div>

          {/* Pinned Right Sidebar */}
          <aside className="hidden lg:block w-[320px] shrink-0 border-l border-zinc-800 p-4 h-full overflow-y-auto">
            <div className="sticky top-4">
              <Suggestion />
            </div>
          </aside>
        </div>
      </div>

      {/* Footbar sits nicely underneath or stays absolute depending on your mobile styling */}
      <AppFootbar />
    </main>
  )
}

export default MainLayout
