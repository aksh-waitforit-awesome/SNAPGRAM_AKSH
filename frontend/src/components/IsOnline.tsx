import usePresenceStore from "@/store/usePresenceStore"
import { useSocket } from "@/context/socket"
import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
interface isOnlineProps {
  id: string
}
const IsOnline = ({ id }: isOnlineProps) => {
  const { socket } = useSocket()
  const senderId = useAuthStore((state) => state.user?.id)
  const onlineUsers = usePresenceStore((state) => state.onlineUsers)
  useEffect(() => {
    socket?.send(
      JSON.stringify({
        type: "PRESENCE_SYNC",
        payload: { receiverId: id, senderId },
      }),
    )
  }, [])
  return (
    <>
      {onlineUsers.has(id) ? (
        <p className="text-green-500">online</p>
      ) : (
        <p className="text-red-500">offline</p>
      )}
    </>
  )
}

export default IsOnline
