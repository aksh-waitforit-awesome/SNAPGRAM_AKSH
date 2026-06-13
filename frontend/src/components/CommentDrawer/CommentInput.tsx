import type { Comment } from "@/schema/comment.schema"
import { Send } from "lucide-react"
import { useState } from "react"

interface Props {
  placeholder?: string
  onSubmit: (content: string) => Promise<Comment>
}

export default function CommentInput({
  placeholder = "Write a comment...",
  onSubmit,
}: Props) {
  const [content, setContent] = useState("")

  async function handleSubmit() {
    const value = content.trim()

    if (!value) return

    await onSubmit(value)
    setContent("")
  }

  return (
    <div className="flex gap-2 text-white">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-sm"
      />

      <button onClick={handleSubmit} className="rounded-md bg-purple-600 p-2">
        <Send size={18} />
      </button>
    </div>
  )
}
