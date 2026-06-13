import ConversationSidebar from "@/components/ConversationSidebar"
import EmptyConversation from "@/components/EmptyConversation"

const MessagesIndex = () => {
  return (
    <div className="h-full flex">
      {/* hidden on mobile */}
      <div className="hidden md:block w-[340px] border-r border-zinc-800">
        <ConversationSidebar />
      </div>

      <div className="flex-1 hidden md:block">
        <EmptyConversation />
      </div>

      {/* mobile */}
      <div className="md:hidden w-full">
        <ConversationSidebar />
      </div>
    </div>
  )
}

export default MessagesIndex
