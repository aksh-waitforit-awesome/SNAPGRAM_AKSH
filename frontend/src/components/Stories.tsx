import API from "@/api/api"
import { Plus, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom"
import ReactInstaStories from "react-insta-stories"

// 1. Updated types to match the new nested API response
type User = {
  id: string
  username: string
  avatarUrl: string
}

type StoryItem = {
  id: string
  mediaUrl: string
  mediaType: "VIDEO" | "IMAGE"
  caption: string
  authorId: string
  createdAt: string
}

type GroupedStory = {
  author: User
  stories: StoryItem[]
}

async function getStories() {
  const { data } = await API.get("/story")
  return data
}

const Stories = () => {
  const { data, isPending } = useQuery({
    queryKey: ["STORY"],
    queryFn: getStories,
  })

  // 2. We now track the active AUTHOR index instead of a single active story
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null)
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(0)

  const user = useAuthStore((state) => state?.user)
  const navigate = useNavigate()
  const groupedStories: GroupedStory[] = data?.data || []

  // Prepare the data format required by react-insta-stories for the currently active author
  const activeGroup =
    activeGroupIndex !== null ? groupedStories[activeGroupIndex] : null

  const currentInstaStories = useMemo(() => {
    if (!activeGroup) return []

    return activeGroup.stories.map((story) => ({
      url: story.mediaUrl,
      type: story.mediaType === "VIDEO" ? "video" : "image",
      duration: story.mediaType === "IMAGE" ? 5000 : undefined, // Images show for 5s, videos use their own duration
      header: {
        heading: activeGroup.author.username,
        subheading: new Date(story.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        profileImage: activeGroup.author.avatarUrl,
      },
    }))
  }, [activeGroup])

  // Get the caption for the specific story currently being viewed
  const currentCaption = activeGroup?.stories[currentStoryIndex]?.caption

  // 3. Loading Skeleton
  //  AFTER
  if (isPending) {
    return (
      <div className="flex bg-zinc-950 gap-4 p-4 overflow-x-auto no-scrollbar border-b border-zinc-800 w-full max-w-full">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse" />
            <div className="w-12 h-3 bg-zinc-800 animate-pulse rounded-md mt-1" />
          </div>
        ))}
      </div>
    )
  }

  // Extract the grouped stories from the new API response

  return (
    <>
      {/* --- Horizontal Story Feed Bar --- */}

      <div className="bg-zinc-950 border-b border-zinc-800 w-full max-w-full overflow-hidden">
        <div
          className="
      flex
      gap-4
      p-4
      w-full
      overflow-x-auto
      overflow-y-hidden
      touch-pan-x
      scroll-smooth
    "
        >
          {/* Current User Create Story Button */}
          <button
            onClick={() => navigate("/create-story")}
            className="relative w-20 min-w-20 shrink-0 focus:outline-none"
          >
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-yellow-400 via-red-400 to-fuchsia-400 transition-transform active:scale-95">
              <Avatar className="w-14 h-14 border-2 border-white">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback>
                  {user?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="absolute top-0 right-1 flex items-center justify-center w-5 h-5 bg-blue-500 border-2 border-white rounded-full">
              <Plus className="w-3 h-3 text-white" strokeWidth={4} />
            </div>

            <span className="block mt-1 text-xs text-gray-50 text-center font-medium truncate">
              Your Story
            </span>
          </button>
          {/* Stories */}
          {groupedStories.map((group, index) => (
            <button
              key={group.author.id}
              onClick={() => {
                setActiveGroupIndex(index)
                setCurrentStoryIndex(0)
              }}
              className="flex flex-col items-center gap-1 w-20 min-w-20 shrink-0 focus:outline-none"
            >
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 transition-transform active:scale-95">
                <img
                  src={group.author.avatarUrl}
                  alt={group.author.username}
                  className="w-full h-full rounded-full border-2 border-white object-cover"
                />
              </div>

              <span className="text-xs text-gray-50 font-medium truncate w-full text-center">
                {group.author.username}
              </span>
            </button>
          ))}
          {groupedStories.length === 0 && (
            <div className="flex items-center text-sm text-gray-500 py-4 px-2 shrink-0">
              No recent stories.
            </div>
          )}
        </div>
      </div>
      {/* --- Fullscreen Story Viewer Modal using react-insta-stories --- */}
      {activeGroupIndex !== null && currentInstaStories.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center sm:p-4">
          {/* Custom Close Button */}
          <button
            onClick={() => setActiveGroupIndex(null)}
            className="absolute top-4 right-4 z-[60] text-white p-2 hover:bg-white/20 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-full max-w-md h-[100dvh] sm:h-[90vh] relative flex bg-gray-900 sm:rounded-xl overflow-hidden shadow-2xl">
            {/* The key prop forces a fresh instance when the author changes, ensuring it starts from the beginning cleanly */}
            <ReactInstaStories.default
              key={activeGroupIndex}
              stories={currentInstaStories}
              defaultInterval={5000}
              width="100%"
              height="100%"
              keyboardNavigation
              onStoryStart={(s: number) => setCurrentStoryIndex(s)}
              onAllStoriesEnd={() => {
                // When an author's stories end, check if there's a next author
                if (activeGroupIndex < groupedStories.length - 1) {
                  setActiveGroupIndex(activeGroupIndex + 1)
                  setCurrentStoryIndex(0)
                } else {
                  // If it's the last author, close the modal
                  setActiveGroupIndex(null)
                }
              }}
            />

            {/* Custom Caption Overlay that sits on top of react-insta-stories */}
            {currentCaption && (
              <div className="absolute bottom-24 left-0 w-full p-4 text-center z-50 pointer-events-none">
                <span className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm drop-shadow-xl inline-block max-w-[85%] pointer-events-auto">
                  {currentCaption}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Stories
