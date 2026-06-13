import { Routes, Route } from "react-router-dom"
import LoginForm from "@/form/LoginForm"
import RegisterForm from "@/form/RegisterForm"
import AuthLayout from "@/layout/AuthLayout"
import ProtectedRoute from "@/components/ProtectedRoute"
import MainLayout from "@/layout/MainLayout"
import { useAuthStore } from "./store/useAuthStore"
import Home from "@/pages/Home"
import NewPost from "./pages/NewPost"
import Notification from "./pages/Notification"
import { useEffect } from "react"
import API from "./api/api"
import { useState } from "react"
import { SocketProvider } from "./context/socket"
import FullPageSpinner from "./components/FullPageSpinner"
import ExplorePage from "./pages/Explore"
import Profile from "./pages/Profile"
import { Toaster } from "react-hot-toast"
import MessageLayout from "./layout/MessageLayout"
import ConversationSidebar from "./components/ConversationSidebar"
import MessagesIndex from "./components/MessageIndex"
import ConversationPage from "./pages/ConversationPage"
import StoryCreator from "./pages/StoryCreator"

function App() {
  const [isBootStrapped, setIsBootStrapped] = useState(false)
  const { setAuth, clearAuth } = useAuthStore()
  async function InitialBootup() {
    console.log("BOOTUP START")

    try {
      const { data } = await API.get("auth/refresh")
      console.log(data)
      setAuth(data?.accessToken, data?.user)
    } catch (err) {
      clearAuth()
      try {
        await API.post("/auth/logout")
      } catch (err) {}
    } finally {
      setIsBootStrapped(true)
    }
  }

  useEffect(() => {
    InitialBootup()
  }, [])
  if (!isBootStrapped) {
    return <FullPageSpinner />
  }
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <SocketProvider></SocketProvider>
            </ProtectedRoute>
          }
        >
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/notification" element={<Notification />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/new-post" element={<NewPost />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="create-story" element={<StoryCreator />} />
          </Route>

          <Route path="messages" element={<MessageLayout />}>
            <Route index element={<MessagesIndex />} />
            <Route path=":conversationId" element={<ConversationPage />} />
          </Route>
          <Route path="/messages" element={<MessageLayout />}>
            <Route index element={<ConversationSidebar />} />

            <Route path=":conversationId" element={<ConversationPage />} />
          </Route>
        </Route>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginForm />} />
          <Route path="register" element={<RegisterForm />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
