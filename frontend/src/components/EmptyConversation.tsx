import { MessageCircleMore } from "lucide-react"

const EmptyConversation = () => {
  return (
    <div className="h-full flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center text-center max-w-sm px-6">
        <div className="p-6 rounded-full bg-zinc-900 border border-zinc-800">
          <MessageCircleMore className="size-12 text-zinc-400" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold text-white">
          Your Messages
        </h2>

        <p className="mt-2 text-zinc-400">
          Select a conversation from the sidebar to start chatting.
        </p>
      </div>
    </div>
  )
}

export default EmptyConversation