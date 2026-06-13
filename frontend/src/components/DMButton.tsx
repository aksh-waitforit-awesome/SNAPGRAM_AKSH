import { createOrGetConversation } from "@/services/conversation.services"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
type DMButtonProps = {
  userId: string
}
const DMButton = ({ userId }: DMButtonProps) => {
  const navigate = useNavigate()
  const { mutateAsync } = useMutation({
    mutationFn: createOrGetConversation,
    onSuccess: (conversationId) => navigate(`/messages/${conversationId}`),
  })
  return (
    <Button
      variant={"outline"}
      className="font-light text-sm bg-black text-zinc-300   border-zinc-600 rounded-xl hover:bg-purple-600 hover:text-white"
      onClick={() => mutateAsync(userId)}
    >
      message
    </Button>
  )
}

export default DMButton
